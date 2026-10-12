"use server";

import { saveAdminTranslations, saveTranslationFields } from "@/lib/save-admin-translations";
import { translationsFromForm } from "@/lib/admin-translations";
import { homeSections, portfolioPageFields, offersPageFields, type ContentGroup } from "@/lib/home-content";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Emote, Work } from "@/data/portfolio";
import { requireAdmin } from "@/lib/auth";
import { storedPage, toStored } from "@/lib/page-builder";
import { homeFromForm, resetGroup } from "@/lib/home-content";
import { s3Configured, s3Delete, s3SignedUpload } from "@/lib/s3";
import { getStore } from "@/lib/store";
import { checkUpload, sniffType, storagePath, type MediaKind } from "@/lib/uploads";
import { watermarkImage } from "@/lib/watermark";
import { projectCategory, projectName, projectSource, projectUrl } from "@/lib/order-to-project";
import sharp from "sharp";

const text = (f: FormData, k: string, max = 2000) => (f.get(k)?.toString() ?? "").trim().slice(0, max);
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const categories = ["logo", "overlays", "widgets", "alertes", "emotes", "reseaux"] as const;
const groups = ["follower", "abonne", "animee"] as const;

// Les URLs de médias acceptées : fichiers du site, uploads locaux ou stockage Supabase.
function mediaUrl(raw: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith("/")) return raw;
  try {
    const u = new URL(raw);
    return u.protocol === "https:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function done(path: string, error?: string): never {
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
}

// Fiche d'un projet dans l'admin (infos, réalisations, textes)
const projectAdmin = (id: string) => `/admin/portfolio/projet/${encodeURIComponent(id)}`;

// --- Streameurs ----------------------------------------------------------------

export async function saveStreamerAction(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name", 80);
  const existing = text(formData, "id", 60);
  const back = existing ? projectAdmin(existing) : "/admin/portfolio";
  if (!name) done(back, "Le nom du projet est obligatoire.");
  const id = existing || slug(name);
  const url = text(formData, "url", 300);
  if (url && !mediaUrl(url)) done(back, "Le lien de la chaîne doit commencer par https://.");
  const store = getStore();
  // Brouillon et commande d'origine conservés : ce formulaire ne modifie que les informations
  const current = existing ? (await store.getPortfolio()).streamers.find((s) => s.id === existing) : undefined;
  await store.saveStreamer({ id, name, description: text(formData, "description", 300), url: url || undefined, draft: current?.draft, orderId: current?.orderId });
  await saveAdminTranslations(formData, `streamer:${id}`, ["name", "description"]);
  // Nouveau projet : on ouvre directement sa fiche
  done(projectAdmin(id));
}

// Publication d'un projet en brouillon, ou retour en brouillon (masqué sur le site)
export async function setStreamerDraftAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const streamer = (await store.getPortfolio()).streamers.find((s) => s.id === id);
  if (!streamer) done("/admin/portfolio", "Projet introuvable.");
  await store.saveStreamer({ ...streamer, draft: formData.get("draft") === "1" || undefined });
  done(projectAdmin(id));
}

