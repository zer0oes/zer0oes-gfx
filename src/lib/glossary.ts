// Termes techniques expliqués par une bulle « ? » sur la page des offres.
// Les textes (terme et explication, FR et EN) se modifient dans Admin > Offres > Textes de la page Offres
// (clés « glossary.<id>.term » et « glossary.<id>.text ») ; ici, seulement comment reconnaître chaque terme.
import type { HomeContent } from "./home-content";

// match : reconnu dans un texte français ou anglais (livrables d'un pack, nom d'une création).
// Ordre : le plus précis d'abord (« Logo et ses déclinaisons » explique les déclinaisons, pas le logo).
export const glossary = [
  { id: "declinaisons", match: /déclinaisons|variations/i },
  { id: "overlay", match: /overlay/i },
  { id: "alertes", match: /alerte|alert/i },
  { id: "emotes", match: /emote/i },
  { id: "widget", match: /widget/i },
  { id: "stinger", match: /stinger/i },
  { id: "panneaux", match: /panneaux|panels/i },
  { id: "banniere", match: /bannière|banner/i },
  { id: "corrections", match: /corrections?|revisions?/i },
] as const;

export type GlossaryId = (typeof glossary)[number]["id"];
export type GlossaryHint = { id: string; term: string; text: string };

export function glossaryEntry(id: string, texts: HomeContent): GlossaryHint | undefined {
  const text = texts.text(`glossary.${id}.text`);
  return text ? { id, term: texts.text(`glossary.${id}.term`), text } : undefined;
}

// Toutes les bulles, pour un composant client (catalogue à la carte)
export function glossaryHints(texts: HomeContent): Record<string, GlossaryHint> {
  return Object.fromEntries(glossary.flatMap((g) => {
    const hint = glossaryEntry(g.id, texts);
    return hint ? [[g.id, hint]] : [];
  }));
}

// Identifiant du premier terme du glossaire présent dans un texte
export function glossaryIdFor(text: string): GlossaryId | undefined {
  return glossary.find((g) => g.match.test(text))?.id;
}

export function glossaryFor(text: string, texts: HomeContent): GlossaryHint | undefined {
  const id = glossaryIdFor(text);
  return id && glossaryEntry(id, texts);
}
