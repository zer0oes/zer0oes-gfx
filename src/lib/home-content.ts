// Textes et visuels de la page d'accueil (Admin > Page d'accueil) et textes de la page
// Portfolio (Admin > Portfolio), modifiables dans l'admin et enregistrés ensemble.
// Les valeurs par défaut reprennent l'accueil actuel ; ce qui est saisi dans l'admin les remplace.
// Les visuels sont choisis parmi les réalisations du portfolio (par leur id).
import { translationValues } from "@/lib/admin-translations";
import { site } from "@/data/site";
import type { Locale } from "@/lib/i18n";

export type FieldKind = "text" | "long" | "lines" | "paragraphs" | "work" | "emotes" | "image";
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
      { key: "about.image", label: "Portrait", kind: "image", max: 2048 },
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

export const offersPageFields: HomeField[] = [
  { key: "pricing.kicker", label: "Surtitre", kind: "text", max: 60 },
  { key: "pricing.title", label: "Titre — début", kind: "text", max: 80 },
  { key: "pricing.titleAccent", label: "Titre — partie en dégradé", kind: "text", max: 80 },
  { key: "pricing.intro", label: "Sous-titre", kind: "long" },
  { key: "pricing.explanationTitle", label: "Titre de l’explication des packs", kind: "text", max: 120 },
  { key: "pricing.summary", label: "Phrase courte sous le titre des packs", kind: "long" },
  { key: "pricing.optionsIntro", label: "Introduction de l’onglet À la carte", kind: "long" },
  ...comparisonFields(),
  ...glossaryFields(),
  { key: "options.receive", label: "Cartes à la carte — titre de la liste des fichiers livrés", kind: "text", max: 40 },
];

// Tableau comparatif des packs. {n} : nombre lu dans le pack, {prix} : écart de prix entre formules,
// {acompte} : pourcentage d'acompte. Les nombres et les prix restent ceux des packs.
function comparisonFields(): HomeField[] {
  return [
  { key: "compare.title", label: "Comparatif — titre", kind: "text", max: 120 },
  { key: "compare.intro", label: "Comparatif — texte d’introduction", kind: "long" },
  { key: "compare.badge", label: "Comparatif — badge du pack mis en avant", kind: "text", max: 30 },
  { key: "compare.choose", label: "Comparatif — bouton des packs commandables", kind: "text", max: 40 },
  { key: "compare.quote", label: "Comparatif — bouton du pack sur devis", kind: "text", max: 40 },
  { key: "compare.row.logo", label: "Ligne « logo » — intitulé", kind: "text", max: 60 },
  { key: "compare.logo.plain", label: "Ligne « logo » — logo seul", kind: "text", max: 60 },
  { key: "compare.logo.variations", label: "Ligne « logo » — avec déclinaisons", kind: "text", max: 60 },
  { key: "compare.row.overlays", label: "Ligne « overlays » — intitulé", kind: "text", max: 60 },
  { key: "compare.overlays.static", label: "Ligne « overlays » — statiques ({n})", kind: "text", max: 60 },
  { key: "compare.overlays.animated", label: "Ligne « overlays » — animés ({n})", kind: "text", max: 60 },
  { key: "compare.row.animation", label: "Ligne « animation » — intitulé", kind: "text", max: 60 },
  { key: "compare.animation.included", label: "Ligne « animation » — incluse", kind: "text", max: 60 },
  { key: "compare.animation.option", label: "Ligne « animation » — en option ({prix})", kind: "text", max: 60 },
  { key: "compare.row.alerts", label: "Ligne « alertes » — intitulé", kind: "text", max: 60 },
  { key: "compare.alerts.static", label: "Ligne « alertes » — statiques ({n})", kind: "text", max: 60 },
  { key: "compare.alerts.animated", label: "Ligne « alertes » — animées ({n})", kind: "text", max: 60 },
  { key: "compare.onQuote", label: "Ligne « alertes » — pack sur devis", kind: "text", max: 60 },
  { key: "compare.row.bannerAvatar", label: "Ligne « bannière et avatar » — intitulé", kind: "text", max: 60 },
  { key: "compare.row.emotes", label: "Ligne « emotes » — intitulé", kind: "text", max: 60 },
  { key: "compare.emotes.included", label: "Ligne « emotes » — incluses ({n})", kind: "text", max: 60 },
  { key: "compare.emotes.includedStatic", label: "Ligne « emotes » — statiques incluses ({n})", kind: "text", max: 60 },
  { key: "compare.emotes.option", label: "Ligne « emotes » — en option ({n}, {prix})", kind: "text", max: 60 },
  { key: "compare.row.corrections", label: "Ligne « corrections » — intitulé", kind: "text", max: 60 },
  { key: "compare.row.logoSupplied", label: "Ligne « logo déjà existant » — intitulé", kind: "text", max: 60 },
  { key: "compare.logoSupplied.quote", label: "Ligne « logo déjà existant » — pack sur devis", kind: "text", max: 60 },
  { key: "compare.row.order", label: "Ligne « commande » — intitulé", kind: "text", max: 60 },
  { key: "compare.order.online", label: "Ligne « commande » — en ligne", kind: "text", max: 60 },
  { key: "compare.order.quote", label: "Ligne « commande » — sur devis", kind: "text", max: 60 },
  { key: "compare.row.deposit", label: "Ligne « acompte » — intitulé ({acompte})", kind: "text", max: 60 },
  ];
}