// Commande terminée → projet du portfolio en brouillon : nom et lien de la chaîne repris du brief,
// une réalisation par livrable montrable (visuel redimensionné et filigrané, ou aperçu vidéo),
// avis du client repris seulement s'il en a autorisé la diffusion.
export async function convertOrderToProjectAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const orderId = text(formData, "orderId", 60);
  const back = `/admin/commandes/${encodeURIComponent(orderId)}`;
  const order = await store.getOrder(orderId);
  if (!order) done("/admin/commandes", "Commande introuvable.");
  if (order.status !== "terminee") done(back, "Seule une commande terminée peut devenir un projet du portfolio.");
  const { streamers, works } = await store.getPortfolio();
  const already = streamers.find((s) => s.orderId === order.id);
  if (already) done(projectAdmin(already.id));

  const unique = (base: string, taken: Set<string>) => {
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base.slice(0, 56)}-${n}`;
    taken.add(id);
    return id;
  };
  const name = projectName(order);
  const id = unique(slug(name) || "projet", new Set(streamers.map((s) => s.id)));
  await store.saveStreamer({ id, name, description: "", url: projectUrl(order), draft: true, orderId: order.id });
  // Projet le plus récent en tête du portfolio
  await store.reorderStreamers([id, ...streamers.map((s) => s.id)]);

  const { watermark } = await store.getProtection();
  const workIds = new Set(works.map((w) => w.id));
  let failed = 0;
  for (const item of await store.listDeliverables(order.id)) {
    const category = projectCategory(item);
    const source = projectSource(item);
    if (!category || !source || !store.readDeliverableFile) continue;
    try {
      const bytes = await store.readDeliverableFile(source.path);
      let media: { data: Uint8Array; type: string };
      if (source.kind === "image") {
        // Le fichier HD livré au client ne part jamais tel quel dans le stockage public
        const resized = new Uint8Array(await sharp(bytes, { animated: false }).resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer());
        media = (await watermarkImage(resized, watermark, "image")) ?? { data: resized, type: "image/webp" };
      } else {
        const type = sniffType(bytes);
        if (!type || checkUpload("video", type, bytes.length)) throw new Error(`Vidéo non reprise : ${item.label}`);
        media = { data: bytes, type };
      }
      const url = await store.uploadAsset(storagePath(id, item.label, media.type), media.data, media.type);
      await store.saveWork({
        id: unique(slug(`${id}-${item.label}`) || `${id}-visuel`, workIds),
        streamer: id,
        category,
        title: item.label.slice(0, 120),
        description: "",
        image: source.kind === "image" ? url : undefined,
        video: source.kind === "video" ? url : undefined,
        colors: ["#7c3aed", "#06b6d4"],
      });
    } catch (e) {
      console.error(e);
      failed++;
    }
  }
  const review = order.testimonial;
  if (review?.consent) await store.saveTestimonial({ streamerId: id, author: review.author, quote: review.quote, consent: true, onHome: false });
  done(projectAdmin(id), failed ? `Projet créé, mais ${failed} visuel${failed > 1 ? "s n’ont" : " n’a"} pas pu être repris. Ajoute-le${failed > 1 ? "s" : ""} à la main.` : undefined);
}

export async function deleteStreamerAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 60);
  if (formData.get("confirm") !== "on") done(projectAdmin(id), "Coche la case de confirmation pour supprimer.");
  await getStore().deleteStreamer(id);
  done("/admin/portfolio");
}

// --- Avis client du projet --------------------------------------------------------

// Un avis facultatif par projet ; « supprimer » le retire du site.
export async function saveTestimonialAction(formData: FormData) {
  await requireAdmin();
  const streamerId = text(formData, "streamerId", 60);
  const back = projectAdmin(streamerId);
  const store = getStore();
  if (formData.get("remove") === "1") {
    await store.deleteTestimonial(streamerId);
    done(back);
  }
  const author = text(formData, "author", 80);
  const quote = text(formData, "quote", 600);
  if (!author || !quote) done(back, "Indique au moins le nom du client et son avis.");
  const consent = formData.get("consent") === "on";
  await store.saveTestimonial({
    streamerId,
    author,
    role: text(formData, "role", 80) || undefined,
    quote,
    quoteEn: text(formData, "en:quote", 600) || undefined,
    consent,
    onHome: consent && formData.get("onHome") === "on",
  });
  await saveAdminTranslations(formData, `review:${streamerId}`, ["author", "role"]);
  done(back);
}

// --- Réalisations ----------------------------------------------------------------

export async function saveWorkAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const isNew = formData.get("isNew") === "1";
  const title = text(formData, "title", 120);
  const streamer = text(formData, "streamer", 60);
  const category = text(formData, "category", 20) as Work["category"];
  const back = isNew ? `/admin/portfolio/nouveau?streamer=${streamer}` : `/admin/portfolio/${text(formData, "id", 60)}`;
  if (!title) done(back, "Le titre est obligatoire.");
  if (!categories.includes(category)) done(back, "Type de réalisation invalide.");
  const { streamers, works } = await store.getPortfolio();
  if (!streamers.some((s) => s.id === streamer)) done(back, "Streameur inconnu.");

  let id = isNew ? slug(`${streamer}-${title}`) : text(formData, "id", 60);
  if (isNew) while (works.some((w) => w.id === id)) id = `${id}-2`;
  const existing = works.find((w) => w.id === id);

  const image = text(formData, "image", 500);
  const video = text(formData, "video", 500);
  if ((image && !mediaUrl(image)) || (video && !mediaUrl(video))) done(back, "Adresse de média invalide.");

  // Emotes : lignes existantes (modifiables / supprimables) + nouvelles lignes
  let emotes: Emote[] | undefined;
  if (category === "emotes") {
    emotes = [];
    for (let i = 0; i < 200; i++) {
      const src = mediaUrl(text(formData, `emote_src_${i}`, 500));
      const name = text(formData, `emote_name_${i}`, 40);
      if (!src || !name || formData.get(`emote_delete_${i}`) === "on") continue;
      const group = text(formData, `emote_group_${i}`, 20) as Emote["group"];
      emotes.push({
        name,
        src,
        group: groups.includes(group) ? group : "abonne",
        animated: formData.get(`emote_animated_${i}`) === "on" || src.endsWith(".gif") || undefined,
      });
    }
  }

  await store.saveWork({
    id,
    streamer,
    category,
    title,
    description: text(formData, "description", 500),
    image: mediaUrl(image),
    video: mediaUrl(video),
    colors: existing?.colors ?? ["#7c3aed", "#06b6d4"],
    featured: formData.get("featured") === "on" || undefined,
    emotes,
  });
  const translatedFields = Object.fromEntries(["title", "description"].map((field) => [field, `translation:work:${id}:${field}`]));
  if (category === "emotes") for (let i = 0; i < 200; i++) {
    const name = text(formData, `emote_name_${i}`, 40);
    if (!name || !mediaUrl(text(formData, `emote_src_${i}`, 500)) || formData.get(`emote_delete_${i}`) === "on") continue;
    translatedFields[`emote_name_${i}`] = `translation:work:${id}:emote:${name}:name`;
  }
  await saveTranslationFields(formData, translatedFields);
  done(`/admin/portfolio/${id}`);
}

export async function deleteWorkAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 60);
  if (formData.get("confirm") !== "on") done(`/admin/portfolio/${id}`, "Coche la case de confirmation pour supprimer.");
  const work = (await getStore().getPortfolio()).works.find((w) => w.id === id);
  await getStore().deleteWork(id);
  done(work ? projectAdmin(work.streamer) : "/admin/portfolio");
}

// Ordre des projets sur la page Portfolio (du plus récent au plus ancien, par exemple)
export async function moveStreamerAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const ids = (await store.getPortfolio()).streamers.map((s) => s.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) done("/admin/portfolio");
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await store.reorderStreamers(ids);
  done("/admin/portfolio");
}

export async function moveWorkAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const { works } = await store.getPortfolio();
  const w = works.find((x) => x.id === id);
  if (!w) done("/admin/portfolio", "Réalisation introuvable.");
  // Ordre au sein d'un même streameur et d'un même type
  const siblings = works.filter((x) => x.streamer === w.streamer && x.category === w.category).map((x) => x.id);
  const i = siblings.indexOf(id);
  const j = i + dir;
  if (j < 0 || j >= siblings.length) done(projectAdmin(w.streamer));
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  const others = works.filter((x) => x.streamer === w.streamer && x.category !== w.category).map((x) => x.id);
  await store.reorderWorks([...siblings, ...others]);
  done(projectAdmin(w.streamer));
}

// --- Envoi de médias ---------------------------------------------------------------

export type UploadTicket =
  | { mode: "signed"; path: string; token: string; publicUrl: string }
  | { mode: "s3"; path: string; uploadUrl: string; publicUrl: string }
  | { mode: "direct" }
  | { mode: "error"; message: string };

// Étape 1 : contrôle (admin, type, poids) puis URL d'envoi signée Supabase ;
// sans Supabase (développement), le fichier passera par uploadDirect.
export async function prepareUpload(input: { kind: MediaKind; folder: string; filename: string; type: string; size: number }): Promise<UploadTicket> {
  await requireAdmin();
  const error = checkUpload(input.kind, input.type, input.size);
  if (error) return { mode: "error", message: error };
  const store = getStore();
  // Bucket S3 configuré : le navigateur envoie le fichier directement dans S3 (lien signé)
  if (s3Configured()) {
    const path = storagePath(input.folder, input.filename, input.type);
    return { mode: "s3", path, ...(await s3SignedUpload(path, input.type)) };
  }
  if (store.createSignedUpload) {
    const path = storagePath(input.folder, input.filename, input.type);
    const { token, publicUrl } = await store.createSignedUpload(path);
    return { mode: "signed", path, token, publicUrl };
  }
  if (store.kind === "static") return { mode: "error", message: "Aucun stockage configuré (voir README)." };
  return { mode: "direct" };
}

// Envoi via le serveur (magasin local de développement uniquement).
export async function uploadDirect(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const store = getStore();
  if (store.kind !== "local") return { error: "Envoi direct indisponible." };
  const file = formData.get("file");
  const kind = text(formData, "kind", 10) as MediaKind;
  if (!(file instanceof File)) return { error: "Fichier manquant." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const real = sniffType(bytes);
  const error = real ? checkUpload(kind, real, bytes.length) : "Format de fichier non reconnu.";
  if (error) return { error };
  // Images du portfolio : filigrane incrusté selon le réglage de l'admin
  let data: Uint8Array = bytes;
  let type = real!;
  if (kind === "image" || kind === "emote") {
    const wm = await watermarkImage(bytes, (await store.getProtection()).watermark, kind);
    if (wm) ({ data, type } = wm);
  }
  const url = await store.uploadAsset(storagePath(text(formData, "folder", 60), file.name, type), data, type);
  return { url };
}

// Après un envoi signé vers Supabase : incruste le filigrane dans l'image côté serveur.
export async function finalizeUpload(input: { path: string; kind: MediaKind; publicUrl: string }): Promise<{ url: string; error?: string }> {
  await requireAdmin();
  const store = getStore();
  if (input.kind === "video" || !store.downloadAsset) return { url: input.publicUrl };
  if (!/^[a-z0-9-]+\/[a-z0-9-]+\.[a-z0-9]+$/.test(input.path)) return { url: input.publicUrl, error: "Chemin invalide." };
  const bytes = await store.downloadAsset(input.path);
  const real = sniffType(bytes);
  const error = real ? checkUpload(input.kind, real, bytes.length) : "Format de fichier non reconnu.";
  if (error) return { url: "", error };
  if (input.kind === "portrait") return { url: input.publicUrl };
  const wm = await watermarkImage(bytes, (await store.getProtection()).watermark, input.kind);
  if (!wm) return { url: input.publicUrl };
  const marked = input.path.replace(/\.[a-z0-9]+$/, ".webp");
  const url = await store.uploadAsset(marked, wm.data, wm.type);
  // L'original sans filigrane ne doit pas rester accessible publiquement
  if (marked !== input.path && s3Configured()) await s3Delete(input.path).catch((e) => console.error(e));
  return { url };
}


// --- Page d'accueil -----------------------------------------------------------------

// Page d'accueil et textes de la page Portfolio : enregistrés ensemble, chaque formulaire
// ne remplace que les textes de sa page.
async function saveContent(formData: FormData, group: ContentGroup, back: string) {
  await requireAdmin();
  const store = getStore();
  const stored = await store.getHomeContent();
  if (formData.get("reset") === "1") {
    if (formData.get("confirm") !== "on") done(back, "Coche la case de confirmation.");
    await store.saveHomeContent(resetGroup(stored, group));
    done(back);
  }
  const fields = group === "offres" ? offersPageFields : group === "portfolio" ? portfolioPageFields : homeSections.flatMap((section) => section.fields);
  const translated = translationsFromForm(stored, formData, Object.fromEntries(fields.filter((field) => field.kind !== "work" && field.kind !== "emotes" && field.key !== "hero.emotes").map((field) => [`h:${field.key}`, `en:${field.key}`])));
  await store.saveHomeContent(homeFromForm((key) => formData.get(`h:${key}`)?.toString(), translated, group));
  done(back);
}

export async function saveHomeAction(formData: FormData) {
  await saveContent(formData, "accueil", "/admin/accueil");
}

export async function savePortfolioPageAction(formData: FormData) {
  await saveContent(formData, "portfolio", "/admin/portfolio");
}

export async function saveOffersPageAction(formData: FormData) {
  await saveContent(formData, "offres", "/admin/offres");
}

// --- Mise en page des projets (constructeur de blocs) ------------------------------

export type PageSaveResult = { ok: true; savedAt: string } | { ok: false; error: string };

// Page envoyée par l'éditeur : vérifiée (dispositions connues, visuels du projet, longueurs) puis enregistrée.
export async function saveProjectPageAction(id: string, page: unknown): Promise<PageSaveResult> {
  await requireAdmin();
  const store = getStore();
  const { streamers, works } = await store.getPortfolio();
  if (!streamers.some((s) => s.id === id)) return { ok: false, error: "Projet introuvable." };
  const clean = storedPage(toStored(page as never));
  if (!clean) return { ok: false, error: "Mise en page illisible." };
  const own = new Set(works.filter((w) => w.streamer === id).map((w) => w.id));
  clean.blocks = clean.blocks.map((b) => ({ ...b, slots: b.slots.filter((s) => own.has(s.work)) }));
  if (clean.header.hero && !own.has(clean.header.hero)) clean.header.hero = undefined;
  await store.saveCaseStudyTexts(id, toStored(clean));
  revalidatePath("/", "layout");
  return { ok: true, savedAt: new Date().toISOString() };
}

// Retour à la mise en page d'origine (ou à aucune page dédiée pour un nouveau projet)
export async function resetProjectPageAction(id: string): Promise<PageSaveResult> {
  await requireAdmin();
  await getStore().saveCaseStudyTexts(id, null);
  revalidatePath("/", "layout");
  return { ok: true, savedAt: new Date().toISOString() };
}
