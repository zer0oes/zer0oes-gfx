// Types du catalogue et calculs de prix, sans dépendance aux données :
// les réglages (acompte, remise logo) sont passés en paramètre, qu'ils viennent
// de src/data (mode statique) ou de la base Supabase.
// Tous les montants sont en centimes d'euro HT.

import { intlLocale, type Locale } from "@/lib/i18n";
import { trDeep } from "@/lib/translations-en";

export type Formula = {
  normalPrice?: number;
  promotionCode?: string;
  id: string;
  label: string;
  price: number;
  stripePriceId?: string;
};

export type Pack = {
  normalPrice?: number;
  promotionCode?: string;
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

export type Option = { id: string; name: string; price: number; normalPrice?: number; promotionCode?: string; priceFrom?: boolean; unit?: string; category?: OptionCategory };

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

export function formatPrice(cents: number, locale: Locale = "fr") {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

// Franchise en base de TVA (EI) : prix nets, sans mention HT, avec cette seule mention
export const vatExemption = (locale: Locale = "fr") =>
  locale === "en" ? "VAT not applicable, article 293 B of the French General Tax Code" : "TVA non applicable, art. 293 B du CGI";

// « 490 € », « À partir de 1 990 € » ou « À partir de 70 € / unité » (en anglais : « From €1,990 »)
export function formatOfferPrice({ price, priceFrom, unit }: { price: number; priceFrom?: boolean; unit?: string }, locale: Locale = "fr") {
  const from = priceFrom ? (locale === "en" ? "From " : "À partir de ") : "";
  const per = unit ? ` / ${locale === "en" && unit === "unité" ? "each" : unit}` : "";
  return `${from}${formatPrice(price, locale)}${per}`;
}

// Nom d'option affiché en deux temps : « Widget personnalisé » + précision entre parenthèses
// (« barre d'objectifs, tchat… ») montrée en plus petit.
export function splitOptionName(name: string) {
  const m = name.match(/^(.+?)\s*\(([^()]+)\)$/);
  return m ? { main: m[1], detail: m[2] } : { main: name, detail: undefined };
}

export type OptionChoice = { id: string; label: string; main?: string; detail?: string; price?: string };

// label : valeur envoyée avec le formulaire (nom et prix, toujours en français pour Aurore) ;
// le reste sert à l'affichage, dans la langue de la page
export function optionChoices(options: Option[], locale: Locale = "fr"): OptionChoice[] {
  return options.map((o) => ({
    id: o.id,
    label: `${o.name} (${formatOfferPrice(o)})`,
    ...splitOptionName(trDeep(locale, o).name),
    price: formatOfferPrice(trDeep(locale, o), locale),
  }));
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
  if (payment !== "acompte") return `Paiement en une fois : ${formatPrice(price)}`;
  const deposit = depositAmount(price, s);
  return `Acompte de ${s.depositPercent} % : ${formatPrice(deposit)} sur ${formatPrice(price)} — solde de ${formatPrice(price - deposit)} à régler à la livraison`;
}

export function logoDiscountLabel(price: number, s: PricingSettings) {
  return `Remise « logo déjà existant » : −${formatPrice(s.logoDiscount)} (${formatPrice(price)} → ${formatPrice(orderPrice(price, true, s))})`;
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
  { id: "motion", label: "Animation", hint: "Pour donner vie à ton univers" },
] as const;
export type OptionCategory = (typeof optionCategories)[number]["id"];

export function optionCategory(o: Pick<Option, "name" | "category">): OptionCategory {
  if (o.category && optionCategories.some((c) => c.id === o.category)) return o.category;
  const n = o.name.toLowerCase();
  if (n.includes("emote")) return "emotes";
  // Overlays, alertes et widgets (même animés) : habillage du live
  if (/^overlay|alerte|widget/.test(n)) return "overlays";
  if (/anim|motion|transition|stinger/.test(n)) return "motion";
  if (n.includes("overlay") || n.includes("scène") || n.includes("widget")) return "overlays";
  return "branding";
}