// Bulles « ? » des termes techniques : nom affiché en tête de bulle et explication
function glossaryFields(): HomeField[] {
  return [
  { key: "glossary.declinaisons.term", label: "Bulle « Déclinaisons du logo » — terme", kind: "text", max: 40 },
  { key: "glossary.declinaisons.text", label: "Bulle « Déclinaisons du logo » — explication", kind: "long" },
  { key: "glossary.overlay.term", label: "Bulle « Overlay » — terme", kind: "text", max: 40 },
  { key: "glossary.overlay.text", label: "Bulle « Overlay » — explication", kind: "long" },
  { key: "glossary.alertes.term", label: "Bulle « Alertes » — terme", kind: "text", max: 40 },
  { key: "glossary.alertes.text", label: "Bulle « Alertes » — explication", kind: "long" },
  { key: "glossary.emotes.term", label: "Bulle « Emotes » — terme", kind: "text", max: 40 },
  { key: "glossary.emotes.text", label: "Bulle « Emotes » — explication", kind: "long" },
  { key: "glossary.widgetAvance.term", label: "Bulle « Widget interactif avancé » — terme", kind: "text", max: 40 },
  { key: "glossary.widgetAvance.text", label: "Bulle « Widget interactif avancé » — explication", kind: "long" },
  { key: "glossary.widget.term", label: "Bulle « Widget personnalisé » — terme", kind: "text", max: 40 },
  { key: "glossary.widget.text", label: "Bulle « Widget personnalisé » — explication", kind: "long" },
  { key: "glossary.stinger.term", label: "Bulle « Stinger » — terme", kind: "text", max: 40 },
  { key: "glossary.stinger.text", label: "Bulle « Stinger » — explication", kind: "long" },
  { key: "glossary.panneaux.term", label: "Bulle « Panneaux Twitch » — terme", kind: "text", max: 40 },
  { key: "glossary.panneaux.text", label: "Bulle « Panneaux Twitch » — explication", kind: "long" },
  { key: "glossary.banniere.term", label: "Bulle « Bannière » — terme", kind: "text", max: 40 },
  { key: "glossary.banniere.text", label: "Bulle « Bannière » — explication", kind: "long" },
  { key: "glossary.corrections.term", label: "Bulle « Corrections » — terme", kind: "text", max: 40 },
  { key: "glossary.corrections.text", label: "Bulle « Corrections » — explication", kind: "long" },
  ];
}

