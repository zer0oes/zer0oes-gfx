// Liste « Tu reçois » des créations à la carte, modifiable dans Admin > Offres (une ligne par fichier).
// Rangée dans le contenu JSON existant : français sous « page:offres:fichiers:<id> »,
// anglais sous « translation:option-files:<id> ». Champ vide : liste d'origine (optionFiles).
import type { Locale } from "./i18n";
import { optionFiles } from "./option-products";
import type { Option } from "./pricing";

const MAX = 600;
export const filesKey = (id: string) => `page:offres:fichiers:${id}`;
export const filesTranslationKey = (id: string) => `translation:option-files:${id}`;

const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});
const lines = (v: unknown) => (typeof v === "string" ? v.split("\n").map((l) => l.trim()).filter(Boolean) : []);

// Créations concernées : celles à prix fixe (les autres ont leurs livrables fixés dans le devis)
export const optionsWithFiles = (options: Option[]) => options.filter((o) => !o.priceFrom);

export function optionFilesFor(option: Option, raw: unknown, locale: Locale): string[] {
  const stored = asRecord(raw);
  const fr = lines(stored[filesKey(option.id)]);
  if (locale === "en") {
    const en = lines(stored[filesTranslationKey(option.id)]);
    if (en.length) return en;
    // Liste française modifiée mais pas traduite : on garde le texte saisi plutôt qu'une liste périmée
    return fr.length ? fr : optionFiles(option, "en");
  }
  return fr.length ? fr : optionFiles(option, "fr");
}

export function resolveOptionFiles(options: Option[], raw: unknown, locale: Locale): Record<string, string[]> {
  return Object.fromEntries(optionsWithFiles(options).map((o) => [o.id, optionFilesFor(o, raw, locale)]));
}

// Contenu JSON mis à jour à partir du formulaire : une valeur identique à la liste d'origine n'est pas enregistrée
export function filesFromForm(raw: unknown, options: Option[], form: FormData): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  for (const o of optionsWithFiles(options)) {
    for (const [name, key, locale] of [[`files:${o.id}`, filesKey(o.id), "fr"], [`en:files:${o.id}`, filesTranslationKey(o.id), "en"]] as const) {
      const v = form.get(name);
      if (typeof v !== "string") continue;
      const clean = lines(v.replace(/\r/g, "").slice(0, MAX)).join("\n");
      if (clean && clean !== optionFiles(o, locale).join("\n")) content[key] = clean;
      else delete content[key];
    }
  }
  return content;
}
