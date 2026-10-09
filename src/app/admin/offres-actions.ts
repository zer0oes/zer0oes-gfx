"use server";

import { saveAdminTranslations, saveTranslationFields } from "@/lib/save-admin-translations";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isUrssafPeriodicity } from "@/lib/finance";
import type { Formula, Option, Pack } from "@/lib/pricing";
import { optionCategories, type OptionCategory } from "@/lib/pricing";
import { isWatermarkLevel } from "@/lib/protection";
import { getStore } from "@/lib/store";
import { optionContentFromForm, withGroupName, withGrouping, withoutOptionContent } from "@/lib/option-content";

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
  if (!current) done(`/admin/offres?offre=${encodeURIComponent(id)}`, "Offre introuvable.");

  const price = parseEuros(formData.get("price"));
  const name = text(formData, "name", 120);
  if (price === null || !name) done(`/admin/offres?offre=${encodeURIComponent(id)}`, `« ${current.name} » : nom et prix obligatoires.`);

  // Formules : lignes formula_label_N / formula_price_N / formula_id_N / formula_stripe_N
  const formulas: Formula[] = [];
  for (let i = 0; i < 10; i++) {
    const label = text(formData, `formula_label_${i}`, 120);
    if (!label) continue;
    const fPrice = parseEuros(formData.get(`formula_price_${i}`));
    if (fPrice === null) done(`/admin/offres?offre=${encodeURIComponent(id)}`, `« ${name} » : prix de formule invalide (${label}).`);
    const fid = slug(text(formData, `formula_id_${i}`, 60) || (formulas.length === 0 ? "base" : label));
    if (formulas.some((f) => f.id === fid)) done(`/admin/offres?offre=${encodeURIComponent(id)}`, `« ${name} » : deux formules ont le même identifiant (${fid}).`);
    const stripePriceId = text(formData, `formula_stripe_${i}`, 100) || undefined;
    formulas.push({ id: fid, label, price: fPrice, stripePriceId });
  }
  const checkout = formData.get("checkout") === "on";
  if (checkout && formulas.length === 0) {
    done(`/admin/offres?offre=${encodeURIComponent(id)}`, `« ${name} » : une offre commandable en ligne doit avoir au moins une formule.`);
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
    extras: lines(formData, "extras").length ? lines(formData, "extras") : undefined,
    note: text(formData, "note", 1000) || undefined,
    formulas: formulas.length ? formulas : undefined,
    archived: current.archived,
  };
  await store.savePack(pack);
  const translatedFields = Object.fromEntries(["name", "tagline", "deliverables", "extras", "note"].map((field) => [field, `translation:pack:${id}:${field}`]));
  let formulaIndex = 0;
  for (let i = 0; i < 10; i++) {
    if (!text(formData, `formula_label_${i}`, 120)) continue;
    translatedFields[`formula_label_${i}`] = `translation:pack:${id}:formula:${formulas[formulaIndex++].id}:label`;
  }
  await saveTranslationFields(formData, translatedFields);
  done(`/admin/offres?offre=${encodeURIComponent(id)}`);
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
  done(`/admin/offres?offre=${encodeURIComponent(id)}`);
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
  done(`/admin/offres?offre=${encodeURIComponent(ids[j])}`);
}

export async function archivePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const pack = (await store.getCatalog()).packs.find((p) => p.id === text(formData, "id", 60));
  if (!pack) done(TAB.offres, "Offre introuvable.");
  await store.savePack({ ...pack, archived: formData.get("restore") === "1" ? undefined : true });
  done(`/admin/offres?offre=${encodeURIComponent(pack.id)}`);
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
  done(TAB.offres);
}


// --- Options à la carte : une fiche par option -------------------------------------

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
    unit: text(formData, "unit", 30) || undefined,
    category: optionCategories.find((c) => c.id === formData.get("category"))?.id as OptionCategory | undefined,
  };
  await store.saveOptions(options.map((o) => (o.id === id ? next : o)));
  await saveAdminTranslations(formData, `option:${id}`, ["name", "unit"]);
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
  const category = optionCategories.find((c) => c.id === formData.get("category"))?.id as OptionCategory | undefined;
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
