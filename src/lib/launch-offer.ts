import type { Catalog } from "./pricing";
import { promotionProducts, saleCatalog, type Promotion } from "./promotions";
import { INSTALL_OPTION_ID } from "./brief-delivery";
import type { ProjectQuote } from "./quotes";

export const LAUNCH_CODE = "LANCEMENT-2026";
export const LAUNCH_LIMIT = 10;
// Taux de l'offre : un pourcentage par produit (products), et ceux des devis d'un pack ou à la carte / sur mesure.
// products vide : packs et options reçoivent leur taux par défaut (packs, options).
export type LaunchRates = { packs: number; options: number; products: Record<string, number> };
export const defaultLaunchRates: LaunchRates = { packs: 50, options: 25, products: {} };
// quota null : places illimitées, l'offre s'arrête alors à sa date de fin (endsAt). Absent : ancien quota de 10.
// remaining : places restantes (Infinity sans quota) ; ordersRemaining : commandes payées restantes (null sans quota).
export type LaunchSettings = { enabled: boolean; startsAt: string; endsAt?: string; quota?: number | null; rates?: LaunchRates };
export type LaunchState = { enabled: boolean; remaining: number; used?: number; ordersRemaining?: number | null; startsAt?: string; endsAt?: string; quota?: number | null; rates?: LaunchRates };
export const launchQuota = (state: Pick<LaunchState, "quota">) => state.quota === undefined ? LAUNCH_LIMIT : state.quota;
export function launchRates(state: Pick<LaunchState, "rates">): LaunchRates {
  const r = state.rates;
  return { packs: r?.packs ?? defaultLaunchRates.packs, options: r?.options ?? defaultLaunchRates.options, products: r?.products ?? {} };
}
// Pourcentage de chaque produit pendant l'offre (l'installation par zer0oes_GFX n'est jamais remisée)
export function launchProductRates(catalog: Catalog, state: Pick<LaunchState, "rates">): Record<string, number> {
  const rates = launchRates(state);
  const products = promotionProducts(catalog).filter((p) => p.key !== `option:${INSTALL_OPTION_ID}`);
  if (Object.keys(rates.products).length) return Object.fromEntries(products.flatMap((p) => rates.products[p.key] ? [[p.key, rates.products[p.key]]] : []));
  return Object.fromEntries(products.map((p) => [p.key, p.kind === "pack" ? rates.packs : rates.options]));
}
export function launchActive(state: LaunchState, now = Date.now()) {
  return state.enabled && state.remaining > 0 && (!state.startsAt || Date.parse(state.startsAt) <= now) && (!state.endsAt || Date.parse(state.endsAt) > now);
}
export function launchCatalog(catalog: Catalog, state: LaunchState, promotions: Promotion[] = []): Catalog {
  if (!launchActive(state)) return saleCatalog(catalog, promotions);
  // Packs : la clé pack: couvre aussi un pack sans formule ; formules : leurs propres clés
  const rates = launchProductRates(catalog, state);
  const sale: Promotion = { id: LAUNCH_CODE, code: LAUNCH_CODE, mode: "sale", enabled: true, label: "Offre de lancement", kind: "percent",
    value: Math.max(0, ...Object.values(rates)), startsAt: "", endsAt: "", packIds: [], productRates: rates };
  const sales = [sale];
  return saleCatalog(catalog, [...sales, ...promotions]);
}
export function hasLaunchOffer(code?: string) {
  return code?.split(", ").includes(LAUNCH_CODE) ?? false;
}
export function launchQuote(q: ProjectQuote, state: LaunchState): ProjectQuote {
  if (!q.launchPercent || q.status === "accepte" || !launchActive(state)) return q;
  return { ...q, launchBasePrice: q.totalPrice, totalPrice: Math.max(50, q.totalPrice - Math.round(q.totalPrice * q.launchPercent / 100)) };
}
