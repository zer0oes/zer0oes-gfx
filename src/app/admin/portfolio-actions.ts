"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Emote, Work } from "@/data/portfolio";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { checkUpload, sniffType, storagePath, type MediaKind } from "@/lib/uploads";

const text = (f: FormData, k: string, max = 2000) => (f.get(k)?.toString() ?? "").trim().slice(0, max);
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
const categories = ["overlays", "widgets", "alertes", "emotes"] as const;
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

// --- Streameurs ----------------------------------------------------------------

export async function saveStreamerAction(formData: FormData) {
  await requireAdmin();
  const name = text(formData, "name", 80);
  if (!name) done("/admin/portfolio", "Le nom du streameur est obligatoire.");
  const id = text(formData, "id", 60) || slug(name);
  const url = text(formData, "url", 300);
  if (url && !mediaUrl(url)) done("/admin/portfolio", "Le lien de la chaîne doit commencer par https://.");
  await getStore().saveStreamer({ id, name, description: text(formData, "description", 300), url: url || undefined });
  done("/admin/portfolio");
}

export async function deleteStreamerAction(formData: FormData) {
  await requireAdmin();
  if (formData.get("confirm") !== "on") done("/admin/portfolio", "Coche la case de confirmation pour supprimer.");
  await getStore().deleteStreamer(text(formData, "id", 60));
  done("/admin/portfolio");
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
  done(`/admin/portfolio/${id}`);
}

export async function deleteWorkAction(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 60);
  if (formData.get("confirm") !== "on") done(`/admin/portfolio/${id}`, "Coche la case de confirmation pour supprimer.");
  await getStore().deleteWork(id);
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
  if (j < 0 || j >= siblings.length) done("/admin/portfolio");
  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  const others = works.filter((x) => x.streamer === w.streamer && x.category !== w.category).map((x) => x.id);
  await store.reorderWorks([...siblings, ...others]);
  done("/admin/portfolio");
}

// --- Envoi de médias ---------------------------------------------------------------

export type UploadTicket =
  | { mode: "signed"; path: string; token: string; publicUrl: string }
  | { mode: "direct" }
  | { mode: "error"; message: string };

// Étape 1 : contrôle (admin, type, poids) puis URL d'envoi signée Supabase ;
// sans Supabase (développement), le fichier passera par uploadDirect.
export async function prepareUpload(input: { kind: MediaKind; folder: string; filename: string; type: string; size: number }): Promise<UploadTicket> {
  await requireAdmin();
  const error = checkUpload(input.kind, input.type, input.size);
  if (error) return { mode: "error", message: error };
  const store = getStore();
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
  const url = await store.uploadAsset(storagePath(text(formData, "folder", 60), file.name, real!), bytes, real!);
  return { url };
}
