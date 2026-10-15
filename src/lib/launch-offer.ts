import type { Catalog } from "./pricing";
import { saleCatalog, type Promotion } from "./promotions";
import { INSTALL_OPTION_ID } from "./brief-delivery";
import type { ProjectQuote } from "./quotes";

export const LAUNCH_CODE = "LANCEMENT-2026";
export const LAUNCH_LIMIT = 10;
export type LaunchSettings = { enabled: boolean; startsAt: string };
export type LaunchState = { enabled: boolean; remaining: number; ordersRemaining?: number; startsAt?: string };
export function launchActive(state: LaunchState, now = Date.now()) {
  return state.enabled && state.remaining > 0 && (!state.startsAt || Date.parse(state.startsAt) <= now);
}
export function launchCatalog(catalog: Catalog, state: LaunchState, promotions: Promotion[] = []): Catalog {
  if (!launchActive(state)) return saleCatalog(catalog, promotions);
  const common = { id: LAUNCH_CODE, code: LAUNCH_CODE, mode: "sale" as const, enabled: true,
    label: "Offre de lancement", kind: "percent" as const, startsAt: "", endsAt: "", packIds: [] };
  const sales: Promotion[] = [
    { ...common, value: 50, productKeys: catalog.packs.filter((p) => !p.archived).flatMap((p) => [
      `pack:${p.id}`, ...(p.formulas ?? []).map((f) => `formula:${p.id}:${f.id}`),
    ]) },
    { ...common, value: 25, productKeys: catalog.options.filter((o) => o.id !== INSTALL_OPTION_ID).map((o) => `option:${o.id}`) },
  ];
  return saleCatalog(catalog, [...sales, ...promotions]);
}
export function hasLaunchOffer(code?: string) {
  return code?.split(", ").includes(LAUNCH_CODE) ?? false;
}
export function launchQuote(q: ProjectQuote, state: LaunchState): ProjectQuote {
  if (!q.launchPercent || q.status === "accepte" || !launchActive(state)) return q;
  return { ...q, launchBasePrice: q.totalPrice, totalPrice: Math.max(50, q.totalPrice - Math.round(q.totalPrice * q.launchPercent / 100)) };
}
