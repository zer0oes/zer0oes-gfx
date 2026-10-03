// Réalisations affichées dans le portfolio : projets zer0oes et TomaVega
// (captures faites dans StreamerLab, événements de chat et d'alertes simulés).
// Pour ajouter un visuel : déposer le fichier dans /public/portfolio/
// puis renseigner `image: "/portfolio/mon-fichier.webp"`.
// Sans image, une vignette de couleur générée est affichée à la place.
// `video` (optionnel) : courte boucle MP4 lue en grand dans la visionneuse, avec l'image en affiche.

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
  video?: string;
  // Couleurs de la vignette de secours (si pas d'image)
  colors: [string, string];
  featured?: boolean;
};

export const works: Work[] = [
  {
    id: "zer0oes-starting-screen",
    title: "Écran « Stream Starting »",
    client: "zer0oes",
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
    client: "TomaVega",
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
    client: "zer0oes",
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
    client: "TomaVega",
    category: "alertes",
    description: "Alertes pour StreamElements et Streamlabs, une animation par type d'événement.",
    image: "/portfolio/tomavega-alerte-sub.webp",
    video: "/portfolio/tomavega-alerte-sub.mp4",
    colors: ["#6366f1", "#0ea5e9"],
  },
  {
    id: "zer0oes-widgets",
    title: "Chat néon et barre d'objectif",
    client: "zer0oes",
    category: "widgets",
    description: "Chat personnalisé, derniers follow / sub / tip animés et barre d'objectif multi-événements.",
    image: "/portfolio/zer0oes-widgets.webp",
    video: "/portfolio/zer0oes-widgets.mp4",
    colors: ["#0ea5e9", "#a855f7"],
  },
  {
    id: "tomavega-chat",
    title: "Tchat communautaire",
    client: "TomaVega",
    category: "widgets",
    description: "Tchat au design de la chaîne, branché sur les vrais messages, avec badges VIP, abonnés et rôles.",
    image: "/portfolio/tomavega-chat.webp",
    video: "/portfolio/tomavega-chat.mp4",
    colors: ["#14b8a6", "#6366f1"],
  },
];
