// Réalisations affichées dans le portfolio, rangées par streameur
// (captures faites dans StreamerLab, événements de chat et d'alertes simulés).
// Pour ajouter un streameur : l'ajouter dans `streamers`, puis renseigner `streamer` sur ses réalisations.
// Pour ajouter un visuel : déposer le fichier dans /public/portfolio/
// puis renseigner `image: "/portfolio/mon-fichier.webp"`.
// Sans image, une vignette de couleur générée est affichée à la place.
// `video` (optionnel) : courte boucle MP4 lue en grand dans la visionneuse, avec l'image en affiche.

export type Category = "logo" | "overlays" | "widgets" | "alertes" | "emotes" | "reseaux";

// L'ordre ici est aussi l'ordre d'affichage dans chaque section streameur.
export const categories: { id: Category; label: string }[] = [
  { id: "logo", label: "Logo" },
  { id: "overlays", label: "Overlays" },
  { id: "widgets", label: "Widgets" },
  { id: "alertes", label: "Alertes" },
  { id: "emotes", label: "Emotes" },
  { id: "reseaux", label: "Réseaux sociaux" },
];

export type Streamer = { id: string; name: string; description: string; url?: string };

export const streamers: Streamer[] = [
  {
    id: "zer0oes",
    name: "zer0oes",
    description: "Ma propre chaîne : univers néon violet, du cadre de stream aux emotes.",
    url: "https://www.twitch.tv/zer0oes",
  },
  {
    id: "tomavega",
    name: "TomaVega",
    description: "Identité électrique sur fond minéral : écran de lancement, tchat et alertes.",
  },
];

// Lien vers la page projet d'un streameur, sur l'onglet d'un type donné
export function projectHref(streamer: string, category?: Category) {
  return `/portfolio/${streamer}${category ? `?type=${category}` : ""}`;
}

// Planche d'emotes : groupes repris du tableau d'Aurore.
export const emoteGroups = [
  { id: "follower", label: "Émoticônes de follower" },
  { id: "abonne", label: "Émoticônes d'abonné" },
  { id: "animee", label: "Émoticônes d'abonné animées" },
] as const;

export type Emote = { name: string; group: (typeof emoteGroups)[number]["id"]; src: string; animated?: boolean };

export type Work = {
  id: string;
  title: string;
  streamer: string;
  category: Category;
  description: string;
  image?: string;
  video?: string;
  // Planche d'emotes affichée en grand à la place de l'image
  emotes?: Emote[];
  // Couleurs de la vignette de secours (si pas d'image)
  colors: [string, string];
  featured?: boolean;
};

const zer0oesEmotes: Emote[] = [
  { name: "GG", group: "follower", src: "/portfolio/emotes/gg.webp" },
  { name: "HYPE", group: "follower", src: "/portfolio/emotes/hype.webp" },
  { name: "RAID", group: "follower", src: "/portfolio/emotes/raid.webp" },
  { name: "LURK", group: "follower", src: "/portfolio/emotes/lurk.webp" },
  { name: "CRY", group: "abonne", src: "/portfolio/emotes/cry.webp" },
  { name: "LUL", group: "abonne", src: "/portfolio/emotes/lul.webp" },
  { name: "WINK", group: "abonne", src: "/portfolio/emotes/wink.webp" },
  { name: "THINK", group: "abonne", src: "/portfolio/emotes/think.webp" },
  { name: "MMH", group: "abonne", src: "/portfolio/emotes/mmh.webp" },
  { name: "FEAR", group: "abonne", src: "/portfolio/emotes/fear.webp" },
  { name: "RAGE", group: "abonne", src: "/portfolio/emotes/rage.webp" },
  { name: "EVIL", group: "abonne", src: "/portfolio/emotes/evil.webp" },
  { name: "LOVE", group: "abonne", src: "/portfolio/emotes/love.webp" },
  { name: "BAVE", group: "abonne", src: "/portfolio/emotes/bave.webp" },
  { name: "HOT", group: "abonne", src: "/portfolio/emotes/hot.webp" },
  { name: "PLEASE", group: "abonne", src: "/portfolio/emotes/please.webp" },
  { name: "FACEPALM", group: "abonne", src: "/portfolio/emotes/facepalm.webp" },
  { name: "BLUSH", group: "abonne", src: "/portfolio/emotes/blush.webp" },
  { name: "COOL", group: "abonne", src: "/portfolio/emotes/cool.webp" },
  { name: "ACHOC", group: "animee", src: "/portfolio/emotes/achoc.webp", animated: true },
  { name: "ACOOL", group: "animee", src: "/portfolio/emotes/acool.webp", animated: true },
  { name: "ACRY", group: "animee", src: "/portfolio/emotes/acry.webp", animated: true },
  { name: "AFACEPALM", group: "animee", src: "/portfolio/emotes/afacepalm.webp", animated: true },
  { name: "AMMH", group: "animee", src: "/portfolio/emotes/ammh.webp", animated: true },
  { name: "OOPS", group: "animee", src: "/portfolio/emotes/oops.webp", animated: true },
];

