// Réalisations affichées dans le portfolio.
// CONTENU PROVISOIRE : remplacer par les vraies créations.
// Pour ajouter un visuel : déposer le fichier dans /public/portfolio/
// puis renseigner `image: "/portfolio/mon-fichier.webp"`.
// Sans image, une vignette de couleur générée est affichée à la place.

export type Category = "overlays" | "alertes" | "widgets";

export const categories: { id: Category; label: string }[] = [
  { id: "overlays", label: "Overlays" },
  { id: "alertes", label: "Alertes" },
  { id: "widgets", label: "Widgets" },
];

export type Work = {
  id: string;
  title: string;
  client: string;
  category: Category;
  description: string;
  image?: string;
  // Couleurs de la vignette provisoire
  colors: [string, string];
  featured?: boolean;
};

export const works: Work[] = [
  {
    id: "neon-arcade",
    title: "Neon Arcade",
    client: "Streameur·se exemple",
    category: "overlays",
    description: "Overlay rétro-futuriste avec cadre caméra animé.",
    colors: ["#7c3aed", "#06b6d4"],
    featured: true,
  },
  {
    id: "cozy-forest",
    title: "Cozy Forest",
    client: "Streameur·se exemple",
    category: "overlays",
    description: "Ambiance douce et végétale pour streams chill.",
    colors: ["#15803d", "#facc15"],
  },
  {
    id: "pixel-pop",
    title: "Pixel Pop",
    client: "Streameur·se exemple",
    category: "alertes",
    description: "Alertes en pixel art avec effets sonores.",
    colors: ["#ec4899", "#f97316"],
    featured: true,
  },
  {
    id: "glitch-raid",
    title: "Glitch Raid",
    client: "Streameur·se exemple",
    category: "alertes",
    description: "Alerte de raid avec effet glitch plein écran.",
    colors: ["#ef4444", "#3b82f6"],
  },
  {
    id: "sub-goal",
    title: "Sub Goal",
    client: "Streameur·se exemple",
    category: "widgets",
    description: "Barre d'objectif d'abonnements animée et personnalisable.",
    colors: ["#0ea5e9", "#a855f7"],
    featured: true,
  },
  {
    id: "chat-box",
    title: "Chat Box",
    client: "Streameur·se exemple",
    category: "widgets",
    description: "Chat stylisé aux couleurs de la chaîne.",
    colors: ["#14b8a6", "#6366f1"],
  },
];
