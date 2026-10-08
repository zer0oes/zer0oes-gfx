// Encart « Le contexte » d'une page projet : la chaîne, les jeux ou contenus, le besoin du client.
// Saisi dans Admin > Portfolio > projet, rangé dans le contenu JSON existant (pas de colonne en base) :
// français sous « page:projet:<id>:<champ> », anglais sous « translation:project:<id>:<champ> ».
import type { Locale } from "./i18n";

export const contextFields = [
  { key: "channel", label: { fr: "La chaîne", en: "The channel" }, admin: "Chaîne (ex. « Twitch · variété, 3 lives par semaine »)", max: 140, multiline: false },
  { key: "games", label: { fr: "Jeux & contenus", en: "Games & content" }, admin: "Jeux ou contenus (ex. « Valorant, Just Chatting »)", max: 140, multiline: false },
  { key: "need", label: { fr: "Le besoin", en: "The brief" }, admin: "Le besoin du client", max: 500, multiline: true },
] as const;

export type ContextKey = (typeof contextFields)[number]["key"];
export type ProjectContext = { key: ContextKey; label: string; value: string }[];

export const contextKey = (id: string, field: ContextKey) => `page:projet:${id}:${field}`;
export const contextTranslationKey = (id: string, field: ContextKey) => `translation:project:${id}:${field}`;

const read = (raw: unknown, key: string) => {
  const v = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[key] : undefined;
  return typeof v === "string" ? v.trim() : "";
};

// Valeurs françaises saisies (pour le formulaire de l'admin)
export function storedContext(raw: unknown, id: string): Record<ContextKey, string> {
  return Object.fromEntries(contextFields.map((f) => [f.key, read(raw, contextKey(id, f.key))])) as Record<ContextKey, string>;
}

// Lignes affichées sur la page projet : en anglais, la traduction saisie sinon le français. Vide : rien n'est affiché.
export function projectContext(raw: unknown, id: string, locale: Locale): ProjectContext {
  return contextFields
    .map((f) => {
      const fr = read(raw, contextKey(id, f.key));
      const value = locale === "en" ? read(raw, contextTranslationKey(id, f.key)) || fr : fr;
      return { key: f.key, label: f.label[locale], value };
    })
    .filter((line) => line.value);
}

// Contenu JSON mis à jour à partir du formulaire (champ vidé : supprimé)
export function contextFromForm(raw: unknown, id: string, form: FormData): Record<string, string> {
  const content = Object.fromEntries(
    Object.entries(raw && typeof raw === "object" ? raw : {}).filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  for (const f of contextFields) {
    for (const [name, key] of [[f.key, contextKey(id, f.key)], [`en:${f.key}`, contextTranslationKey(id, f.key)]] as const) {
      const v = form.get(name);
      if (typeof v !== "string") continue;
      const clean = v.replace(/\r/g, "").trim().slice(0, f.max);
      if (clean) content[key] = clean;
      else delete content[key];
    }
  }
  return content;
}
