// Réalisations affichées dans le portfolio, rangées par streameur
// (captures faites dans StreamerLab, événements de chat et d'alertes simulés).
// Pour ajouter un streameur : l'ajouter dans `streamers`, puis renseigner `streamer` sur ses réalisations.
// Pour ajouter un visuel : déposer le fichier dans /public/portfolio/
// puis renseigner `image: "/portfolio/mon-fichier.webp"`.
// Sans image, une vignette de couleur générée est affichée à la place.
// `video` (optionnel) : courte boucle MP4 lue en grand dans la visionneuse, avec l'image en affiche.

export type Category = "overlays" | "widgets" | "alertes" | "emotes";

// L'ordre ici est aussi l'ordre d'affichage dans chaque section streameur.
export const categories: { id: Category; label: string }[] = [
  { id: "overlays", label: "Overlays" },
  { id: "widgets", label: "Widgets" },
  { id: "alertes", label: "Alertes" },
  { id: "emotes", label: "Emotes" },
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

export function getStreamer(id: string) {
  return streamers.find((s) => s.id === id);
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
    id: "zer0oes-starting-screen",
    title: "Écran « Stream Starting »",
    streamer: "zer0oes",
    category: "overlays",
    description: "Écran d'attente avec cadre animé, chat néon, derniers événements et barre d'objectif.",
    image: "/portfolio/zer0oes-starting-screen.webp",
    video: "/portfolio/zer0oes-starting-screen.mp4",
    colors: ["#7c3aed", "#06b6d4"],
    featured: true,
  },
  {
    id: "tomavega-starting-screen",
    title: "Starting screen",
    streamer: "tomavega",
    category: "overlays",
    description: "Logo néon animé, titre de scène et réseaux sociaux, avec le tchat de la communauté.",
    image: "/portfolio/tomavega-starting-screen.webp",
    video: "/portfolio/tomavega-starting-screen.mp4",
    colors: ["#22c55e", "#6366f1"],
    featured: true,
  },
  {
    id: "zer0oes-alertes",
    title: "Alertes néon",
    streamer: "zer0oes",
    category: "alertes",
    description: "Alertes StreamElements au look néon violet : follow, sub, sub offert, cheer, tip et raid.",
    image: "/portfolio/zer0oes-alerte-sub.webp",
    video: "/portfolio/zer0oes-alerte-sub.mp4",
    colors: ["#ec4899", "#7c3aed"],
    featured: true,
  },
  {
    id: "tomavega-alertes",
    title: "Alertes électriques",
    streamer: "tomavega",
    category: "alertes",
    description: "Alertes pour StreamElements et Streamlabs, une animation par type d'événement.",
    image: "/portfolio/tomavega-alerte-sub.webp",
    video: "/portfolio/tomavega-alerte-sub.mp4",
    colors: ["#6366f1", "#0ea5e9"],
  },
  {
    id: "zer0oes-widgets",
    title: "Chat néon et barre d'objectif",
    streamer: "zer0oes",
    category: "widgets",
    description: "Chat personnalisé, derniers follow / sub / tip animés et barre d'objectif multi-événements.",
    image: "/portfolio/zer0oes-chat-objectif.webp",
    video: "/portfolio/zer0oes-chat-objectif.mp4",
    colors: ["#0ea5e9", "#a855f7"],
  },
  {
    id: "tomavega-chat",
    title: "Tchat communautaire",
    streamer: "tomavega",
    category: "widgets",
    description: "Tchat au design de la chaîne, branché sur les vrais messages, avec badges VIP, abonnés et rôles.",
    image: "/portfolio/tomavega-tchat.webp",
    video: "/portfolio/tomavega-tchat.mp4",
    colors: ["#14b8a6", "#6366f1"],
  },
  {
    id: "zer0oes-emotes",
    title: "Emotes zer0oes",
    streamer: "zer0oes",
    category: "emotes",
    description: "19 emotes de follower et d'abonné, et 6 emotes animées, dans le style de la chaîne.",
    image: "/portfolio/zer0oes-emotes.webp",
    colors: ["#ef4444", "#7c3aed"],
    emotes: zer0oesEmotes,
  },
];