export const works: Work[] = [
  {
    id: "zer0oes-logo",
    title: "Logo zer0oes",
    streamer: "zer0oes",
    category: "logo",
    description: "Logo manuscrit tracé d'un seul trait, décliné en blanc et en violet pour le stream et les réseaux.",
    image: "/portfolio/zer0oes-logo.webp",
    colors: ["#5b21b6", "#2e1065"],
  },
  {
    id: "zer0oes-starting-screen",
    title: "Écran « Stream Starting »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Écran d'attente avant le live : portrait néon, cadre et logo animés, chat, objectif et réseaux sociaux.",
    image: "/portfolio/zer0oes-starting-anime.webp",
    video: "/portfolio/zer0oes-starting-anime.mp4",
    colors: ["#7c3aed", "#06b6d4"],
    featured: true,
  },
  {
    id: "zer0oes-paused",
    title: "Écran « Stream Paused »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Écran de pause dans le même univers : le cadre animé, le chat et l'objectif restent visibles.",
    image: "/portfolio/zer0oes-paused-anime.webp",
    video: "/portfolio/zer0oes-paused-anime.mp4",
    colors: ["#7c3aed", "#ec4899"],
  },
  {
    id: "zer0oes-ending",
    title: "Écran « Stream Ending »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Écran de fin de live, dans la continuité des écrans de lancement et de pause.",
    image: "/portfolio/zer0oes-ending-anime.webp",
    video: "/portfolio/zer0oes-ending-anime.mp4",
    colors: ["#ec4899", "#7c3aed"],
  },
  {
    id: "zer0oes-offline",
    title: "Écran « Stream Offline »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Écran hors ligne avec le planning de la semaine et les réseaux sociaux.",
    image: "/portfolio/zer0oes-offline-26.webp",
    colors: ["#a855f7", "#ec4899"],
  },
  {
    id: "zer0oes-gaming",
    title: "Scène « Gaming »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Scène de jeu : bandeau d'infos animé en haut (date, derniers événements, réseaux) et objectif discret, pour laisser toute la place au jeu.",
    image: "/portfolio/zer0oes-gaming-anime.webp",
    video: "/portfolio/zer0oes-gaming-anime.mp4",
    colors: ["#0ea5e9", "#7c3aed"],
  },
  {
    id: "zer0oes-gaming-sans-cam",
    title: "Scène « Gaming » sans webcam",
    streamer: "zer0oes",
    category: "overlays",
    description: "Variante de la scène de jeu sans webcam, le jeu en plein écran.",
    image: "/portfolio/zer0oes-gaming-sans-cam-26.webp",
    colors: ["#7c3aed", "#0ea5e9"],
  },
  {
    id: "zer0oes-just-chatting",
    title: "Scène « Just Chatting »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Scène de discussion : chat néon, objectif et bandeau d'infos animé.",
    image: "/portfolio/zer0oes-just-chatting-anime.webp",
    video: "/portfolio/zer0oes-just-chatting-anime.mp4",
    colors: ["#a855f7", "#06b6d4"],
  },
  {
    id: "zer0oes-just-chatting-cam",
    title: "Scène « Just Chatting » webcam plein écran",
    streamer: "zer0oes",
    category: "overlays",
    description: "Variante de la scène de discussion avec la webcam en plein écran.",
    image: "/portfolio/zer0oes-just-chatting-cam-26.webp",
    colors: ["#06b6d4", "#a855f7"],
  },
  {
    id: "zer0oes-chat",
    title: "Chat néon",
    streamer: "zer0oes",
    category: "widgets",
    description: "Chat personnalisé aux couleurs de la chaîne, avec badges et réactions.",
    image: "/portfolio/zer0oes-chat.webp",
    video: "/portfolio/zer0oes-chat.mp4",
    colors: ["#0ea5e9", "#a855f7"],
  },
  {
    id: "zer0oes-objectif",
    title: "Barre d'objectif",
    streamer: "zer0oes",
    category: "widgets",
    description: "Barre d'objectif multi-événements qui se remplit en direct.",
    image: "/portfolio/zer0oes-objectif.webp",
    video: "/portfolio/zer0oes-objectif.mp4",
    colors: ["#0ea5e9", "#7c3aed"],
  },
  {
    id: "zer0oes-musique",
    title: "Lecteur musique",
    streamer: "zer0oes",
    category: "widgets",
    description: "Morceau en cours sur Spotify, avec pochette et progression (morceau fictif pour l'aperçu).",
    image: "/portfolio/zer0oes-musique.webp",
    video: "/portfolio/zer0oes-musique.mp4",
    colors: ["#571bc3", "#ff4d8d"],
  },
  {
    id: "zer0oes-alertes",
    title: "Alertes néon",
    streamer: "zer0oes",
    category: "alertes",
    description: "Follow, sub, raid, cheer, don et sub offert : une carte néon par type d'événement.",
    image: "/portfolio/zer0oes-alertes.webp",
    video: "/portfolio/zer0oes-alertes.mp4",
    colors: ["#ec4899", "#7c3aed"],
    featured: true,
  },
  {
    id: "tomavega-logo",
    title: "Logo TomaVega",
    streamer: "tomavega",
    category: "logo",
    description: "Logo électrique aux éclats néon bleu, violet et vert, avec un V en forme d'éclair.",
    image: "/portfolio/tomavega-logo.webp",
    colors: ["#22c55e", "#7c3aed"],
  },
  {
    id: "tomavega-starting-screen",
    title: "Starting screen",
    streamer: "tomavega",
    category: "overlays",
    description: "Logo néon animé, titre de scène et réseaux sociaux, avec le tchat et la musique.",
    image: "/portfolio/tomavega-starting-screen-v2.webp",
    video: "/portfolio/tomavega-starting-screen-v2.mp4",
    colors: ["#22c55e", "#6366f1"],
    featured: true,
  },
  {
    id: "tomavega-tchat",
    title: "Tchat communautaire",
    streamer: "tomavega",
    category: "widgets",
    description: "Tchat au design de la chaîne, branché sur les vrais messages, avec badges VIP, abonnés et rôles.",
    image: "/portfolio/tomavega-tchat-v2.webp",
    video: "/portfolio/tomavega-tchat-v2.mp4",
    colors: ["#14b8a6", "#6366f1"],
  },
  {
    id: "tomavega-musique",
    title: "Panneau « Le son »",
    streamer: "tomavega",
    category: "widgets",
    description: "Morceau en cours via Last.fm ou Spotify (morceau fictif pour l'aperçu).",
    image: "/portfolio/tomavega-musique.webp",
    colors: ["#7c3aed", "#22d3ee"],
  },
  {
    id: "tomavega-alertes",
    title: "Alertes électriques",
    streamer: "tomavega",
    category: "alertes",
    description: "Follow, sub, raid, bits, don et sub offert, pour StreamElements et Streamlabs.",
    image: "/portfolio/tomavega-alertes.webp",
    video: "/portfolio/tomavega-alertes.mp4",
    colors: ["#6366f1", "#0ea5e9"],
  },
  {
    id: "tomavega-banniere-youtube",
    title: "Bannière YouTube",
    streamer: "tomavega",
    category: "reseaux",
    description: "Bannière sur fond minéral avec éclats verts et violets, logo néon, thèmes de la chaîne et réseaux sociaux.",
    image: "/portfolio/tomavega-banniere-youtube.webp",
    colors: ["#22c55e", "#111827"],
  },
  {
    id: "zer0oes-emotes",
    title: "Emotes zer0oes",
    streamer: "zer0oes",
    category: "emotes",
    description: "19 emotes de follower et d'abonné, et 6 emotes animées, dans le style de la chaîne.",
    image: "/portfolio/zer0oes-emotes.webp",
    // Aperçu au survol (la vue en grand affiche la planche complète)
    video: "/portfolio/zer0oes-emotes-animees.mp4",
    colors: ["#ef4444", "#7c3aed"],
    emotes: zer0oesEmotes,
  },
  {
    id: "zer0oes-bannieres",
    title: "Bannières Twitch et YouTube",
    streamer: "zer0oes",
    category: "reseaux",
    description: "Bannières assorties pour Twitch et YouTube : logo, réseaux sociaux et portrait dans l'univers néon de la chaîne.",
    image: "/portfolio/zer0oes-bannieres.webp",
    colors: ["#ec4899", "#7c3aed"],
  },
  {
    id: "zer0oes-avatar",
    title: "Avatar",
    streamer: "zer0oes",
    category: "reseaux",
    description: "Photo de profil aux lumières néon de la chaîne, la même sur Twitch, YouTube et les réseaux, pour être reconnue partout.",
    image: "/portfolio/zer0oes-avatar-v2.webp",
    colors: ["#be185d", "#4c1d95"],
  },
  {
    id: "zer0oes-panneaux",
    title: "Panneaux Twitch",
    streamer: "zer0oes",
    category: "reseaux",
    description: "Titres de panneaux pour la page Bio de Twitch : à propos, soutien, planning, abonnement, sponsors et config.",
    image: "/portfolio/zer0oes-panneaux.webp",
    colors: ["#7c3aed", "#0e0e10"],
  },
];
