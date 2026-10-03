"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Formula, Option, Pack } from "@/lib/pricing";
import { getStore } from "@/lib/store";

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

function done(path: string, error?: string): never {
  // Le site public relit le catalogue (pages pré-rendues comprises).
  revalidatePath("/", "layout");
  redirect(`${path}?${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const depositPercent = Number(text(formData, "depositPercent"));
  const logoDiscount = parseEuros(formData.get("logoDiscount"));
  const deliveryDays = text(formData, "deliveryDays", 50);
  if (!Number.isInteger(depositPercent) || depositPercent < 0 || depositPercent > 100) {
    done("/admin/offres", "L'acompte doit être un nombre entier entre 0 et 100.");
  }
  if (logoDiscount === null) done("/admin/offres", "Montant de remise invalide.");
  if (!deliveryDays) done("/admin/offres", "Le délai de livraison est obligatoire.");
  await getStore().saveSettings({ depositPercent, logoDiscount, deliveryDays });
  done("/admin/offres");
}

export async function savePackAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const id = text(formData, "id", 60);
  const current = (await store.getCatalog()).packs.find((p) => p.id === id);
  if (!current) done("/admin/offres", "Offre introuvable.");

  const price = parseEuros(formData.get("price"));
  const name = text(formData, "name", 120);
  if (price === null || !name) done("/admin/offres", `« ${current.name} » : nom et prix obligatoires.`);

  // Formules : lignes formula_label_N / formula_price_N / formula_id_N / formula_stripe_N
  const formulas: Formula[] = [];
  for (let i = 0; i < 10; i++) {
    const label = text(formData, `formula_label_${i}`, 120);
    if (!label) continue;
    const fPrice = parseEuros(formData.get(`formula_price_${i}`));
    if (fPrice === null) done("/admin/offres", `« ${name} » : prix de formule invalide (${label}).`);
    const fid = slug(text(formData, `formula_id_${i}`, 60) || (formulas.length === 0 ? "base" : label));
    if (formulas.some((f) => f.id === fid)) done("/admin/offres", `« ${name} » : deux formules ont le même identifiant (${fid}).`);
    const stripePriceId = text(formData, `formula_stripe_${i}`, 100) || undefined;
    formulas.push({ id: fid, label, price: fPrice, stripePriceId });
  }
  const checkout = formData.get("checkout") === "on";
  if (checkout && formulas.length === 0) {
    done("/admin/offres", `« ${name} » : une offre commandable en ligne doit avoir au moins une formule.`);
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
  };
  await store.savePack(pack);
  done("/admin/offres");
}

export async function saveOptionsAction(formData: FormData) {
  await requireAdmin();
  const options: Option[] = [];
  for (let i = 0; i < 50; i++) {
    const name = text(formData, `name_${i}`, 200);
    if (!name || formData.get(`delete_${i}`) === "on") continue;
    const price = parseEuros(formData.get(`price_${i}`));
    if (price === null) done("/admin/offres", `Option « ${name} » : prix invalide.`);
    let id = slug(text(formData, `id_${i}`, 60) || name);
    while (options.some((o) => o.id === id)) id = `${id}-2`;
    options.push({
      id,
      name,
      price,
      priceFrom: formData.get(`from_${i}`) === "on" || undefined,
      unit: text(formData, `unit_${i}`, 30) || undefined,
    });
  }
  await getStore().saveOptions(options);
  done("/admin/offres");
}