export const homeDefaults: Record<string, string> = {
  "pricing.kicker": "Packs & à la carte",
  "pricing.title": "Un univers",
  "pricing.titleAccent": "à ton image.",
  "pricing.intro": "Une identité complète ou quelques créations pour enrichir ta chaîne : choisis ce qui te correspond.",
  "pricing.explanationTitle": "Une identité pensée dans son ensemble.",
  "pricing.summary": "Logo et habillage conçus autour d’une même direction graphique.",
  "pricing.optionsIntro": "Les prestations à la carte répondent à un besoin ponctuel ou permettent de compléter ton univers existant.",
  "hero.title1": "Ton stream.",
  "hero.title2": "Ton univers.",
  "hero.text": "Logos, overlays et emotes sur mesure pour Twitch et YouTube.",
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
  "about.image": "/a-propos/zer0oes-avatar.webp",
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
  "options.receive": "Tu reçois",
  "compare.title": "Comparer les packs",
  "compare.intro": "Tout ce que contient chaque pack, ligne par ligne. Survole ou touche les « ? » pour le détail d'un terme.",
  "compare.badge": "Le plus choisi",
  "compare.choose": "Choisir ce pack",
  "compare.quote": "Demander un devis",
  "compare.row.logo": "Logo",
  "compare.logo.plain": "Logo",
  "compare.logo.variations": "Logo + déclinaisons",
  "compare.row.overlays": "Overlays",
  "compare.overlays.static": "{n} statiques",
  "compare.overlays.animated": "{n} animés",
  "compare.row.animation": "Animation des overlays",
  "compare.animation.included": "Légère, incluse",
  "compare.animation.option": "En option, {prix}",
  "compare.row.alerts": "Alertes",
  "compare.alerts.static": "{n} statiques",
  "compare.alerts.animated": "{n} animées",
  "compare.onQuote": "Sur devis",
  "compare.row.bannerAvatar": "Bannière et avatar",
  "compare.row.emotes": "Emotes",
  "compare.emotes.included": "{n} incluses",
  "compare.emotes.includedStatic": "{n} statiques incluses",
  "compare.emotes.option": "{n} en option, {prix}",
  "compare.row.corrections": "Corrections par élément",
  "compare.row.logoSupplied": "Tu as déjà ton logo",
  "compare.logoSupplied.quote": "Remise sur devis",
  "compare.row.order": "Commande",
  "compare.order.online": "En ligne",
  "compare.order.quote": "Sur devis",
  "compare.row.deposit": "Acompte de {acompte} % possible",
  "glossary.declinaisons.term": "Déclinaisons du logo",
  "glossary.declinaisons.text": "Versions du logo adaptées à chaque usage : icône seule, version horizontale, version une couleur… pour qu'il reste lisible partout.",
  "glossary.overlay.term": "Overlay",
  "glossary.overlay.text": "Habillage affiché par-dessus ton live dans OBS : écran de démarrage, de pause, de fin, discussion ou cadre autour du jeu et de la caméra.",
  "glossary.alertes.term": "Alertes",
  "glossary.alertes.text": "Petites animations qui apparaissent à l'écran quand quelqu'un suit ta chaîne, s'abonne, lance un raid, envoie des bits ou un don.",
  "glossary.emotes.term": "Emotes",
  "glossary.emotes.text": "Petites images à ton effigie que ta communauté utilise dans le tchat (Twitch, YouTube, Discord).",
  "glossary.widgetAvance.term": "Widget interactif avancé",
  "glossary.widgetAvance.text": "Widget avec une logique sur mesure : il réagit aux événements du live (follow, sub, dons…), affiche des éléments selon des conditions ou se met à jour à partir de données externes. Développement chiffré sur devis.",
  "glossary.widget.term": "Widget personnalisé",
  "glossary.widget.text": "Un widget au fonctionnement classique, habillé à ton image : barre d'objectif, tchat affiché à l'écran, encart sponsor… Tu choisis son contenu et son apparence, sans développement sur mesure.",
  "glossary.stinger.term": "Stinger",
  "glossary.stinger.text": "Courte animation de transition qui recouvre l'écran pendant le passage d'une scène à l'autre.",
  "glossary.panneaux.term": "Panneaux Twitch",
  "glossary.panneaux.text": "Encadrés sous ta vidéo sur Twitch : à propos, planning, réseaux, règles du tchat…",
  "glossary.banniere.term": "Bannière",
  "glossary.banniere.text": "Grande image en haut de ta page de chaîne, sur Twitch ou YouTube.",
  "glossary.corrections.term": "Corrections",
  "glossary.corrections.text": "Allers-retours pour ajuster une création après ma première proposition : couleurs, texte, détails.",
};

