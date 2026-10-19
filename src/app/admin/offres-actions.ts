"use server";

import { saveAdminTranslations, saveTranslationFields } from "@/lib/save-admin-translations";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isUrssafPeriodicity } from "@/lib/finance";
import type { Formula, Option, Pack } from "@/lib/pricing";
import { isWatermarkLevel } from "@/lib/protection";
import { getStore } from "@/lib/store";
import { optionContentFromForm, withCopiedOptionContent, withGroupName, withGrouping, withoutOptionContent } from "@/lib/option-content";
import { MAX_CSS, MAX_MARKUP, readVisuals, starterVisual, visualId, writeVisuals } from "@/lib/product-visuals";
import { defaultCategories, isColor, readCategories, writeCategories } from "@/lib/product-categories";
import { compositionFromForm, readComposition, writeComposition } from "@/lib/pack-composition";

// Conversion « 490 », « 490,50 » ou « 1 990 » (€) → centimes. null si invalide.
function parseEuros(raw: FormDataEntryValue | null): number | null {
  const s = (raw?.toString() ?? "").replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

const text = (f: FormData, k: string, max = 2000) => (f.get(k)?.toString() ?? "").trim().slice(0, max);
const lines = (f: FormData, k: string) =>
  text(f, k, 5000)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

// Onglets de la page Offres et réglages : on revient sur celui de l'action
const TAB = {
  offres: "/admin/offres",
  options: "/admin/offres?onglet=options",
  categories: "/admin/offres?onglet=categories",
  visuels: "/admin/offres?onglet=visuels",
  reglages: "/admin/offres?onglet=reglages",
  cotisations: "/admin/offres?onglet=cotisations",
} as const;

function done(path: string, error?: string): never {
  // Le site public relit le catalogue (pages pré-rendues comprises).
  revalidatePath("/", "layout");
  redirect(`${path}${path.includes("?") ? "&" : "?"}${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const depositPercent = Number(text(formData, "depositPercent"));
  const logoDiscount = parseEuros(formData.get("logoDiscount"));
  const deliveryDays = text(formData, "deliveryDays", 50);
  if (!Number.isInteger(depositPercent) || depositPercent < 0 || depositPercent > 100) {
    done(TAB.reglages, "L'acompte doit être un nombre entier entre 0 et 100.");
  }
  if (logoDiscount === null) done(TAB.reglages, "Montant de remise invalide.");
  if (!deliveryDays) done(TAB.reglages, "Le délai de livraison est obligatoire.");
  await getStore().saveSettings({ depositPercent, logoDiscount, deliveryDays });
  await saveAdminTranslations(formData, "settings", ["deliveryDays"]);
  done(TAB.reglages);
}

export async function savePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const current = (await store.getCatalog()).packs.find((p) => p.id === id);
  if (!current) done(`/admin/offres/${encodeURIComponent(id)}`, "Offre introuvable.");

  const price = parseEuros(formData.get("price"));
  const name = text(formData, "name", 120);
  if (price === null || !name) done(`/admin/offres/${encodeURIComponent(id)}`, `« ${current.name} » : nom et prix obligatoires.`);

  // Formules : lignes formula_label_N / formula_price_N / formula_id_N / formula_stripe_N
  const formulas: Formula[] = [];
  // Option ajoutée dans l'admin : sa composition arrive sous « new-<ligne> »
  const newFormulaKeys: Record<string, string> = {};
  for (let i = 0; i < 10; i++) {
    const label = text(formData, `formula_label_${i}`, 120);
    if (!label) continue;
    const fPrice = parseEuros(formData.get(`formula_price_${i}`));
    if (fPrice === null) done(`/admin/offres/${encodeURIComponent(id)}`, `« ${name} » : prix de formule invalide (${label}).`);
    const fid = slug(text(formData, `formula_id_${i}`, 60) || (formulas.length === 0 ? "base" : label));
    if (formulas.some((f) => f.id === fid)) done(`/admin/offres/${encodeURIComponent(id)}`, `« ${name} » : deux formules ont le même identifiant (${fid}).`);
    const stripePriceId = text(formData, `formula_stripe_${i}`, 100) || undefined;
    formulas.push({ id: fid, label, price: fPrice, stripePriceId });
    if (!text(formData, `formula_id_${i}`, 60)) newFormulaKeys[`new-${i}`] = fid;
  }
  const checkout = formData.get("checkout") === "on";
  if (checkout && formulas.length === 0) {
    done(`/admin/offres/${encodeURIComponent(id)}`, `« ${name} » : une offre commandable en ligne doit avoir au moins une formule.`);
  }

  const pack: Pack = {
    id,
    name,
    tagline: text(formData, "tagline", 300),
    price,
    priceFrom: formData.get("priceFrom") === "on" || undefined,
    checkout,
    highlight: formData.get("highlight") === "on" || undefined,
    deliverables: lines(formData, "deliverables"),
    // Offre commandable : options générées par les formules (le champ n'est affiché que pour une offre sur devis)
    extras: formData.has("extras") ? (lines(formData, "extras").length ? lines(formData, "extras") : undefined) : current.extras,
    note: current.note,
    formulas: formulas.length ? formulas : undefined,
    archived: current.archived,
  };
  await store.savePack(pack);
  const translatedFields = Object.fromEntries(["name", "tagline", "deliverables", ...(formData.has("extras") ? ["extras"] : [])].map((field) => [field, `translation:pack:${id}:${field}`]));
  let formulaIndex = 0;
  for (let i = 0; i < 10; i++) {
    if (!text(formData, `formula_label_${i}`, 120)) continue;
    translatedFields[`formula_label_${i}`] = `translation:pack:${id}:formula:${formulas[formulaIndex++].id}:label`;
  }
  await saveTranslationFields(formData, translatedFields);
  // Composition à partir des produits à la carte : pack de base, puis produits ajoutés par chaque autre formule
  if (formData.has("composition")) {
    const { options } = await store.getCatalog();
    const composition = compositionFromForm(text(formData, "composition", 20000), formulas.slice(1).map((f) => f.id), options, newFormulaKeys);
    await store.saveHomeContent(writeComposition(await store.getHomeContent(), id, composition));
  }
  done(`/admin/offres/${encodeURIComponent(id)}`);
}


// --- Revenu net : taux et frais ------------------------------------------------

function percent(f: FormData, k: string): number | null {
  const n = Number(text(f, k, 10).replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 100) / 100 : null;
}

export async function saveFinanceAction(formData: FormData) {
  await requireAdmin();
  const urssafRate = percent(formData, "urssafRate");
  const cfpRate = percent(formData, "cfpRate");
  const vlRate = percent(formData, "vlRate");
  const stripePercent = percent(formData, "stripePercent");
  const stripeFixed = parseEuros(formData.get("stripeFixed"));
  if (urssafRate === null || cfpRate === null || vlRate === null || stripePercent === null) {
    done(TAB.cotisations, "Les taux doivent être des pourcentages entre 0 et 100.");
  }
  if (stripeFixed === null) done(TAB.cotisations, "Frais fixe Stripe invalide.");
  const periodicity = formData.get("urssafPeriodicity");
  await getStore().saveFinance({
    urssafRate,
    cfpRate,
    vlEnabled: formData.get("vlEnabled") === "on",
    vlRate,
    stripePercent,
    stripeFixed,
    abbySendInvoice: formData.get("abbySendInvoice") === "on",
    urssafPeriodicity: isUrssafPeriodicity(periodicity) ? periodicity : "trimestrielle",
  });
  done(TAB.cotisations);
}

// --- Protection du portfolio ------------------------------------------------------

export async function saveProtectionAction(formData: FormData) {
  await requireAdmin();
  const watermark = text(formData, "watermark", 20);
  if (!isWatermarkLevel(watermark)) done(TAB.reglages, "Niveau de filigrane invalide.");
  await getStore().saveProtection({ blur: formData.get("blur") === "on", watermark });
  done(TAB.reglages);
}

// --- Offres : ajout, ordre, archivage, suppression ------------------------------

export async function createPackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const name = text(formData, "name", 120);
  const price = parseEuros(formData.get("price"));
  if (!name || price === null) done(TAB.offres, "Nom et prix obligatoires pour une nouvelle offre.");
  const { packs } = await store.getCatalog();
  let id = slug(name) || "offre";
  while (packs.some((p) => p.id === id)) id = `${id}-2`;
  const checkout = formData.get("checkout") === "on";
  await store.savePack({
    id,
    name,
    tagline: "",
    price,
    checkout,
    deliverables: [],
    formulas: checkout ? [{ id: "base", label: name, price }] : undefined,
  });
  await saveAdminTranslations(formData, `pack:${id}`, ["name"]);
  done(`/admin/offres/${encodeURIComponent(id)}`);
}

export async function movePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const ids = (await store.getCatalog()).packs.map((p) => p.id);
  const i = ids.indexOf(text(formData, "id", 60));
  const j = i + (formData.get("dir") === "up" ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) done(TAB.offres);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await store.reorderPacks(ids);
  done(TAB.offres);
}

export async function archivePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const pack = (await store.getCatalog()).packs.find((p) => p.id === text(formData, "id", 60));
  if (!pack) done(TAB.offres, "Offre introuvable.");
  await store.savePack({ ...pack, archived: formData.get("restore") === "1" ? undefined : true });
  done(`/admin/offres/${encodeURIComponent(pack.id)}`);
}

// Copie de traductions (« translation:<scope>:… ») d'un élément vers sa copie ; le nom anglais prend « (copy) »
function withCopiedTranslations(raw: unknown, from: string, to: string): Record<string, string> {
  const content = Object.fromEntries(Object.entries(raw && typeof raw === "object" ? raw : {}).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  for (const [key, value] of Object.entries(content)) {
    if (!key.startsWith(`translation:${from}:`)) continue;
    const field = key.slice(`translation:${from}:`.length);
    content[`translation:${to}:${field}`] = field === "name" ? `${value} (copy)` : value;
  }
  return content;
}

// Copie placée juste après l'original et masquée du site (archivée) le temps de la modifier, puis ouverte
export async function duplicatePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const { packs } = await store.getCatalog();
  const pack = packs.find((p) => p.id === text(formData, "id", 60));
  if (!pack) done(TAB.offres, "Offre introuvable.");
  const name = `${pack.name} (copie)`;
  let id = slug(name) || "offre";
  while (packs.some((p) => p.id === id)) id = `${id}-2`;
  await store.savePack({ ...pack, id, name, archived: true, highlight: undefined });
  const ids = packs.map((p) => p.id);
  ids.splice(ids.indexOf(pack.id) + 1, 0, id);
  await store.reorderPacks(ids);
  const content = await store.getHomeContent();
  await store.saveHomeContent(writeComposition(withCopiedTranslations(content, `pack:${pack.id}`, `pack:${id}`), id, readComposition(content, pack.id)));
  done(`/admin/offres/${encodeURIComponent(id)}`);
}

// Suppression définitive, sauf si des commandes existent : l'offre est alors archivée.
export async function deletePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  if (formData.get("confirm") !== "on") done(TAB.offres, "Coche la case de confirmation pour supprimer.");
  const pack = (await store.getCatalog()).packs.find((p) => p.id === id);
  if (!pack) done(TAB.offres, "Offre introuvable.");
  const hasOrders = (await store.listOrders()).some((o) => o.packId === id);
  if (hasOrders) {
    await store.savePack({ ...pack, archived: true });
    done(TAB.offres, `« ${pack.name} » a des commandes : elle a été archivée (masquée du site) plutôt que supprimée.`);
  }
  await store.deletePack(id);
  await store.saveHomeContent(writeComposition(await store.getHomeContent(), id, {}));
  done(TAB.offres);
}


// --- Options à la carte : une fiche par option -------------------------------------

// Catégorie choisie dans la fiche, si elle existe dans la liste de l'onglet Catégories
async function categoryFrom(formData: FormData) {
  const id = text(formData, "category", 60);
  return readCategories(await getStore().getHomeContent()).find((c) => c.id === id)?.id;
}

const optionTab = (id?: string) => `${TAB.options}${id ? `&option=${encodeURIComponent(id)}#option-${id}` : ""}`;

// Fiche d'une option : réglages (catalogue), textes FR/EN, contenu de la carte (description, « Tu reçois », compatibilité)
export async function saveOptionAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const { options } = await store.getCatalog();
  const current = options.find((o) => o.id === id);
  if (!current) done(TAB.options, "Option introuvable.");
  const name = text(formData, "name", 200);
  if (!name) done(optionTab(id), "Le nom de l'option est obligatoire.");
  const price = parseEuros(formData.get("price"));
  if (price === null) done(optionTab(id), "Prix invalide.");
  const next: Option = {
    ...current,
    name,
    price,
    priceFrom: formData.get("priceFrom") === "on" || undefined,
    unit: undefined, // champ retiré de l'admin : plus d'unité après le prix
    category: await categoryFrom(formData),
  };
  await store.saveOptions(options.map((o) => (o.id === id ? next : o)));
  await saveAdminTranslations(formData, `option:${id}`, ["name"]);
  const content = optionContentFromForm(await store.getHomeContent(), id, formData);
  await store.saveHomeContent(withGroupName(withGrouping(content, options, id, text(formData, "groupWith", 60)), next, formData));
  done(optionTab(id));
}

export async function createOptionAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const name = text(formData, "name", 200);
  const price = parseEuros(formData.get("price"));
  if (!name || price === null) done(TAB.options, "Indique un nom et un prix valides.");
  const { options } = await store.getCatalog();
  let id = slug(name) || "option";
  while (options.some((o) => o.id === id)) id = `${id}-2`;
  const category = await categoryFrom(formData);
  await store.saveOptions([...options, { id, name, price, priceFrom: formData.get("priceFrom") === "on" || undefined, category }]);
  done(optionTab(id));
}

export async function moveOptionAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const { options } = await store.getCatalog();
  const i = options.findIndex((o) => o.id === id);
  const j = formData.get("dir") === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= options.length) done(TAB.options);
  const next = [...options];
  [next[i], next[j]] = [next[j], next[i]];
  await store.saveOptions(next);
  done(TAB.options);
}

export async function deleteOptionAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  if (formData.get("confirm") !== "on") done(optionTab(id), "Coche la case de confirmation pour supprimer.");
  const { options } = await store.getCatalog();
  await store.saveOptions(options.filter((o) => o.id !== id));
  await store.saveHomeContent(withoutOptionContent(await store.getHomeContent(), id));
  done(TAB.options);
}

// Copie placée juste après l'original (avec le contenu de sa carte, sur une carte à part), puis ouverte
export async function duplicateOptionAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const { options } = await store.getCatalog();
  const i = options.findIndex((o) => o.id === text(formData, "id", 60));
  if (i < 0) done(TAB.options, "Option introuvable.");
  const name = `${options[i].name} (copie)`;
  let id = slug(name) || "option";
  while (options.some((o) => o.id === id)) id = `${id}-2`;
  await store.saveOptions([...options.slice(0, i + 1), { ...options[i], id, name }, ...options.slice(i + 1)]);
  const content = withCopiedOptionContent(await store.getHomeContent(), options[i].id, id);
  await store.saveHomeContent(withCopiedTranslations(content, `option:${options[i].id}`, `option:${id}`));
  done(optionTab(id));
}

// Nouvel ordre des options (glisser-déposer dans le tableau de l'admin)
export async function reorderOptionsAction(ids: string[]) {
  await requireAdmin();
  const store = getStore();
  const { options } = await store.getCatalog();
  const rank = new Map(ids.map((id, i) => [id, i]));
  const next = [...options].sort((a, b) => (rank.get(a.id) ?? options.length) - (rank.get(b.id) ?? options.length));
  await store.saveOptions(next);
  revalidatePath("/", "layout");
}

// Nouvel ordre des offres (poignée dans le tableau de l'admin)
export async function reorderPacksAction(ids: string[]) {
  await requireAdmin();
  const store = getStore();
  const current = (await store.getCatalog()).packs.map((p) => p.id);
  // Seulement des offres existantes, toutes présentes
  if (ids.length !== current.length || !ids.every((id) => current.includes(id))) return;
  await store.reorderPacks(ids);
  revalidatePath("/", "layout");
}

// Nom anglais d'un visuel ou d'une catégorie (vide : le nom français est repris sur /en)
const nameEnKey = (scope: "visuel" | "categorie", id: string) => `translation:${scope}:${id}:name`;
function withNameEn(content: Record<string, string>, scope: "visuel" | "categorie", id: string, nameEn: string | undefined) {
  const key = nameEnKey(scope, id);
  const next = { ...content };
  if (nameEn?.trim()) next[key] = nameEn.trim().slice(0, 80);
  else delete next[key];
  return next;
}
const storedNameEn = (content: unknown, scope: "visuel" | "categorie", id: string) => {
  const value = content && typeof content === "object" ? (content as Record<string, unknown>)[nameEnKey(scope, id)] : undefined;
  return typeof value === "string" ? value : "";
};

// Visuels des créations à la carte (dessins en code) : bibliothèque rangée dans le contenu JSON
const visualTab = (id?: string) => `${TAB.visuels}${id ? `&visuel=${encodeURIComponent(id)}#visuel-${id}` : ""}`;

export async function createVisualAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const name = text(formData, "name", 80);
  if (!name) done(`${TAB.visuels}&visuel=nouveau`, "Le nom du visuel est obligatoire.");
  const content = await store.getHomeContent();
  const visuals = readVisuals(content);
  const id = visualId(name, visuals.map((v) => v.id));
  await store.saveHomeContent(withNameEn(writeVisuals(content, [...visuals, { id, name, ...starterVisual }]), "visuel", id, text(formData, "nameEn", 80)));
  done(visualTab(id));
}

// Enregistrement automatique depuis l'éditeur du visuel (sans rechargement de page)
export async function autosaveVisualAction(id: string, draft: { name: string; nameEn: string; markup: string; css: string }): Promise<{ ok: true } | { ok: false; message: string }> {
  await requireAdmin();
  const store = getStore();
  const name = draft.name.trim().slice(0, 80);
  if (!name) return { ok: false, message: "Le nom du visuel est obligatoire." };
  const content = await store.getHomeContent();
  const visuals = readVisuals(content);
  if (!visuals.some((v) => v.id === id)) return { ok: false, message: "Visuel introuvable." };
  const clip = (v: string, max: number) => v.replace(/\r/g, "").trim().slice(0, max);
  await store.saveHomeContent(withNameEn(writeVisuals(content, visuals.map((v) => (v.id === id ? { id, name, markup: clip(draft.markup, MAX_MARKUP), css: clip(draft.css, MAX_CSS) } : v))), "visuel", id, draft.nameEn));
  revalidatePath("/", "layout");
  return { ok: true };
}

// Copie placée juste après l'original, puis ouverte
export async function duplicateVisualAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const content = await store.getHomeContent();
  const visuals = readVisuals(content);
  const i = visuals.findIndex((v) => v.id === text(formData, "id", 60));
  if (i < 0) done(TAB.visuels, "Visuel introuvable.");
  const name = `${visuals[i].name} (copie)`.slice(0, 80);
  const copy = { ...visuals[i], id: visualId(name, visuals.map((v) => v.id)), name };
  const nameEn = storedNameEn(content, "visuel", visuals[i].id);
  await store.saveHomeContent(withNameEn(writeVisuals(content, [...visuals.slice(0, i + 1), copy, ...visuals.slice(i + 1)]), "visuel", copy.id, nameEn && `${nameEn} (copy)`));
  done(visualTab(copy.id));
}

// Les produits qui l'utilisaient reprennent le visuel choisi d'après leur nom
export async function deleteVisualAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const content = await store.getHomeContent();
  await store.saveHomeContent(withNameEn(writeVisuals(content, readVisuals(content).filter((v) => v.id !== id)), "visuel", id, ""));
  done(TAB.visuels);
}

// Catégories des créations à la carte (filtres de la page Offres) : liste rangée dans le contenu JSON
const categoryTab = (id?: string) => `${TAB.categories}${id ? `&categorie=${encodeURIComponent(id)}#categorie-${id}` : ""}`;

export async function createCategoryAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const name = text(formData, "name", 60);
  if (!name) done(`${TAB.categories}&categorie=nouvelle`, "Le nom de la catégorie est obligatoire.");
  const content = await store.getHomeContent();
  const categories = readCategories(content);
  const id = visualId(name, categories.map((c) => c.id));
  // Couleur de départ : une des couleurs d'origine pas encore prise
  const color = defaultCategories.map((c) => c.color).find((c) => !categories.some((x) => x.color === c)) ?? defaultCategories[0].color;
  await store.saveHomeContent(withNameEn(writeCategories(content, [...categories, { id, name, color }]), "categorie", id, text(formData, "nameEn", 60)));
  done(categoryTab(id));
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const name = text(formData, "name", 60);
  const color = text(formData, "color", 7);
  if (!name) done(categoryTab(id), "Le nom de la catégorie est obligatoire.");
  if (!isColor(color)) done(categoryTab(id), "Couleur invalide (format #RRGGBB).");
  const content = await store.getHomeContent();
  const categories = readCategories(content);
  if (!categories.some((c) => c.id === id)) done(TAB.categories, "Catégorie introuvable.");
  await store.saveHomeContent(writeCategories(content, categories.map((c) => (c.id === id ? { id, name, color } : c))));
  await saveAdminTranslations(formData, `categorie:${id}`, ["name"]);
  done(categoryTab(id));
}

// Copie placée juste après l'original, puis ouverte (sans produits : ils restent dans l'original)
export async function duplicateCategoryAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const content = await store.getHomeContent();
  const categories = readCategories(content);
  const i = categories.findIndex((c) => c.id === text(formData, "id", 60));
  if (i < 0) done(TAB.categories, "Catégorie introuvable.");
  const name = `${categories[i].name} (copie)`.slice(0, 60);
  const copy = { ...categories[i], id: visualId(name, categories.map((c) => c.id)), name };
  const nameEn = storedNameEn(content, "categorie", categories[i].id);
  await store.saveHomeContent(withNameEn(writeCategories(content, [...categories.slice(0, i + 1), copy, ...categories.slice(i + 1)]), "categorie", copy.id, nameEn && `${nameEn} (copy)`));
  done(categoryTab(copy.id));
}

// Les produits de la catégorie supprimée reprennent celle devinée d'après leur nom (ou la première)
export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const content = await store.getHomeContent();
  await store.saveHomeContent(withNameEn(writeCategories(content, readCategories(content).filter((c) => c.id !== id)), "categorie", id, ""));
  done(TAB.categories);
}

// Nouvel ordre des catégories (ordre des filtres sur la page Offres)
export async function reorderCategoriesAction(ids: string[]) {
  await requireAdmin();
  const store = getStore();
  const content = await store.getHomeContent();
  const categories = readCategories(content);
  if (ids.length !== categories.length || !categories.every((c) => ids.includes(c.id))) return;
  await store.saveHomeContent(writeCategories(content, ids.map((id) => categories.find((c) => c.id === id)!)));
  revalidatePath("/", "layout");
}
