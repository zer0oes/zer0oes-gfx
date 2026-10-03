// Offres et options (textes et tarifs fournis par Aurore).
// Les prix sont en centimes d'euro HT (39000 = 390 € HT).
// La mention TVA affichée à côté des prix se règle dans src/data/site.ts (legal.vatNote).
//
// `checkout: true`  → bouton « Commander » vers Stripe Checkout au prix indiqué.
// `checkout: false` → bouton « Demander un devis » vers la page contact (prix « à partir de »).
// Optionnel : renseigner `stripePriceId` (price_...) pour utiliser un prix
// créé dans le Dashboard Stripe au lieu du prix ci-dessous.

export type Pack = {
  id: string;
  name: string;
  price: number;
  priceFrom?: boolean;
  checkout: boolean;
  stripePriceId?: string;
  audience: string;
  deliverables: string[];
  benefit: string;
  highlight?: boolean;
};

export const packs: Pack[] = [
  {
    id: "premier-look",
    name: "Premier look",
    price: 39000,
    checkout: true,
    audience: "Le créateur qui démarre ou veut une image propre.",
    deliverables: [
      "Logo simple ou avatar graphique",
      "Couleurs",
      "Typographies",
      "Une bannière",
      "Deux séries de corrections",
    ],
    benefit: "Une première identité cohérente pour se lancer.",
  },
  {
    id: "identite-signature",
    name: "Identité signature",
    price: 89000,
    checkout: true,
    highlight: true,
    audience: "Le créateur régulier qui veut être reconnu.",
    deliverables: [
      "Direction visuelle",
      "Logo et déclinaisons",
      "Avatars et bannières pour trois plateformes",
      "Trois modèles de contenus",
      "Mini-guide",
      "Deux séries de corrections",
    ],
    benefit: "Une image distinctive et cohérente sur tous ses contenus.",
  },
  {
    id: "univers-complet",
    name: "Univers complet",
    price: 159000,
    priceFrom: true,
    checkout: false,
    audience: "Le créateur qui veut faire de son activité une marque.",
    deliverables: [
      "Tout le contenu de l'offre Identité signature",
      "Habillage de stream statique : trois écrans, cadre webcam, six panneaux",
      "Prise en main",
    ],
    benefit: "Un univers prêt à déployer au quotidien.",
  },
];

// Options : non vendues via Stripe, elles se cochent dans le brief ou la demande de devis.
export type Option = { id: string; name: string; price: number; priceFrom?: boolean };

export const options: Option[] = [
  { id: "banniere", name: "Bannière supplémentaire", price: 7000 },
  { id: "miniatures", name: "Trois modèles de miniatures", price: 15000 },
  { id: "emotes", name: "Trois emotes simples", price: 12000 },
  { id: "mascotte", name: "Mascotte illustrée", price: 30000, priceFrom: true },
  { id: "animation-logo", name: "Animation du logo", price: 25000, priceFrom: true },
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

// « 390 € HT » ou « À partir de 1 590 € HT »
export function formatOfferPrice({ price, priceFrom }: { price: number; priceFrom?: boolean }) {
  return `${priceFrom ? "À partir de " : ""}${formatPrice(price)} HT`;
}

// Libellés des options pour les cases à cocher des formulaires.
export const optionChoices = options.map((o) => ({ id: o.id, label: `${o.name} (${formatOfferPrice(o)})` }));
