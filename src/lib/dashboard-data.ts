import "server-only";
import { movements, parisDay, resolvePeriod, within, type PeriodParams } from "@/lib/dashboard";
import { demoOrders } from "@/lib/dashboard-demo";
import { isProductionLike } from "@/lib/env";
import { getStore } from "@/lib/store";

// Données du tableau de bord (page et export CSV). Les commandes de démo (paiements simulés)
// sont exclues. En local uniquement, tant qu'il n'y a aucune vente réelle, des ventes
// d'exemple sont affichées ; en production, jamais de chiffres fictifs.
export async function loadDashboard(params: PeriodParams) {
  const store = getStore();
  const [orders, invoices, finance, quotes] = await Promise.all([store.listOrders(), store.listInvoices(), store.getFinance(), store.listQuotes()]);
  const today = parisDay(new Date());
  const real = orders.filter((o) => !o.demo);
  const sample = real.length === 0 && !isProductionLike();
  const source = sample ? demoOrders(today) : real;
  const movs = movements(source, sample ? [] : invoices, finance);
  // Sans période demandée : le mois en cours
  const period = resolvePeriod(params.periode ? params : { ...params, periode: "mois" }, today);
  // realOrders / quotes : travail en cours (jamais d'exemples)
  return { today, sample, finance, period, orders: source, allOrders: orders, quotes, movs, inPeriod: movs.filter((m) => within(m, period.start, period.end)) };
}

// searchParams (string | string[]) → paramètres de période
export function periodParams(sp: Record<string, string | string[] | undefined>): PeriodParams {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 20);
  };
  return { periode: one("periode"), ref: one("ref"), debut: one("debut"), fin: one("fin") };
}
