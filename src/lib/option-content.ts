// Contenu des cartes « à la carte » modifiable dans Admin > Offres > Options à la carte, option par option :
// description, liste « Tu reçois » (une ligne par élément) et logos de compatibilité.
// Rangé dans le contenu JSON existant (pas de colonne en base) :
//   français « page:offres:<champ>:<id> », anglais « translation:option-<champ>:<id> ».
// Tant qu'une option n'a jamais été enregistrée, les textes d'origine (option-products) s'affichent.
import type { Locale } from "./i18n";
import { animatedOption, defaultGroup, emoteCount, optionFiles, optionIncludes } from "./option-products";
import type { Option } from "./pricing";
import { optionVisualKey, readVisuals, visualFor, type ProductVisual } from "./product-visuals";

export const platforms = [
  { id: "obs", name: "OBS" },
  { id: "streamelements", name: "StreamElements" },
  { id: "streamlabs", name: "Streamlabs" },
] as const;
export type PlatformId = (typeof platforms)[number]["id"];

const MAX = 1200;
export const contentKey = (field: "description" | "fichiers" | "compat" | "groupe" | "variante" | "nombre" | "pluriel", id: string) => `page:offres:${field}:${id}`;
export const contentTranslationKey = (field: "description" | "files" | "plural", id: string) => `translation:option-${field}:${id}`;

const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});
const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);
const read = (raw: unknown, key: string) => {
  const v = asRecord(raw)[key];
  return typeof v === "string" ? v : undefined;
};

// Compatibilité d'origine : overlays (OBS + outils d'alertes), widgets et alertes (outils d'alertes)
export function defaultCompat(option: Option): PlatformId[] {
  const key = option.id + " " + option.name;
  const overlay = /overlay/i.test(key);
  if (!overlay && !/widget|alerte|alert/i.test(key)) return [];
  return [...(overlay ? (["obs"] as const) : []), "streamelements", "streamlabs"];
}

// group : carte partagée avec les options du même regroupement (null : carte seule) ;
// animated / count : place de l'option dans sa carte (bouton Statique / Animé, menu du nombre)
// visual : dessin de la carte (bibliothèque « Visuels » de l'admin)
export type OptionContent = { description: string; files: string[]; compat: PlatformId[]; group: string | null; groupName: string; animated: boolean; count: number; visual: ProductVisual };

// Nom de la carte d'un regroupement (titre affiché sur la page Offres), en FR et EN
export const groupNameKey = (group: string) => `page:offres:nom-groupe:${group}`;
export const groupNameTranslationKey = (group: string) => `translation:option-group:${group}`;
const defaultGroupNames: Record<string, { fr: string; en: string }> = {
  overlay: { fr: "Overlay", en: "Overlay" },
  alertes: { fr: "Pack d’alertes", en: "Alert pack" },
  emotes: { fr: "Emotes", en: "Emotes" },
};
export function groupNameFor(group: string | null, raw: unknown, locale: Locale): string {
  if (!group) return "";
  const fr = read(raw, groupNameKey(group))?.trim();
  const en = read(raw, groupNameTranslationKey(group))?.trim();
  if (locale === "en") return en || fr || defaultGroupNames[group]?.en || "";
  return fr || defaultGroupNames[group]?.fr || "";
}

export function optionGroupingFor(option: Option, raw: unknown) {
  const group = read(raw, contentKey("groupe", option.id));
  const variant = read(raw, contentKey("variante", option.id));
  const count = Number(read(raw, contentKey("nombre", option.id)));
  return {
    group: group === undefined ? defaultGroup(option) : group || null,
    animated: variant === undefined ? animatedOption(option) : variant === "anime",
    count: Number.isInteger(count) && count > 0 ? count : emoteCount(option),
  };
}

// Contenu affiché (en anglais : la traduction saisie, sinon le français saisi, sinon le texte d'origine anglais)
export function optionContentFor(option: Option, raw: unknown, locale: Locale): OptionContent {
  const pick = (field: "description" | "fichiers", en: "description" | "files", fallback: string) => {
    const fr = read(raw, contentKey(field, option.id));
    if (locale === "en") {
      const t = read(raw, contentTranslationKey(en, option.id));
      if (t?.trim()) return t;
      // Texte français modifié mais pas traduit : on garde le texte saisi plutôt qu'un texte périmé
      return fr !== undefined && fr.trim() !== "" ? fr : fallback;
    }
    return fr ?? fallback;
  };
  const compat = read(raw, contentKey("compat", option.id));
  return {
    description: pick("description", "description", optionIncludes(option, locale)).trim(),
    files: lines(pick("fichiers", "files", optionFiles(option, locale).join("\n"))),
    compat: compat === undefined ? defaultCompat(option) : (compat.split(",").filter((p) => platforms.some((x) => x.id === p)) as PlatformId[]),
    ...optionGroupingFor(option, raw),
    groupName: groupNameFor(optionGroupingFor(option, raw).group, raw, locale),
    visual: visualFor(option, raw),
  };
}

