// Textes et visuels de la page d'accueil (Admin > Page d'accueil) et textes de la page
// Portfolio (Admin > Portfolio), modifiables dans l'admin et enregistrés ensemble.
// Les valeurs par défaut reprennent l'accueil actuel ; ce qui est saisi dans l'admin les remplace.
// Les visuels sont choisis parmi les réalisations du portfolio (par leur id).
import { translationValues } from "@/lib/admin-translations";
import { site } from "@/data/site";
import type { Locale } from "@/lib/i18n";

export type FieldKind = "text" | "long" | "lines" | "paragraphs" | "work" | "emotes";
export type HomeField = { key: string; label: string; kind: FieldKind; max?: number; hint?: string };
export type HomeSection = { id: string; title: string; fields: HomeField[] };

export const homeSections: HomeSection[] = [
  {
    id: "hero",
    title: "Ouverture",
    fields: [
      { key: "hero.title1", label: "Titre — ligne 1", kind: "text", max: 40 },
      { key: "hero.title2", label: "Titre — ligne 2 (en dégradé)", kind: "text", max: 40 },
      { key: "hero.text", label: "Phrase d'accroche", kind: "long" },
      { key: "hero.cta", label: "Bouton principal (vers le portfolio)", kind: "text", max: 40 },
      { key: "hero.link", label: "Lien discret (vers les offres)", kind: "text", max: 40 },
      { key: "hero.work", label: "Visuel", kind: "work" },
      { key: "hero.emotes", label: "Emotes autour du visuel (4 noms max, séparés par des virgules)", kind: "text", max: 120, hint: "Noms des emotes de la planche choisie plus bas." },
    ],
  },
  {
    id: "emotes",
    title: "Emotes",
    fields: [
      { key: "emotes.kicker", label: "Surtitre", kind: "text", max: 60 },
      { key: "emotes.title", label: "Titre (une ligne par ligne)", kind: "lines" },
      { key: "emotes.link", label: "Lien", kind: "text", max: 60 },
      { key: "emotes.work", label: "Planche d'emotes", kind: "emotes" },
    ],
  },
  {
    id: "universe",
    title: "Univers",
    fields: [
      { key: "universe.kicker", label: "Surtitre (suivi du nom du projet)", kind: "text", max: 60 },
      { key: "universe.title", label: "Titre (une ligne par ligne)", kind: "lines" },
      { key: "universe.text", label: "Texte", kind: "long" },
      { key: "universe.link", label: "Lien", kind: "text", max: 60 },
      { key: "universe.work", label: "Visuel", kind: "work" },
    ],
  },
  {
    id: "signature",
    title: "Logo",
    fields: [
      { key: "signature.kicker", label: "Surtitre (suivi du nom du projet)", kind: "text", max: 60 },
      { key: "signature.title", label: "Titre (une ligne par ligne)", kind: "lines" },
      { key: "signature.link", label: "Lien", kind: "text", max: 60 },
      { key: "signature.work", label: "Visuel", kind: "work" },
    ],
  },
  {
    id: "about",
    title: "Derrière l'écran",
    fields: [
      { key: "about.kicker", label: "Surtitre", kind: "text", max: 60 },
      { key: "about.title1", label: "Titre — ligne 1", kind: "text", max: 80 },
      { key: "about.title2", label: "Titre — ligne 2 (en couleur)", kind: "text", max: 80 },
      { key: "about.paragraphs", label: "Texte (un paragraphe par ligne)", kind: "paragraphs" },
    ],
  },
  {
    id: "reviews",
    title: "Avis clients",
    fields: [
      { key: "reviews.kicker", label: "Surtitre", kind: "text", max: 60, hint: "Les avis se gèrent dans Portfolio, sur la fiche de chaque projet." },
      { key: "reviews.title", label: "Titre", kind: "text", max: 120 },
    ],
  },
  {
    id: "steps",
    title: "Comment ça marche",
    fields: [
      { key: "steps.kicker", label: "Surtitre", kind: "text", max: 60 },
      { key: "steps.title", label: "Titre", kind: "text", max: 120 },
      ...[1, 2, 3, 4].flatMap((n) => [
        { key: `steps.s${n}title`, label: `Étape ${n} — titre`, kind: "text" as const, max: 40 },
        {
          key: `steps.s${n}text`,
          label: `Étape ${n} — texte`,
          kind: "long" as const,
          hint: n === 3 ? "{delai} est remplacé par le délai de livraison des réglages." : undefined,
        },
      ]),
    ],
  },
  {
    id: "offers",
    title: "Les offres",
    fields: [
      { key: "offers.kicker", label: "Surtitre", kind: "text", max: 60 },
      { key: "offers.title", label: "Titre", kind: "text", max: 120 },
      { key: "offers.link", label: "Lien", kind: "text", max: 60 },
    ],
  },
  {
    id: "custom",
    title: "Sur mesure",
    fields: [
      { key: "custom.title", label: "Titre", kind: "text", max: 120 },
      { key: "custom.text", label: "Texte", kind: "long" },
      { key: "custom.button", label: "Bouton", kind: "text", max: 40 },
    ],
  },
];

