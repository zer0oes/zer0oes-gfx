// Types du catalogue et calculs de prix, sans dépendance aux données :
// les réglages (acompte, remise logo) sont passés en paramètre, qu'ils viennent
// de src/data (mode statique) ou de la base Supabase.
// Tous les montants sont en centimes d'euro HT.

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
  // Masquée du site et non commandable (conservée pour l'historique des commandes)
  archived?: boolean;
};

export type Option = { id: string; name: string; price: number; priceFrom?: boolean; unit?: string };

export type PricingSettings = {
  // Acompte proposé à la commande (en %)
  depositPercent: number;
  // Remise « logo déjà existant » (centimes HT)
  logoDiscount: number;
  // Délai de livraison affiché (jours ouvrés)
  deliveryDays: string;
};

export type Catalog = { settings: PricingSettings; packs: Pack[]; options: Option[] };

export type PaymentType = "total" | "acompte";

export function getPack(packs: Pack[], id: string | undefined | null) {
  return packs.find((p) => p.id === id);
}

// Offres visibles sur le site
export function activePacks(packs: Pack[]) {
  return packs.filter((p) => !p.archived);
}

export function getFormula(pack: Pack, formulaId: string | undefined | null) {
  return pack.formulas?.find((f) => f.id === formulaId) ?? pack.formulas?.[0];
}

// Nom complet d'une formule : « Premier look » ou « Premier look — Pack avec emotes »
export function formulaName(pack: Pack, formula: Formula | undefined) {
  return !formula || formula.id === pack.formulas?.[0]?.id ? pack.name : `${pack.name} — ${formula.label}`;
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

export function optionChoices(options: Option[]) {
  return options.map((o) => ({ id: o.id, label: `${o.name} (${formatOfferPrice(o)})` }));
}

export function depositAmount(price: number, s: PricingSettings) {
  return Math.round((price * s.depositPercent) / 100);
}

// Prix de la formule après remise « logo déjà existant »
export function orderPrice(price: number, hasLogo: boolean, s: PricingSettings) {
  return Math.max(0, price - (hasLogo ? s.logoDiscount : 0));
}

export function amountToPay(price: number, payment: PaymentType, s: PricingSettings) {
  return payment === "acompte" ? depositAmount(price, s) : price;
}

export function paymentLabel(price: number, payment: PaymentType, s: PricingSettings) {
  if (payment !== "acompte") return `Paiement en une fois : ${formatPrice(price)} HT`;
  const deposit = depositAmount(price, s);
  return `Acompte de ${s.depositPercent} % : ${formatPrice(deposit)} HT sur ${formatPrice(price)} HT — solde de ${formatPrice(price - deposit)} HT à régler à la livraison`;
}

export function logoDiscountLabel(price: number, s: PricingSettings) {
  return `Remise « logo déjà existant » : −${formatPrice(s.logoDiscount)} HT (${formatPrice(price)} → ${formatPrice(orderPrice(price, true, s))} HT)`;
}

export function parsePaymentType(value: unknown): PaymentType {
  return value === "acompte" ? "acompte" : "total";
}

// Types d'overlays proposés au choix dans le brief.
export const overlayTypes = ["Démarrage", "Pause", "Fin", "Discussion", "Gameplay"];

// Catégories des options à la carte (page Offres), déduites du nom de l'option
export const optionCategories = [
  { id: "overlays", label: "Overlays", hint: "Scènes et habillage du live" },
  { id: "emotes", label: "Emotes", hint: "Pour ton tchat et tes abonnés" },
  { id: "branding", label: "Branding", hint: "Ta chaîne sur toutes les plateformes" },
  { id: "motion", label: "Motion", hint: "Pour donner vie à ton univers" },
] as const;
export type OptionCategory = (typeof optionCategories)[number]["id"];

export function optionCategory(o: Pick<Option, "name">): OptionCategory {
  const n = o.name.toLowerCase();
  if (n.includes("emote")) return "emotes";
  if (/anim|motion|transition|stinger/.test(n)) return "motion";
  if (n.includes("overlay") || n.includes("scène") || n.includes("widget")) return "overlays";
  return "branding";
}