// Version anglaise des textes (/en). Les visuels et les noms d'emotes sont communs aux deux langues.
// Une traduction saisie dans l'admin est enregistrée sous la clé « en:<clé> ».
export const homeDefaultsEn: Record<string, string> = {
  "pricing.kicker": "Packages & à la carte",
  "pricing.title": "A universe",
  "pricing.titleAccent": "that reflects you.",
  "pricing.intro": "A complete identity or a few creations to enrich your channel: choose what suits you.",
  "pricing.explanationTitle": "An identity designed as a whole.",
  "pricing.summary": "Your logo and channel visuals designed around a shared visual direction.",
  "pricing.optionsIntro": "À la carte services meet a specific need or help expand your existing visual universe.",
  "hero.title1": "Your stream.",
  "hero.title2": "Your universe.",
  "hero.text": "Custom logos, overlays and emotes for Twitch and YouTube.",
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
  "options.receive": "You receive",
  "compare.title": "Compare the packages",
  "compare.intro": "Everything each package contains, line by line. Hover or tap the “?” for the meaning of a term.",
  "compare.badge": "Most popular",
  "compare.choose": "Choose this package",
  "compare.quote": "Request a quote",
  "compare.row.logo": "Logo",
  "compare.logo.plain": "Logo",
  "compare.logo.variations": "Logo + variations",
  "compare.row.overlays": "Overlays",
  "compare.overlays.static": "{n} static",
  "compare.overlays.animated": "{n} animated",
  "compare.row.animation": "Overlay animation",
  "compare.animation.included": "Light, included",
  "compare.animation.option": "Add-on, {prix}",
  "compare.row.alerts": "Alerts",
  "compare.alerts.static": "{n} static",
  "compare.alerts.animated": "{n} animated",
  "compare.onQuote": "On quote",
  "compare.row.bannerAvatar": "Banner and avatar",
  "compare.row.emotes": "Emotes",
  "compare.emotes.included": "{n} included",
  "compare.emotes.includedStatic": "{n} static, included",
  "compare.emotes.option": "{n} as add-on, {prix}",
  "compare.row.corrections": "Revisions per item",
  "compare.row.logoSupplied": "You already have a logo",
  "compare.logoSupplied.quote": "Discount on quote",
  "compare.row.order": "Ordering",
  "compare.order.online": "Online",
  "compare.order.quote": "On quote",
  "compare.row.deposit": "{acompte}% deposit available",
  "glossary.declinaisons.term": "Logo variations",
  "glossary.declinaisons.text": "Versions of the logo for each use: icon only, horizontal, single colour… so it stays readable everywhere.",
  "glossary.overlay.term": "Overlay",
  "glossary.overlay.text": "Graphics shown over your live in OBS: starting, break and ending screens, just chatting, or a frame around your game and camera.",
  "glossary.alertes.term": "Alerts",
  "glossary.alertes.text": "Short on-screen pop-ups when someone follows, subscribes, raids, cheers bits or sends a tip.",
  "glossary.emotes.term": "Emotes",
  "glossary.emotes.text": "Small custom images your community uses in chat (Twitch, YouTube, Discord).",
  "glossary.widgetAvance.term": "Advanced interactive widget",
  "glossary.widgetAvance.text": "A widget with custom logic: it reacts to live events (follows, subs, tips…), shows elements based on conditions or updates from external data. Development priced on quote.",
  "glossary.widget.term": "Custom widget",
  "glossary.widget.text": "A standard widget styled to match your look: goal bar, on-screen chat, sponsor panel… You choose its content and appearance, with no custom development.",
  "glossary.stinger.term": "Stinger",
  "glossary.stinger.text": "A short transition animation that covers the screen while switching scenes.",
  "glossary.panneaux.term": "Twitch panels",
  "glossary.panneaux.text": "The boxes under your video on Twitch: about, schedule, socials, chat rules…",
  "glossary.banniere.term": "Banner",
  "glossary.banniere.text": "The large image at the top of your channel page, on Twitch or YouTube.",
  "glossary.corrections.term": "Revisions",
  "glossary.corrections.text": "Rounds of changes to adjust a creation after my first proposal: colours, text, details.",
};

const homeFields = homeSections.flatMap((s) => s.fields);
const fields = [...homeFields, ...portfolioPageFields, ...offersPageFields];
export type ContentGroup = "accueil" | "portfolio" | "offres";
const groupFields = (group: ContentGroup) => group === "accueil" ? homeFields : group === "portfolio" ? portfolioPageFields : offersPageFields;
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
  group: ContentGroup = "accueil",
): Record<string, string> {
  const edited = groupFields(group);
  const kept = resolveStored(stored, fields.filter((f) => !edited.includes(f)));
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
export function resetGroup(stored: unknown, group: ContentGroup) {
  const translations = translationValues(stored);
  const removed = groupFields(group);
  for (const field of removed) delete translations[`en:${field.key}`];
  const kept = { ...resolveStored(stored, fields.filter((f) => !removed.includes(f))), ...translations };
  return Object.keys(kept).length ? kept : null;
}

export type HomeContent = { values: Record<string, string>; text(key: string): string; lines(key: string): string[] };

// Champs communs aux deux langues : visuels choisis et noms des emotes autour du visuel
const shared = (f: HomeField) => f.kind === "work" || f.kind === "emotes" || f.kind === "image" || f.key === "hero.emotes";

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
