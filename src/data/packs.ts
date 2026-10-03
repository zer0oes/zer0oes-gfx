// Packs vendus via Stripe Checkout.
// CONTENU PROVISOIRE : noms, prix et contenus sont à remplacer par Aurore.
// Le prix est en centimes d'euro (4900 = 49,00 €).
// Optionnel : renseigner `stripePriceId` (price_...) pour utiliser un prix
// créé dans le Dashboard Stripe au lieu du prix ci-dessous.

export type Pack = {
  id: string;
  name: string;
  price: number;
  stripePriceId?: string;
  pitch: string;
  features: string[];
  highlight?: boolean;
};

export const packs: Pack[] = [
  {
    id: "debutant",
    name: "Pack Débutant",
    price: 4900,
    pitch: "L'essentiel pour lancer une chaîne propre et reconnaissable.",
    features: [
      "Overlay de jeu (caméra + infos)",
      "3 écrans : démarrage, pause, fin",
      "Panneaux de profil Twitch (x4)",
      "1 aller-retour de corrections",
    ],
  },
  {
    id: "confirme",
    name: "Pack Confirmé",
    price: 12900,
    highlight: true,
    pitch: "Une identité complète et animée pour faire passer un cap au stream.",
    features: [
      "Tout le pack Débutant, en version animée",
      "Alertes animées : follow, sub, don, raid",
      "Écran « Just Chatting »",
      "Bannière et image hors ligne",
      "2 allers-retours de corrections",
    ],
  },
  {
    id: "full",
    name: "Pack Full",
    price: 24900,
    pitch: "L'univers de stream complet, widgets interactifs compris.",
    features: [
      "Tout le pack Confirmé",
      "Widgets : objectifs, chat stylisé, derniers events",
      "Transitions (stinger) animées",
      "Emotes et badges de sub (x6)",
      "Installation dans OBS / Streamlabs en visio",
      "Corrections illimitées pendant 30 jours",
    ],
  },
];

export function getPack(id: string | undefined | null) {
  return packs.find((p) => p.id === id);
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
