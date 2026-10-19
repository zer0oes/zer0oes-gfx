// Composition des offres (packs) à partir des produits à la carte : le pack de base (produits et quantités), puis
// pour chaque autre formule (« option » du pack) les produits ajoutés au pack de base.
// Sert dans l'admin à comparer la valeur à la carte au prix, et génère les livrables du pack sur le site.
// Rangé dans le contenu JSON existant (pas de colonne en base) : « page:offres:composition:<id de l'offre> »
// = { "_base": [{ "option": "<id produit>", "qty": 2 }, …], "<id de formule>": [produits ajoutés…] }.
// Un produit d'une option peut remplacer un produit du pack de base (« replaces » : id du produit remplacé),
// par exemple des overlays animés à la place des overlays statiques.
import { formatOfferPrice, splitOptionName, type Option } from "./pricing";

export type CompositionItem = { option: string; qty: number; replaces?: string };
export type PackComposition = Record<string, CompositionItem[]>;

export const compositionKey = (packId: string) => `page:offres:composition:${packId}`;
export const MAX_QTY = 99;
// Clé du pack de base (un identifiant de formule ne commence jamais par « _ »)
export const BASE = "_base";

const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

export function cleanItems(list: unknown): CompositionItem[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    const { option, qty, replaces } = asRecord(item);
    const n = Math.floor(Number(qty));
    if (typeof option !== "string" || !option || !Number.isFinite(n) || n < 1) return [];
    return [{ option: option.slice(0, 60), qty: Math.min(n, MAX_QTY), ...(typeof replaces === "string" && replaces ? { replaces: replaces.slice(0, 60) } : {}) }];
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
  const exists = (id: string) => options.some((o) => o.id === id);
  const base = cleanItems(parsed[BASE]).filter((item) => exists(item.option));
  const replaceable = (id?: string) => !id || base.some((item) => item.option === id);
  return Object.fromEntries([[BASE, base], ...optionFormulaIds.map((id) => [id, cleanItems(parsed[id]).filter((item) => exists(item.option))
    .map(({ replaces, ...item }) => (replaceable(replaces) ? { ...item, ...(replaces ? { replaces } : {}) } : item))])]);
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

// Valeur à la carte d'une option : pack de base, moins les produits qu'elle remplace, plus ses produits
export function optionValue(base: CompositionItem[], items: CompositionItem[], options: Option[]) {
  const replaced = new Set(items.flatMap((item) => (item.replaces ? [item.replaces] : [])));
  const kept = compositionValue(base.filter((item) => !replaced.has(item.option)), options);
  const added = compositionValue(items, options);
  return { total: kept.total + added.total, priceFrom: kept.priceFrom || added.priceFrom, missing: [...kept.missing, ...added.missing] };
}

// Économie du pack par rapport à la carte, en % arrondi (négatif si le pack coûte plus cher)
export function savingPercent(packPrice: number, value: number) {
  return value > 0 ? Math.round((1 - packPrice / value) * 100) : 0;
}

// Nom d'un produit sans « (unité) »
export function singularName(name: string) {
  const { main, detail } = splitOptionName(name);
  return detail && /^(unité|unit|each)$/i.test(detail.trim()) ? main : name;
}

// Pluriel automatique d'un nom de produit, quand aucun pluriel n'est saisi dans l'admin :
// « Overlay animé » → « overlays animés », « Pack d’alertes fixes » → « packs d’alertes fixes »,
// « Animated overlay » → « animated overlays ». Seuls les mots avant « de », « pour », « ( »… sont accordés.
const STOP = { fr: /^(de|du|des|d[’']|pour|avec|à|au|aux|en|sur|et|ou|\(|\/|-|–)/i, en: /^(of|for|with|to|in|on|and|or|\(|\/|-|–)/i };
const BRANDS = /^(twitch|youtube|tiktok|kick|discord|streamelements|streamlabs|instagram)$/i;
function pluralWord(word: string, locale: "fr" | "en") {
  if (locale === "fr") return /[sxz]$/i.test(word) ? word : /(eau|au|eu)$/i.test(word) ? `${word}x` : `${word}s`;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}
export function pluralize(name: string, locale: "fr" | "en" = "fr") {
  const words = singularName(name).trim().split(/\s+/);
  let head = words.findIndex((w) => STOP[locale].test(w));
  if (head < 0) head = words.length;
  const out = words.map((w, i) => {
    if (i >= head) return w;
    // Français : tous les mots du groupe (nom et adjectifs) ; anglais : le dernier seulement (le nom)
    return locale === "fr" || i === head - 1 ? pluralWord(w, locale) : w;
  });
  // Minuscule après le nombre, sauf sigle ou nom de plateforme (« 3 overlays », mais « 2 Twitch panels »)
  if (out[0] && /^\p{Lu}\p{Ll}/u.test(out[0]) && !BRANDS.test(words[0])) out[0] = out[0][0].toLowerCase() + out[0].slice(1);
  return out.join(" ");
}

// Nom d'un produit dans une langue : singulier, et pluriel (saisi dans l'admin ou automatique)
export type ProductName = { name: string; plural?: string };

// Ligne de livrable d'un produit : « Overlay animé » ou « 3 overlays animés » (sans « (unité) »)
export function compositionLine(item: CompositionItem, option: ProductName) {
  if (item.qty <= 1) return singularName(option.name);
  return `${item.qty} ${option.plural?.trim() || pluralize(option.name)}`;
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

// Livrables générés par le pack de base, puis les lignes libres de l'offre, et la ligne des corrections en dernier
// (en français et en anglais). names : nom affiché de chaque produit dans la langue voulue.
export function deliverablesWith(items: CompositionItem[], names: (option: Option) => ProductName, options: Option[], free: string[], extra: string[] = []) {
  const products = items.flatMap((item) => {
    const option = options.find((o) => o.id === item.option);
    return option ? [compositionLine(item, names(option))] : [];
  });
  const lines = [...products, ...free.filter((line) => !products.includes(line))];
  return [...lines, ...extra.filter((line) => line && !lines.includes(line))];
}

// Lignes d'une option : affichage sur le site (« Overlay animé au lieu de Overlay statique » pour un remplacement,
// texte modifiable « {produit} » / « {remplacé} ») et livrables de la commande (pack de base moins les lignes remplacées, plus les ajouts)
export function optionLines(base: CompositionItem[], items: CompositionItem[], names: (option: Option) => ProductName, options: Option[], replacesTemplate: string) {
  const line = (item: CompositionItem) => {
    const option = options.find((o) => o.id === item.option);
    return option ? compositionLine(item, names(option)) : "";
  };
  const display: string[] = [];
  const adds: string[] = [];
  const removes: string[] = [];
  for (const item of items) {
    const added = line(item);
    if (!added) continue;
    adds.push(added);
    const replaced = item.replaces ? base.find((b) => b.option === item.replaces) : undefined;
    const old = replaced ? line(replaced) : "";
    if (old && !removes.includes(old)) removes.push(old);
    display.push(old && replacesTemplate.trim() ? replacesTemplate.replaceAll("{produit}", added).replaceAll("{remplacé}", old) : added);
  }
  return { display, adds, removes };
}