// En-tête et cartes de la page Portfolio (modifiés dans Admin > Portfolio)
export const portfolioPageFields: HomeField[] = [
  { key: "portfolio.kicker", label: "Surtitre", kind: "text", max: 60 },
  { key: "portfolio.title", label: "Titre", kind: "text", max: 120 },
  { key: "portfolio.intro", label: "Texte d'introduction", kind: "long" },
  { key: "portfolio.link", label: "Lien des cartes projet", kind: "text", max: 40 },
];

export const homeDefaults: Record<string, string> = {
  "hero.title1": "Ton stream.",
  "hero.title2": "Ton univers.",
  "hero.text": "Identités visuelles sur mesure pour les créateurs de live.",
  "hero.cta": "Découvrir les projets",
  "hero.link": "Voir les offres →",
  "hero.work": "", // vide : première réalisation « mise en avant »
  "hero.emotes": "HYPE, LOVE, ACOOL, GG",
  "emotes.kicker": "Emotes",
  "emotes.title": "Toutes les émotions\ndu live.",
  "emotes.link": "Voir la planche complète →",
  "emotes.work": "zer0oes-emotes",
  "universe.kicker": "Univers",
  "universe.title": "Chaque chaîne,\nson caractère.",
  "universe.text": "Du minéral électrique au néon synthwave : chaque identité part de la personne qui streame.",
  "universe.link": "Découvrir le projet →",
  "universe.work": "tomavega-starting-screen",
  "signature.kicker": "Logo",
  "signature.title": "Un trait.\nToute une identité.",
  "signature.link": "Tout le portfolio →",
  "signature.work": "zer0oes-logo",
  "about.kicker": "Derrière l'écran",
  "about.title1": site.about.title[0],
  "about.title2": site.about.title[1],
  "about.paragraphs": site.about.paragraphs.join("\n"),
  "reviews.kicker": "Avis clients",
  "reviews.title": "Ils parlent de leur univers.",
  "steps.kicker": "Comment ça marche",
  "steps.title": "De ton idée à ton premier live.",
  "steps.s1title": "Tu choisis",
  "steps.s1text": "Une offre prête à commander, ou une demande sur mesure.",
  "steps.s2title": "Tu briefes",
  "steps.s2text": "Univers, couleurs, références et overlays choisis : un formulaire simple juste après la commande.",
  "steps.s3title": "Je crée",
  "steps.s3text": "Premières maquettes, retours, ajustements. Livraison en {delai} jours ouvrés.",
  "steps.s4title": "Tu streames",
  "steps.s4text": "Des visuels prêts à utiliser, avec fond transparent lorsque nécessaire.",
  "offers.kicker": "Les offres",
  "offers.title": "Trois façons de commencer.",
  "offers.link": "Options et détail des offres →",
  "custom.title": "Un projet plus spécifique ?",
  "custom.text": "Widget interactif, refonte complète, identité pour un événement : parlons-en et je te fais un devis.",
  "custom.button": "Demander un devis",
  "portfolio.kicker": "Portfolio",
  "portfolio.title": "Des univers, pas juste des écrans.",
  "portfolio.intro": "Chaque projet est pensé autour de la personnalité du créateur, de son contenu et de son identité.",
  "portfolio.link": "Explorer l’univers →",
};

// Version anglaise des textes (/en). Les visuels et les noms d'emotes sont communs aux deux langues.
// Une traduction saisie dans l'admin est enregistrée sous la clé « en:<clé> ».
export const homeDefaultsEn: Record<string, string> = {
  "hero.title1": "Your stream.",
  "hero.title2": "Your universe.",
  "hero.text": "Custom visual identities for live creators.",
  "hero.cta": "Explore the projects",
  "hero.link": "See pricing →",
  "emotes.kicker": "Emotes",
  "emotes.title": "Every emotion\nof the live.",
  "emotes.link": "See the full sheet →",
  "universe.kicker": "Universe",
  "universe.title": "Every channel,\nits own character.",
  "universe.text": "From electric mineral to synthwave neon: every identity starts with the person behind the stream.",
  "universe.link": "Discover the project →",
  "signature.kicker": "Logo",
  "signature.title": "One line.\nA whole identity.",
  "signature.link": "The full portfolio →",
  "about.kicker": "Behind the screen",
  "about.title1": "I stream too.",
  "about.title2": "I know what your screen needs to say.",
  "about.paragraphs":
    "Hi, I'm Aurore. Graphic designer, and streamer under the name zer0oes.\nI know the backstage: the scenes you switch between, the alerts that must stay readable mid-game, the identity people should recognise at a glance. Every universe I create, I design as if it were my own.",
  "reviews.kicker": "Client reviews",
  "reviews.title": "In their own words.",
  "steps.kicker": "How it works",
  "steps.title": "From your idea to your first live.",
  "steps.s1title": "You choose",
  "steps.s1text": "A ready-to-order package, or a custom request.",
  "steps.s2title": "You brief",
  "steps.s2text": "Universe, colours, references and chosen overlays: a simple form right after your order.",
  "steps.s3title": "I create",
  "steps.s3text": "First mock-ups, feedback, adjustments. Delivery within {delai} business days.",
  "steps.s4title": "You stream",
  "steps.s4text": "Ready-to-use visuals, with transparent backgrounds where needed.",
  "offers.kicker": "Pricing",
  "offers.title": "Three ways to get started.",
  "offers.link": "Add-ons and package details →",
  "custom.title": "A more specific project?",
  "custom.text": "Interactive widget, full redesign, identity for an event: let's talk and I'll send you a quote.",
  "custom.button": "Request a quote",
  "portfolio.kicker": "Portfolio",
  "portfolio.title": "Universes, not just screens.",
  "portfolio.intro": "Every project is built around the creator's personality, content and identity.",
  "portfolio.link": "Explore the universe →",
};

