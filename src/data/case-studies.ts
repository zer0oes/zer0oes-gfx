// Présentation des projets en « étude de cas » : textes et ordre des réalisations.
// Les réalisations sont référencées par leur id (src/data/portfolio.ts / base Supabase) ;
// celles qui ne sont citées nulle part apparaissent dans « Les autres pièces du projet ».

// Pièce citée avec un titre court (ex. « Pause ») au lieu de son titre complet
export type CasePiece = { id: string; label: string };

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

export const caseStudies: Record<string, CaseStudy> = {
  tomavega: {
    eyebrow: "Identité de stream · TomaVega",
    headline: ["Un univers électrique.", "Une chaîne reconnaissable."],
    intro:
      "Une identité sur fond minéral, traversée de néons verts et violets. Du logo aux alertes, chaque élément parle le même langage.",
    tags: ["Logo", "Overlay animé", "Widgets & alertes", "YouTube"],
    hero: "tomavega-starting-screen",
    heroCaption: "La scène complète — écran de lancement",
    pillars: [
      {
        kicker: "L'intention",
        title: "Donner du caractère au live.",
        text: "Une présence visuelle forte, avec un logo central et des zones dédiées aux échanges de la communauté.",
      },
      {
        kicker: "La direction artistique",
        title: "Minéral × néon.",
        text: "Une texture sombre pour la profondeur. Des accents électriques pour guider le regard. Des panneaux de chat assortis pour relier l'ensemble.",
      },
    ],
    sections: [
      {
        kicker: "La signature",
        title: "Le logo, point de départ de l'univers.",
        text: "Une forme expressive et des couleurs reprises dans les autres éléments de la chaîne.",
        works: ["tomavega-logo"],
      },
      {
        kicker: "Le live en détail",
        title: "Une communauté au cœur du décor.",
        text: "Deux éléments à regarder de près : le tchat et les alertes, dans la continuité de l'écran de lancement.",
        works: ["tomavega-tchat", "tomavega-alertes"],
        secondary: [{ id: "tomavega-musique", label: "Panneau « Le son »" }],
        secondaryLayout: "pair",
      },
      {
        kicker: "Au-delà du stream",
        title: "La même identité sur YouTube.",
        works: ["tomavega-banniere-youtube"],
      },
    ],
    cover: "tomavega-logo",
    coverVideo: "tomavega-starting-screen",
  },
  zer0oes: {
    eyebrow: "Identité de stream · zer0oes",
    headline: ["Une nuit synthwave.", "Une signature à la main."],
    intro:
      "Ma propre chaîne : un horizon néon rose et violet, un logo tracé d'un seul trait et un portrait qui accueille la communauté. Des écrans d'attente aux emotes, tout part du même univers.",
    tags: ["Logo", "Overlays animés", "Widgets & alertes", "Emotes", "Twitch & YouTube"],
    hero: "zer0oes-starting-screen",
    heroCaption: "La scène complète — écran de lancement",
    scenes: [
      { id: "zer0oes-paused", label: "Pause" },
      { id: "zer0oes-ending", label: "Fin de live" },
      { id: "zer0oes-offline", label: "Hors ligne" },
      { id: "zer0oes-gaming", label: "Gaming" },
    ],
    pillars: [
      {
        kicker: "L'intention",
        title: "Accueillir comme à la maison.",
        text: "Un portrait au centre, le chat bien visible et des infos claires : on sait tout de suite où l'on est et qui on vient voir.",
      },
      {
        kicker: "La direction artistique",
        title: "Synthwave × écriture.",
        text: "Un horizon rétro rose et cyan pour l'énergie, un logo manuscrit pour la touche personnelle, et un cadre animé qui donne le ton de chaque moment du live.",
      },
    ],
    sections: [
      {
        kicker: "La signature",
        title: "Un logo tracé d'un seul trait.",
        text: "Une écriture souple, déclinée en blanc et en violet, qui signe chaque écran.",
        works: ["zer0oes-logo"],
      },
      {
        kicker: "Le live en détail",
        title: "Le chat et les alertes, en néon.",
        text: "Deux éléments à regarder de près : le chat et les alertes, dans les mêmes couleurs que l'écran de lancement.",
        works: ["zer0oes-chat", "zer0oes-alertes"],
        secondary: [
          { id: "zer0oes-objectif", label: "Barre d'objectif" },
          { id: "zer0oes-musique", label: "Lecteur musique" },
        ],
        secondaryLayout: "pair",
      },
      {
        kicker: "La communauté",
        title: "Des emotes à son image.",
        text: "19 emotes de follower et d'abonné, et 6 emotes animées, dans le style de la chaîne.",
        works: ["zer0oes-emotes"],
      },
      {
        kicker: "Au-delà du stream",
        title: "La même identité sur Twitch et YouTube.",
        works: ["zer0oes-bannieres"],
        secondary: [
          { id: "zer0oes-avatar", label: "Avatar" },
          { id: "zer0oes-panneaux", label: "Panneaux Twitch" },
        ],
        secondaryLayout: "profil",
      },
    ],
    cover: "zer0oes-logo",
    coverVideo: "zer0oes-starting-screen",
  },
};
