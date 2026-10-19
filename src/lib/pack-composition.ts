// Composition des offres (packs) à partir des produits à la carte : le pack de base (produits et quantités), puis
// pour chaque autre formule (« option » du pack) les produits ajoutés au pack de base.
// Sert dans l'admin à comparer la valeur à la carte au prix, et génère les livrables du pack sur le site.
// Rangé dans le contenu JSON existant (pas de colonne en base) : « page:offres:composition:<id de l'offre> »
// = { "_base": [{ "option": "<id produit>", "qty": 2 }, …], "<id de formule>": [produits ajoutés…] }.
import { formatOfferPrice, splitOptionName, type Option } from "./pricing";

export type CompositionItem = { option: string; qty: number };
export type PackComposition = Record<string, CompositionItem[]>;

export const compositionKey = (packId: string) => `page:offres:composition:${packId}`;
export const MAX_QTY = 99;
// Clé du pack de base (un identifiant de formule ne commence jamais par « _ »)
export const BASE = "_base";

const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

export function cleanItems(list: unknown): CompositionItem[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const { option, qty } = asRecord(item);
    const n = Math.floor(Number(qty));
    return typeof option === "string" && option && Number.isFinite(n) && n >= 1 ? [{ option: option.slice(0, 60), qty: Math.min(n, MAX_QTY) }] : [];
  }).slice(0, 50);
}

export function readComposition(raw: unknown, packId: string): PackComposition {
  const stored = asRecord(raw)[compositionKey(packId)];
  if (typeof stored !== "string") return {};
  try {
    const parsed = asRecord(JSON.parse(stored));
    return Object.fromEntries(Object.entries(parsed).map(([formula, items]) => [formula, cleanItems(items)]).filter(([, items]) => items.length));
  } catch {
    return {};
  }
}

// Contenu à enregistrer : composition remplacée (supprimée si vide)
export function writeComposition(raw: unknown, packId: string, composition: PackComposition): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const cleaned = Object.fromEntries(Object.entries(composition).map(([formula, items]) => [formula, cleanItems(items)]).filter(([, items]) => items.length));
  if (Object.keys(cleaned).length) content[compositionKey(packId)] = JSON.stringify(cleaned);
  else delete content[compositionKey(packId)];
  return content;
}

// Composition reçue du formulaire (champ caché JSON) : pack de base et formules en plus de la formule de base,
// seuls les produits existants sont gardés
// aliases : clé provisoire d'une option pas encore enregistrée (« new-3 ») → son identifiant
export function compositionFromForm(json: string, optionFormulaIds: string[], options: Option[], aliases: Record<string, string> = {}): PackComposition {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = asRecord(JSON.parse(json || "{}"));
  } catch {
    return {};
  }
  for (const [from, to] of Object.entries(aliases)) if (from in parsed) parsed[to] = parsed[from];
  return Object.fromEntries([BASE, ...optionFormulaIds].map((id) => [id, cleanItems(parsed[id]).filter((item) => options.some((o) => o.id === item.option))]));
}

// Valeur à la carte : somme des prix habituels (hors remise temporaire) × quantités.
// priceFrom : au moins un produit est « à partir de » (la valeur est alors un minimum).
export function compositionValue(items: CompositionItem[], options: Option[]) {
  let total = 0;
  let priceFrom = false;
  const missing: string[] = [];
  for (const item of items) {
    const option = options.find((o) => o.id === item.option);
    if (!option) {
      missing.push(item.option);
      continue;
    }
    total += (option.normalPrice ?? option.price) * item.qty;
    priceFrom ||= Boolean(option.priceFrom);
  }
  return { total, priceFrom, missing };
}

// Économie du pack par rapport à la carte, en % arrondi (négatif si le pack coûte plus cher)
export function savingPercent(packPrice: number, value: number) {
  return value > 0 ? Math.round((1 - packPrice / value) * 100) : 0;
}

// Ligne de livrable d'un produit : « Pack de 5 emotes animées » ou « 3 × Overlay animé » (sans « (unité) »)
export function compositionLine(item: CompositionItem, option: Pick<Option, "name">) {
  const { main, detail } = splitOptionName(option.name);
  const name = detail && /^(unité|unit|each)$/i.test(detail.trim()) ? main : option.name;
  return item.qty > 1 ? `${item.qty} × ${name}` : name;
}

export function compositionPriceLabel(option: Option) {
  return formatOfferPrice({ ...option, price: option.normalPrice ?? option.price });
}

// Corrections incluses par élément d'une offre (réglées sur sa page dans l'admin) : « page:offres:corrections:<id> »
export const correctionsKey = (packId: string) => `page:offres:corrections:${packId}`;
export const MAX_CORRECTIONS = 20;
export const defaultCorrections = (packId: string) => (packId === "univers-complet" ? 3 : 2);
export function readCorrections(raw: unknown, packId: string) {
  const stored = asRecord(raw)[correctionsKey(packId)];
  const n = typeof stored === "string" && stored.trim() ? Number(stored) : NaN;
  return Number.isInteger(n) && n >= 0 && n <= MAX_CORRECTIONS ? n : defaultCorrections(packId);
}
// Ligne des livrables : texte modifiable dans les textes de la page Offres, « {n} » = nombre de corrections
export const correctionsLine = (template: string, n: number) => (n > 0 && template.trim() ? template.replaceAll("{n}", String(n)) : "");
// Lignes libres sans l'ancienne ligne des corrections écrite à la main (même texte, autre nombre)
export function withoutCorrectionsLines(free: string[], template: string) {
  if (!template.includes("{n}")) return free;
  const pattern = new RegExp(`^${template.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll("\\{n\\}", "\\d+")}$`, "i");
  return free.filter((line) => !pattern.test(line.trim()));
}

// Livrables générés par le pack de base (et la ligne des corrections), puis les lignes libres de l'offre
// (en français et en anglais). names : nom affiché de chaque produit dans la langue voulue.
export function deliverablesWith(items: CompositionItem[], names: (option: Option) => string, options: Option[], free: string[], extra: string[] = []) {
  const generated = [...items.flatMap((item) => {
    const option = options.find((o) => o.id === item.option);
    return option ? [compositionLine(item, { name: names(option) })] : [];
  }), ...extra.filter(Boolean)];
  return [...generated, ...free.filter((line) => !generated.includes(line))];
}
