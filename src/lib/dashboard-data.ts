import "server-only";
import { movements, parisDay, resolvePeriod, within, type PeriodParams } from "@/lib/dashboard";
import { demoOrders } from "@/lib/dashboard-demo";
import { getStore } from "@/lib/store";

// Données du tableau de bord (page et export CSV). Les commandes de démo (paiements simulés)
// sont exclues ; tant qu'il n'y a aucune vente réelle, des ventes d'exemple sont affichées.
export async function loadDashboard(params: PeriodParams) {
  const store = getStore();
  const [orders, invoices, finance] = await Promise.all([store.listOrders(), store.listInvoices(), store.getFinance()]);
  const today = parisDay(new Date());
  const real = orders.filter((o) => !o.demo);
  const sample = real.length === 0;
  const source = sample ? demoOrders(today) : real;
  const movs = movements(source, sample ? [] : invoices, finance);
  // Sans période demandée : le mois en cours si la déclaration URSSAF est mensuelle, sinon le trimestre
  const period = resolvePeriod(params.periode ? params : { ...params, periode: finance.urssafPeriodicity === "mensuelle" ? "mois" : "trimestre" }, today);
  return { today, sample, finance, period, orders: source, movs, inPeriod: movs.filter((m) => within(m, period.start, period.end)) };
}

// searchParams (string | string[]) → paramètres de période
export function periodParams(sp: Record<string, string | string[] | undefined>): PeriodParams {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 20);
  };
  return { periode: one("periode"), ref: one("ref"), debut: one("debut"), fin: one("fin") };
}
