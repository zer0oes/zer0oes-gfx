// Contenu des cartes « à la carte » modifiable dans Admin > Offres > Options à la carte, option par option :
// description, liste « Tu reçois » (une ligne par élément) et logos de compatibilité.
// Rangé dans le contenu JSON existant (pas de colonne en base) :
//   français « page:offres:<champ>:<id> », anglais « translation:option-<champ>:<id> ».
// Tant qu'une option n'a jamais été enregistrée, les textes d'origine (option-products) s'affichent.
import type { Locale } from "./i18n";
import { optionFiles, optionIncludes } from "./option-products";
import type { Option } from "./pricing";

export const platforms = [
  { id: "obs", name: "OBS" },
  { id: "streamelements", name: "StreamElements" },
  { id: "streamlabs", name: "Streamlabs" },
] as const;
export type PlatformId = (typeof platforms)[number]["id"];

const MAX = 1200;
export const contentKey = (field: "description" | "fichiers" | "compat", id: string) => `page:offres:${field}:${id}`;
export const contentTranslationKey = (field: "description" | "files", id: string) => `translation:option-${field}:${id}`;

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

export type OptionContent = { description: string; files: string[]; compat: PlatformId[] };

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
  for (const [name, key] of [["en:description", contentTranslationKey("description", id)], ["en:files", contentTranslationKey("files", id)]] as const) {
    const v = name === "en:files" ? lines(get(name)).join("\n") : get(name);
    if (v) content[key] = v;
    else delete content[key];
  }
  return content;
}

// Option supprimée : son contenu aussi
export function withoutOptionContent(raw: unknown, id: string): Record<string, string> {
  const keys = new Set([contentKey("description", id), contentKey("fichiers", id), contentKey("compat", id), contentTranslationKey("description", id), contentTranslationKey("files", id)]);
  return Object.fromEntries(Object.entries(asRecord(raw)).filter(([k, v]) => typeof v === "string" && !keys.has(k))) as Record<string, string>;
}
