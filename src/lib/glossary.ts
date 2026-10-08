// Termes techniques expliqués par une bulle « ? » sur la page des offres.
// match : reconnu dans un texte français ou anglais (livrables d'un pack, nom d'une création).
import type { Locale } from "./i18n";

type Entry = { id: string; match: RegExp; term: { fr: string; en: string }; text: { fr: string; en: string } };

export const glossary: Entry[] = [
  {
    id: "declinaisons",
    match: /déclinaisons|variations/i,
    term: { fr: "Déclinaisons du logo", en: "Logo variations" },
    text: {
      fr: "Versions du logo adaptées à chaque usage : icône seule, version horizontale, version une couleur… pour qu'il reste lisible partout.",
      en: "Versions of the logo for each use: icon only, horizontal, single colour… so it stays readable everywhere.",
    },
  },
  {
    id: "overlay",
    match: /overlay/i,
    term: { fr: "Overlay", en: "Overlay" },
    text: {
      fr: "Habillage affiché par-dessus ton live dans OBS : écran de démarrage, de pause, de fin, discussion ou cadre autour du jeu et de la caméra.",
      en: "Graphics shown over your live in OBS: starting, break and ending screens, just chatting, or a frame around your game and camera.",
    },
  },
  {
    id: "alertes",
    match: /alerte|alert/i,
    term: { fr: "Alertes", en: "Alerts" },
    text: {
      fr: "Petites animations qui apparaissent à l'écran quand quelqu'un suit ta chaîne, s'abonne, lance un raid, envoie des bits ou un don.",
      en: "Short on-screen pop-ups when someone follows, subscribes, raids, cheers bits or sends a tip.",
    },
  },
  {
    id: "emotes",
    match: /emote/i,
    term: { fr: "Emotes", en: "Emotes" },
    text: {
      fr: "Petites images à ton effigie que ta communauté utilise dans le tchat (Twitch, YouTube, Discord).",
      en: "Small custom images your community uses in chat (Twitch, YouTube, Discord).",
    },
  },
  {
    id: "widget",
    match: /widget/i,
    term: { fr: "Widget", en: "Widget" },
    text: {
      fr: "Élément du live qui se met à jour tout seul : barre d'objectif, tchat affiché à l'écran, encart sponsor…",
      en: "A live element that updates by itself: goal bar, on-screen chat, sponsor panel…",
    },
  },
  {
    id: "stinger",
    match: /stinger/i,
    term: { fr: "Stinger", en: "Stinger" },
    text: {
      fr: "Courte animation de transition qui recouvre l'écran pendant le passage d'une scène à l'autre.",
      en: "A short transition animation that covers the screen while switching scenes.",
    },
  },
  {
    id: "panneaux",
    match: /panneaux|panels/i,
    term: { fr: "Panneaux Twitch", en: "Twitch panels" },
    text: {
      fr: "Encadrés sous ta vidéo sur Twitch : à propos, planning, réseaux, règles du tchat…",
      en: "The boxes under your video on Twitch: about, schedule, socials, chat rules…",
    },
  },
  {
    id: "banniere",
    match: /bannière|banner/i,
    term: { fr: "Bannière", en: "Banner" },
    text: {
      fr: "Grande image en haut de ta page de chaîne, sur Twitch ou YouTube.",
      en: "The large image at the top of your channel page, on Twitch or YouTube.",
    },
  },
  {
    id: "corrections",
    match: /corrections?|revisions?/i,
    term: { fr: "Corrections", en: "Revisions" },
    text: {
      fr: "Allers-retours pour ajuster une création après ma première proposition : couleurs, texte, détails.",
      en: "Rounds of changes to adjust a creation after my first proposal: colours, text, details.",
    },
  },
];

export type GlossaryHint = { id: string; term: string; text: string };

const localized = (e: Entry, locale: Locale): GlossaryHint => ({ id: e.id, term: e.term[locale], text: e.text[locale] });

export function glossaryEntry(id: string, locale: Locale): GlossaryHint | undefined {
  const e = glossary.find((x) => x.id === id);
  return e && localized(e, locale);
}

// Premier terme du glossaire présent dans un texte (ordre de la liste : le plus précis d'abord)
export function glossaryFor(text: string, locale: Locale): GlossaryHint | undefined {
  const e = glossary.find((x) => x.match.test(text));
  return e && localized(e, locale);
}
