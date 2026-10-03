// Offres vendues via Stripe Checkout (textes fournis par Aurore).
// PRIX PROVISOIRES : aucun prix n'a encore été fixé. Remplacer `price`
// (en centimes d'euro, 4900 = 49,00 €) puis passer `provisionalPrice` à false.
// Optionnel : renseigner `stripePriceId` (price_...) pour utiliser un prix
// créé dans le Dashboard Stripe au lieu du prix ci-dessous.

export type Pack = {
  id: string;
  name: string;
  price: number;
  provisionalPrice?: boolean;
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
    price: 10000, // PROVISOIRE
    provisionalPrice: true,
    audience: "Le créateur qui démarre ou veut une image propre.",
    deliverables: [
      "Un échange de cadrage",
      "Un avatar ou logo simple",
      "Une palette de couleurs",
      "Une sélection de typographies",
      "Une bannière pour sa plateforme principale",
    ],
    benefit: "Une première identité cohérente pour se lancer.",
  },
  {
    id: "identite-signature",
    name: "Identité signature",
    price: 20000, // PROVISOIRE
    provisionalPrice: true,
    highlight: true,
    audience: "Le créateur régulier qui veut être reconnu.",
    deliverables: [
      "Un cadrage de sa personnalité et de son audience",
      "Une direction visuelle",
      "Un logo et ses déclinaisons",
      "Couleurs et typographies",
      "Avatars et bannières pour trois plateformes",
      "Trois modèles de publications ou miniatures",
      "Un guide d'utilisation",
    ],
    benefit: "Une image distinctive et cohérente sur tous ses contenus.",
  },
  {
    id: "univers-complet",
    name: "Univers complet",
    price: 30000, // PROVISOIRE
    provisionalPrice: true,
    audience: "Le créateur qui veut faire de son activité une marque.",
    deliverables: [
      "Tout le contenu de l'offre Identité signature",
      "Un système graphique étendu",
      "Un kit adapté à son activité : habillage de stream OU modèles de contenus supplémentaires",
      "Une séance de prise en main",
    ],
    benefit: "Un univers prêt à déployer au quotidien.",
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
