// Présentation des projets en « étude de cas » : textes et ordre des réalisations.
// Les réalisations sont référencées par leur id (src/data/portfolio.ts / base Supabase) ;
// celles qui ne sont citées nulle part apparaissent dans « Les autres pièces du projet ».

// Pièce citée avec un titre court (ex. « Pause ») au lieu de son titre complet
// image / aspect : visuel recadré pour la mise en page (ex. tchat en hauteur), la visionneuse garde l'original
export type CasePiece = { id: string; label: string; image?: string; aspect?: string };

export type CaseSection = {
  kicker: string; // ex. « La signature » (numéroté automatiquement)
  title: string;
  text?: string;
  works: string[];
  // Pièces complémentaires, plus discrètes, sous les pièces principales :
  // « pair » = aperçus côte à côte ; « profil » = avatar en carré à gauche, panneaux en large à droite
  secondary?: CasePiece[];
  secondaryLayout?: "pair" | "profil";
};

export type CaseStudy = {
  eyebrow: string;
  headline: [string, string];
  intro: string;
  tags: string[];
  hero: string;
  heroCaption: string;
  // Bloc « Les scènes du stream », juste après la scène d'ouverture
  scenes?: CasePiece[];
  pillars: { kicker: string; title: string; text: string }[];
  sections: CaseSection[];
  // Couverture de la page Portfolio : image lisible en miniature (logo), et vidéo au survol
  cover: string;
  coverVideo?: string;
};

// Mise en page « éditoriale » (maquette zer0oes) : blocs asymétriques, texte et visuels alternés.
export type EditorialBlock =
  | { type: "signature"; kicker: string; title: string[]; main: string; side?: { id: string; caption: string } }
  | { type: "scenes"; kicker: string; title: string[]; text: string; scenes: CasePiece[] }
  | {
      type: "detail";
      kicker: string;
      title: string[];
      main: { id: string; caption: string; image?: string; aspect?: string };
      sideTitle: string[];
      side: { id: string; caption: string };
      small: CasePiece[];
    }
  | { type: "emotes"; kicker: string; title: string[]; text: string; work: string }
  | { type: "beyond"; kicker: string; title: string[]; text: string; main: string; extra?: CasePiece[]; wide?: boolean };

export type EditorialStudy = {
  layout: "editorial";
  eyebrow: string;
  headline: [string, string]; // la 2e ligne est mise en couleur
  intro: string;
  tags: string[];
  hero: string;
  heroCaption: string;
  // Logo présenté dans l'en-tête, juste au-dessus de la scène d'ouverture
  headerLogo?: { id: string; caption: string };
  blocks: EditorialBlock[];
  cta: { kicker: string; title: string[] };
  cover: string;
  coverVideo?: string;
};

export const caseStudies: Record<string, CaseStudy | EditorialStudy> = {
  tomavega: {
    layout: "editorial",
    eyebrow: "Identité de stream / TomaVega",
    headline: ["Un univers", "électrique."],
    intro: "Une identité sur fond minéral, traversée de néons verts et violets. Du logo aux alertes, chaque élément parle le même langage.",
    tags: ["Logo", "Overlay animé", "Widgets & alertes", "YouTube"],
    hero: "tomavega-starting-screen",
    heroCaption: "La scène de lancement — l'univers en un regard.",
    headerLogo: { id: "tomavega-logo", caption: "Le logo, point de départ de l'univers." },
    blocks: [
      {
        type: "detail",
        kicker: "Le live en détail",
        title: ["Une communauté", "au cœur du décor."],
        main: { id: "tomavega-tchat", caption: "Le tchat, dans l'habillage de la chaîne." },
        sideTitle: ["Chaque événement", "a son éclat."],
        side: { id: "tomavega-alertes", caption: "Les alertes électriques." },
        small: [{ id: "tomavega-musique", label: "Le panneau « Le son »." , image: "/portfolio/tomavega-musique-bandeau.webp", aspect: "aspect-[10/3]" }],
      },
      {
        type: "beyond",
        kicker: "Au-delà du stream",
        title: ["La même identité", "sur YouTube."],
        text: "Une bannière qui prolonge l'univers minéral et électrique hors du live.",
        main: "tomavega-banniere-youtube",
        wide: true,
      },
    ],
    cta: { kicker: "Ton prochain univers", title: ["Et si on imaginait", "l'identité de ta chaîne ?"] },
    cover: "tomavega-logo",
    coverVideo: "tomavega-starting-screen",
  },
  zer0oes: {
    layout: "editorial",
    eyebrow: "Identité de stream / zer0oes",
    headline: ["Une nuit", "synthwave."],
    intro: "Un horizon néon, une signature à la main et un univers qui relie toutes les scènes du stream.",
    tags: ["Logo", "Overlays", "Widgets", "Emotes"],
    hero: "zer0oes-starting-screen",
    heroCaption: "La scène de lancement — l'univers en un regard.",
    blocks: [
      {
        type: "signature",
        kicker: "La signature",
        title: ["Un trait.", "Toute une identité."],
        main: "zer0oes-logo",
        side: { id: "zer0oes-avatar", caption: "Le même univers, jusque dans l'avatar." },
      },
      {
        type: "scenes",
        kicker: "Les scènes du live",
        title: ["Un décor qui", "suit le stream."],
        text: "Une identité commune, déclinée pour chaque moment du live.",
        scenes: [
          { id: "zer0oes-gaming", label: "Gaming" },
          { id: "zer0oes-paused", label: "Pause" },
          { id: "zer0oes-ending", label: "Fin de live" },
          { id: "zer0oes-offline", label: "Hors ligne" },
        ],
      },
      {
        type: "detail",
        kicker: "Le live en détail",
        title: ["La communauté", "entre dans le décor."],
        main: { id: "zer0oes-chat", caption: "Le tchat, aux couleurs de la chaîne." },
        sideTitle: ["Les petits détails", "font l'ensemble."],
        side: { id: "zer0oes-alertes", caption: "Les alertes animées." },
        small: [
          { id: "zer0oes-musique", label: "La musique." },
          { id: "zer0oes-objectif", label: "L'objectif." },
        ],
      },
      {
        type: "emotes",
        kicker: "Les réactions",
        title: ["Toutes les", "émotions", "du live."],
        text: "Une famille d'emotes dans le style de la chaîne.",
        work: "zer0oes-emotes",
      },
      {
        type: "beyond",
        kicker: "Au-delà du stream",
        title: ["Reconnaissable.", "Partout."],
        text: "La même identité sur Twitch, YouTube et les réseaux.",
        main: "zer0oes-bannieres",
        extra: [{ id: "zer0oes-panneaux", label: "Les panneaux Twitch." }],
      },
    ],
    cta: { kicker: "Ton prochain univers", title: ["Et si on imaginait", "l'identité de ta chaîne ?"] },
    cover: "zer0oes-logo",
    coverVideo: "zer0oes-starting-screen",
  },
};
