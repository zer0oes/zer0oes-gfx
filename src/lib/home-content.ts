// Textes et visuels de la page d'accueil, modifiables dans l'admin.
// Les valeurs par défaut reprennent l'accueil actuel ; ce qui est saisi dans l'admin les remplace.
// Les visuels sont choisis parmi les réalisations du portfolio (par leur id).
import { site } from "@/data/site";

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
      { key: "about.work", label: "Portrait", kind: "work" },
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
  "about.work": "zer0oes-avatar",
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
};

const fields = homeSections.flatMap((s) => s.fields);
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
export function homeFromForm(get: (key: string) => string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = get(f.key);
    if (v == null) continue;
    const c = clean(f, v);
    if (c !== homeDefaults[f.key] && (c || f.kind === "work")) out[f.key] = c;
  }
  return out;
}

export type HomeContent = { values: Record<string, string>; text(key: string): string; lines(key: string): string[] };

// Contenu de l'accueil : valeurs enregistrées (vérifiées) par-dessus les valeurs par défaut
export function resolveHome(raw: unknown): HomeContent {
  const stored = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const values: Record<string, string> = { ...homeDefaults };
  for (const f of fields) {
    const v = stored[f.key];
    if (typeof v === "string" && (v || f.kind === "work")) values[f.key] = clean(f, v);
  }
  return {
    values,
    text: (key) => values[key] ?? "",
    lines: (key) => (values[key] ?? "").split("\n").filter(Boolean),
  };
}
