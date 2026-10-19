// Catégories des créations à la carte (filtres de la page Offres, couleur des cartes),
// gérées dans Admin > Offres et réglages > Catalogue > Catégories, puis choisies dans la fiche de chaque produit.
// Rangées dans le contenu JSON existant : « page:offres:categories » (tableau JSON, dans l'ordre des filtres),
// nom anglais « translation:categorie:<id>:name ».
import { optionCategory, type Option } from "./pricing";

export type ProductCategory = { id: string; name: string; color: string };

export const categoriesKey = "page:offres:categories";

// Catégories d'origine : visibles tant que la liste n'a jamais été enregistrée
export const defaultCategories: ProductCategory[] = [
  { id: "overlays", name: "Overlays", color: "#A78BFA" },
  { id: "emotes", name: "Emotes", color: "#E879C6" },
  { id: "branding", name: "Identité visuelle", color: "#818CF8" },
  { id: "motion", name: "Animation", color: "#67D4E8" },
];

const fallbackColor = "#A78BFA";
const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});
export const isColor = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

export function readCategories(raw: unknown): ProductCategory[] {
  const stored = asRecord(raw)[categoriesKey];
  if (typeof stored !== "string") return defaultCategories;
  try {
    const list = JSON.parse(stored);
    if (!Array.isArray(list)) return defaultCategories;
    return list.filter((c): c is ProductCategory => c && typeof c.id === "string" && typeof c.name === "string" && isColor(c.color));
  } catch {
    return defaultCategories;
  }
}

export function writeCategories(raw: unknown, categories: ProductCategory[]): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  content[categoriesKey] = JSON.stringify(categories);
  return content;
}

// Catégorie d'un produit : celle enregistrée si elle existe encore, sinon celle devinée d'après son nom, sinon la première
export function resolveCategory(option: Pick<Option, "name" | "category">, categories: ProductCategory[]): string {
  const ids = categories.map((c) => c.id);
  if (option.category && ids.includes(option.category)) return option.category;
  const guessed = optionCategory({ name: option.name });
  return ids.includes(guessed) ? guessed : ids[0] ?? guessed;
}

export const categoryColor = (categories: ProductCategory[], id: string | undefined) => categories.find((c) => c.id === id)?.color ?? fallbackColor;

// Les produits de chaque catégorie
export function categoryUsage(options: Option[], categories: ProductCategory[]): Record<string, Option[]> {
  const usage: Record<string, Option[]> = {};
  for (const o of options) (usage[resolveCategory(o, categories)] ??= []).push(o);
  return usage;
}

// Couleur d'un type de réalisation du portfolio (logo, overlays, alertes…) : la catégorie de même identifiant ou de même nom,
// sinon celle où ce type de création serait rangé (ex. logo → identité visuelle, alertes → overlays)
const plain = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/s$/, "");
export function portfolioCategoryColor(categories: ProductCategory[], id: string, label: string) {
  const match = categories.find((c) => c.id === id || plain(c.name) === plain(label));
  return match?.color ?? categoryColor(categories, resolveCategory({ name: label }, categories));
}