const homeFields = homeSections.flatMap((s) => s.fields);
const fields = [...homeFields, ...portfolioPageFields];
const LONG = 1200;

function clean(f: HomeField, raw: string): string {
  const v = raw.replace(/\r/g, "");
  if (f.kind === "work" || f.kind === "emotes") return v.trim().slice(0, 60);
  if (f.kind === "lines" || f.kind === "paragraphs")
    return v
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, f.kind === "lines" ? 3 : 6)
      .join("\n")
      .slice(0, LONG);
  return v.trim().slice(0, f.max ?? LONG);
}

// Contenu enregistré : seules les clés connues, en texte ; un texte vidé reprend la valeur par défaut
// (sauf pour un visuel, où « vide » a un sens : réglage automatique).
// group : champs du formulaire envoyé ; les textes de l'autre page déjà enregistrés sont conservés.
export function homeFromForm(
  get: (key: string) => string | null | undefined,
  stored: unknown = null,
  group: "accueil" | "portfolio" = "accueil",
): Record<string, string> {
  const edited = group === "portfolio" ? portfolioPageFields : homeFields;
  const kept = resolveStored(stored, group === "portfolio" ? homeFields : portfolioPageFields);
  const out: Record<string, string> = { ...kept, ...translationValues(stored), ...storedTranslations(stored) };
  for (const f of edited) {
    const v = get(f.key);
    if (v == null) continue;
    const c = clean(f, v);
    if (c !== homeDefaults[f.key] && (c || f.kind === "work")) out[f.key] = c;
  }
  return out;
}

// Valeurs enregistrées (vérifiées) pour une liste de champs, sans les valeurs par défaut
function resolveStored(raw: unknown, list: HomeField[]) {
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const f of list) {
    const v = stored[f.key];
    if (typeof v === "string" && (v || f.kind === "work")) out[f.key] = clean(f, v);
  }
  return out;
}

// Traductions anglaises enregistrées (« en:<clé> ») : conservées quand le français est enregistré
function storedTranslations(raw: unknown) {
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = stored[`en:${f.key}`];
    if (typeof v === "string" && v) out[`en:${f.key}`] = clean(f, v);
  }
  return out;
}

// Retour au contenu d'origine d'une des deux pages, l'autre est conservée (null : plus rien d'enregistré)
export function resetGroup(stored: unknown, group: "accueil" | "portfolio") {
  const translations = translationValues(stored);
  const removed = group === "portfolio" ? portfolioPageFields : homeFields;
  for (const field of removed) delete translations[`en:${field.key}`];
  const kept = { ...resolveStored(stored, group === "portfolio" ? homeFields : portfolioPageFields), ...translations };
  return Object.keys(kept).length ? kept : null;
}

export type HomeContent = { values: Record<string, string>; text(key: string): string; lines(key: string): string[] };

// Champs communs aux deux langues : visuels choisis et noms des emotes autour du visuel
const shared = (f: HomeField) => f.kind === "work" || f.kind === "emotes" || f.key === "hero.emotes";

// Contenu de l'accueil : valeurs enregistrées (vérifiées) par-dessus les valeurs par défaut.
// En anglais : traductions enregistrées (« en:<clé> »), sinon textes anglais d'origine ;
// les visuels restent ceux choisis pour le site français.
export function resolveHome(raw: unknown, locale: Locale = "fr"): HomeContent {
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const values: Record<string, string> = { ...homeDefaults, ...(locale === "en" ? homeDefaultsEn : {}) };
  for (const f of fields) {
    const key = locale === "en" && !shared(f) ? `en:${f.key}` : f.key;
    const v = stored[key];
    if (typeof v === "string" && (v || f.kind === "work")) values[f.key] = clean(f, v);
  }
  return {
    values,
    text: (key) => values[key] ?? "",
    lines: (key) => (values[key] ?? "").split("\n").filter(Boolean),
  };
}