export function resolveOptionContent(options: Option[], raw: unknown, locale: Locale): Record<string, OptionContent> {
  return Object.fromEntries(options.map((o) => [o.id, optionContentFor(o, raw, locale)]));
}

// Contenu JSON mis à jour pour une option (formulaire de sa fiche). Tout est enregistré tel quel :
// une liste vidée n'affiche plus de « Tu reçois » ; une traduction vide reprend le français.
export function optionContentFromForm(raw: unknown, id: string, form: FormData): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const get = (name: string) => (form.get(name)?.toString() ?? "").replace(/\r/g, "").trim().slice(0, MAX);
  content[contentKey("description", id)] = get("description");
  content[contentKey("fichiers", id)] = lines(get("files")).join("\n");
  content[contentKey("compat", id)] = platforms.filter((p) => form.get(`compat_${p.id}`) === "on").map((p) => p.id).join(",");
  content[contentKey("variante", id)] = form.get("variant") === "anime" ? "anime" : "statique";
  const visual = get("visual");
  if (readVisuals(raw).some((v) => v.id === visual)) content[optionVisualKey(id)] = visual;
  const count = Number(get("count"));
  content[contentKey("nombre", id)] = String(Number.isInteger(count) && count > 0 && count <= 999 ? count : 1);
  // Nom au pluriel (quantité > 1 dans la composition des packs) : vide = accord automatique
  if (form.has("plural")) {
    if (get("plural")) content[contentKey("pluriel", id)] = get("plural").slice(0, 200);
    else delete content[contentKey("pluriel", id)];
  }
  for (const [name, key] of [["en:description", contentTranslationKey("description", id)], ["en:files", contentTranslationKey("files", id)], ["en:plural", contentTranslationKey("plural", id)]] as const) {
    if (!form.has(name) && name === "en:plural") continue;
    const v = name === "en:files" ? lines(get(name)).join("\n") : get(name);
    if (v) content[key] = v;
    else delete content[key];
  }
  return content;
}

// Option supprimée : son contenu aussi
export function withoutOptionContent(raw: unknown, id: string): Record<string, string> {
  const keys = new Set([contentKey("description", id), contentKey("fichiers", id), contentKey("compat", id), contentKey("groupe", id), contentKey("variante", id), optionVisualKey(id), contentKey("nombre", id), contentKey("pluriel", id), contentTranslationKey("description", id), contentTranslationKey("files", id), contentTranslationKey("plural", id)]);
  return Object.fromEntries(Object.entries(asRecord(raw)).filter(([k, v]) => typeof v === "string" && !keys.has(k))) as Record<string, string>;
}

// Copie du contenu de la carte d'une option vers une autre (dupliquer) ; la copie a sa propre carte (pas de regroupement)
export function withCopiedOptionContent(raw: unknown, from: string, to: string): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const pairs: [string, string][] = [
    ...(["description", "fichiers", "compat", "variante", "nombre", "pluriel"] as const).map((f) => [contentKey(f, from), contentKey(f, to)] as [string, string]),
    ...(["description", "files", "plural"] as const).map((f) => [contentTranslationKey(f, from), contentTranslationKey(f, to)] as [string, string]),
    [optionVisualKey(from), optionVisualKey(to)],
  ];
  for (const [a, b] of pairs) if (a in content) content[b] = content[a];
  content[contentKey("groupe", to)] = "";
  return content;
}

// « Regrouper avec » : l'option rejoint la carte de l'option choisie (qui reçoit un regroupement si elle n'en avait pas) ;
// "" : carte seule. Les autres options de l'ancien regroupement restent ensemble.
export function withGrouping(raw: unknown, options: Option[], id: string, groupWith: string): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const target = options.find((o) => o.id === groupWith && o.id !== id);
  if (!target) {
    content[contentKey("groupe", id)] = "";
    return content;
  }
  const group = optionGroupingFor(target, content).group ?? target.id;
  content[contentKey("groupe", target.id)] = group;
  content[contentKey("groupe", id)] = group;
  return content;
}

// Nom de la carte saisi dans la fiche d'une option regroupée (vide : nom d'origine, ou titre de l'option)
export function withGroupName(raw: unknown, option: Option, form: FormData): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const group = optionGroupingFor(option, content).group;
  if (!group) return content;
  for (const [name, key] of [["groupName", groupNameKey(group)], ["en:groupName", groupNameTranslationKey(group)]] as const) {
    const v = (form.get(name)?.toString() ?? "").trim().slice(0, 80);
    if (v) content[key] = v;
    else delete content[key];
  }
  return content;
}

// Nom au pluriel d'une option saisi dans l'admin (FR, ou EN avec repli sur l'accord automatique du nom anglais)
export function optionPlural(raw: unknown, id: string, locale: Locale) {
  return read(raw, locale === "en" ? contentTranslationKey("plural", id) : contentKey("pluriel", id))?.trim() || undefined;
}
