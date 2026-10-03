import { site } from "./site";

// Offres et options (texte et tarifs fournis par Aurore).
// Les prix sont en centimes d'euro HT (49000 = 490 € HT).
// La mention TVA affichée à côté des prix se règle dans src/data/site.ts (legal.vatNote).
//
// `checkout: true`  → sélecteur de formule + bouton « Commander » vers Stripe Checkout.
//                     Le prix payé est toujours relu ici côté serveur, jamais envoyé par le navigateur.
// `checkout: false` → bouton « Demander un devis » vers la page contact (prix « à partir de »).
// Optionnel : renseigner `stripePriceId` sur une formule (price_...) pour utiliser un prix
// créé dans le Dashboard Stripe au lieu du prix ci-dessous.

export type Formula = {
  id: string;
  label: string;
  price: number;
  stripePriceId?: string;
};

export type Pack = {
  id: string;
  name: string;
  tagline: string;
  price: number;
  priceFrom?: boolean;
  checkout: boolean;
  deliverables: string[];
  // Options propres à l'offre, affichées sous les livrables
  extras?: string[];
  // Formules commandables (la première est la formule de base)
  formulas?: Formula[];
  note?: string;
  highlight?: boolean;
};

export const packs: Pack[] = [
  {
    id: "premier-look",
    name: "Premier look",
    tagline: "L'essentiel pour lancer ta chaîne avec une identité cohérente.",
    price: 49000,
    checkout: true,
    deliverables: ["Logo", "2 overlays fixes au choix", "Bannière et avatar", "2 séries de corrections regroupées"],
    extras: ["Option : 5 emotes personnalisées pour 150 € HT"],
    formulas: [
      { id: "base", label: "Premier look", price: 49000 },
      { id: "emotes", label: "Pack avec emotes", price: 64000 },
    ],
  },
  {
    id: "identite-signature",
    name: "Identité signature",
    tagline: "Une identité complète pour affirmer ton style sur tes streams.",
    price: 99000,
    checkout: true,
    highlight: true,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays fixes au choix",
      "Bannière et avatar",
      "2 séries de corrections regroupées",
    ],
    extras: ["10 emotes personnalisées : 280 € HT", "Animation légère des 5 overlays : 450 € HT"],
    formulas: [
      { id: "base", label: "Identité signature", price: 99000 },
      { id: "emotes", label: "Pack avec emotes", price: 127000 },
      { id: "emotes-animations", label: "Pack avec emotes et animations", price: 172000 },
    ],
  },
  {
    id: "univers-complet",
    name: "Univers complet",
    tagline: "Un univers visuel complet et animé pour ta chaîne.",
    price: 199000,
    priceFrom: true,
    checkout: false,
    deliverables: [
      "Logo et ses déclinaisons",
      "5 overlays animés",
      "Bannière et avatar",
      "15 emotes personnalisées",
      "2 séries de corrections regroupées",
    ],
    note: "Le tarif de base comprend des animations légères : apparition des éléments, transitions simples et boucles d'ambiance. Les animations complexes sont chiffrées sur devis.",
  },
];

// Options à la carte : non vendues via Stripe, elles se cochent dans le brief ou la demande de devis.
export type Option = { id: string; name: string; price: number; priceFrom?: boolean; unit?: string };

export const options: Option[] = [
  { id: "overlay-fixe", name: "Overlay fixe supplémentaire", price: 9000 },
  { id: "animation-overlay", name: "Animation légère d'un overlay existant", price: 10000, priceFrom: true },
  { id: "emote-statique", name: "Emote statique supplémentaire", price: 3500 },
  { id: "emotes-5", name: "Pack de 5 emotes statiques", price: 15000 },
  { id: "emotes-10", name: "Pack de 10 emotes statiques", price: 28000 },
  { id: "emotes-15", name: "Pack de 15 emotes statiques", price: 39000 },
  { id: "emote-animee", name: "Emote animée", price: 7000, priceFrom: true, unit: "unité" },
  { id: "banniere", name: "Bannière pour une plateforme supplémentaire", price: 6000 },
  { id: "panneaux-twitch", name: "Pack de 6 panneaux Twitch", price: 9000 },
  { id: "animation-logo", name: "Animation du logo", price: 18000, priceFrom: true },
  { id: "mascotte", name: "Mascotte illustrée", price: 30000, priceFrom: true },
];

// Types d'overlays proposés au choix dans le brief.
export const overlayTypes = ["Démarrage", "Pause", "Fin", "Discussion", "Gameplay"];

export function getPack(id: string | undefined | null) {
  return packs.find((p) => p.id === id);
}

export function getFormula(pack: Pack, formulaId: string | undefined | null) {
  return pack.formulas?.find((f) => f.id === formulaId) ?? pack.formulas?.[0];
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

// « 490 € HT », « À partir de 1 990 € HT » ou « À partir de 70 € HT / unité »
export function formatOfferPrice({ price, priceFrom, unit }: { price: number; priceFrom?: boolean; unit?: string }) {
  return `${priceFrom ? "À partir de " : ""}${formatPrice(price)} HT${unit ? ` / ${unit}` : ""}`;
}

// Libellés des options pour les cases à cocher des formulaires.
export const optionChoices = options.map((o) => ({ id: o.id, label: `${o.name} (${formatOfferPrice(o)})` }));

// Nom complet d'une formule : « Premier look » ou « Premier look — Pack avec emotes »
export function formulaName(pack: Pack, formula: Formula | undefined) {
  return !formula || formula.id === pack.formulas?.[0]?.id ? pack.name : `${pack.name} — ${formula.label}`;
}

// Paiement en une fois ou acompte (pourcentage réglé dans site.ts).
export type PaymentType = "total" | "acompte";

export function depositAmount(price: number) {
  return Math.round((price * site.depositPercent) / 100);
}

export function amountToPay(price: number, payment: PaymentType) {
  return payment === "acompte" ? depositAmount(price) : price;
}

export function paymentLabel(price: number, payment: PaymentType) {
  if (payment !== "acompte") return `Paiement en une fois : ${formatPrice(price)} HT`;
  const deposit = depositAmount(price);
  return `Acompte de ${site.depositPercent} % : ${formatPrice(deposit)} HT sur ${formatPrice(price)} HT — solde de ${formatPrice(price - deposit)} HT à régler à la livraison`;
}

// Prix de la formule après remise « logo déjà existant » (réglable dans site.ts).
export function orderPrice(price: number, hasLogo: boolean) {
  return Math.max(0, price - (hasLogo ? site.logoDiscount : 0));
}

export function logoDiscountLabel(price: number) {
  return `Remise « logo déjà existant » : −${formatPrice(site.logoDiscount)} HT (${formatPrice(price)} → ${formatPrice(orderPrice(price, true))} HT)`;
}

export function parsePaymentType(value: unknown): PaymentType {
  return value === "acompte" ? "acompte" : "total";
}
