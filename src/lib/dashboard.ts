// Tableau de bord : encaissements, cotisations URSSAF, frais et net, par période.
// Tout est calculé à la date d'encaissement (heure de Paris), comme pour la déclaration
// URSSAF d'une micro-entreprise. Montants en centimes. Fonctions pures (testées).
import { stripeFee, type FinanceSettings, type UrssafPeriodicity } from "@/lib/finance";
import { refundedTotal } from "@/lib/refunds";
import { balanceDue, type Invoice, type Order } from "@/lib/store/types";

export type PaymentKind = "acompte" | "solde" | "complet";
export type MovementKind = PaymentKind | "remboursement";

export const kindLabels: Record<MovementKind, string> = {
  acompte: "Acomptes",
  solde: "Soldes",
  complet: "Paiements complets",
  remboursement: "Remboursements",
};

const kindSingular: Record<MovementKind, string> = {
  acompte: "Acompte",
  solde: "Solde",
  complet: "Paiement complet",
  remboursement: "Remboursement",
};

// Un encaissement (montant positif) ou un remboursement (montant négatif).
export type Movement = {
  orderId: string;
  offerName: string;
  customer: string;
  demo: boolean;
  at: string;
  day: string; // AAAA-MM-JJ, heure de Paris
  kind: MovementKind;
  amount: number;
  fee: number;
  feeEstimated: boolean;
};

const parisFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

// « 2026-10-03 » (jour à Paris)
export function parisDay(d: string | Date) {
  return parisFmt.format(new Date(d));
}

// --- Mouvements ----------------------------------------------------------------------

export function movements(orders: Order[], invoices: Invoice[], f: FinanceSettings): Movement[] {
  const out: Movement[] = [];
  for (const o of orders) {
    const base = { orderId: o.id, offerName: o.offerName, customer: o.customerEmail || o.customerName, demo: o.demo };
    // Acompte : montant de sa facture si elle existe, sinon recalculé comme au paiement
    const deposit =
      invoices.find((i) => i.orderId === o.id && i.kind === "acompte")?.amount ?? Math.round((o.totalPrice * o.depositPercent) / 100);
    const first = o.paymentType === "acompte" && o.balancePaidAt ? Math.min(deposit, o.amountPaid) : o.amountPaid;
    const second = o.balancePaidAt ? o.amountPaid - first : 0;

    // Frais réels (cumulés acompte + solde) répartis au prorata, sinon estimés
    let fee1 = stripeFee(first, f);
    let fee2 = stripeFee(second, f);
    const real = o.feesPaid !== undefined;
    if (real) {
      fee1 = second > 0 ? Math.round((o.feesPaid! * first) / (first + second)) : o.feesPaid!;
      fee2 = o.feesPaid! - fee1;
    }

    if (first > 0) {
      out.push({ ...base, at: o.createdAt, day: parisDay(o.createdAt), kind: o.paymentType === "acompte" ? "acompte" : "complet", amount: first, fee: fee1, feeEstimated: !real });
    }
    if (second > 0 && o.balancePaidAt) {
      out.push({ ...base, at: o.balancePaidAt, day: parisDay(o.balancePaidAt), kind: "solde", amount: second, fee: fee2, feeEstimated: !real });
    }
    for (const r of o.refunds ?? []) {
      // Stripe ne rembourse pas ses frais : aucun frais en moins
      out.push({ ...base, at: r.at, day: parisDay(r.at), kind: "remboursement", amount: -r.amount, fee: 0, feeEstimated: false });
    }
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

export const within = (m: { day: string }, start: string, end: string) => m.day >= start && m.day <= end;

// --- Totaux ----------------------------------------------------------------------------

export type Totals = {
  collected: number; // encaissé (hors remboursements)
  refunds: number; // remboursé (positif)
  revenue: number; // chiffre d'affaires à déclarer = encaissé − remboursé
  byKind: Record<PaymentKind, number>;
  fees: number;
  feesEstimated: boolean;
  urssaf: number;
  cfp: number;
  vl: number;
  contributions: number; // urssaf + cfp + vl
  net: number;
  payments: number;
};

const pct = (amount: number, rate: number) => Math.round((amount * rate) / 100);

export function contributionsOf(revenue: number, f: FinanceSettings) {
  const base = Math.max(0, revenue);
  const urssaf = pct(base, f.urssafRate);
  const cfp = pct(base, f.cfpRate);
  const vl = f.vlEnabled ? pct(base, f.vlRate) : 0;
  return { urssaf, cfp, vl, total: urssaf + cfp + vl };
}

export function totals(movs: Movement[], f: FinanceSettings): Totals {
  const byKind: Record<PaymentKind, number> = { acompte: 0, solde: 0, complet: 0 };
  let refunds = 0;
  let fees = 0;
  let feesEstimated = false;
  let payments = 0;
  for (const m of movs) {
    if (m.kind === "remboursement") refunds -= m.amount;
    else {
      byKind[m.kind] += m.amount;
      payments++;
    }
    fees += m.fee;
    if (m.feeEstimated) feesEstimated = true;
  }
  const collected = byKind.acompte + byKind.solde + byKind.complet;
  const revenue = collected - refunds;
  const c = contributionsOf(revenue, f);
  return {
    collected,
    refunds,
    revenue,
    byKind,
    fees,
    feesEstimated,
    urssaf: c.urssaf,
    cfp: c.cfp,
    vl: c.vl,
    contributions: c.total,
    net: revenue - fees - c.total,
    payments,
  };
}

// Nouvelles commandes de la période (premier paiement dans la période).
export function newOrdersCount(orders: Order[], start: string, end: string) {
  return orders.filter((o) => o.amountPaid > 0 && within({ day: parisDay(o.createdAt) }, start, end)).length;
}

// Soldes restant à encaisser aujourd'hui (commandes à acompte, hors commandes remboursées).
export function outstandingBalances(orders: Order[]) {
  const open = orders.filter((o) => balanceDue(o) > 0 && refundedTotal(o.refunds) < o.amountPaid);
  return { amount: open.reduce((s, o) => s + balanceDue(o), 0), count: open.length };
}

// Chiffre d'affaires par offre sur la période (remboursements déduits).
export function revenueByOffer(movs: Movement[]) {
  const map = new Map<string, number>();
  for (const m of movs) map.set(m.offerName, (map.get(m.offerName) ?? 0) + m.amount);
  return [...map.entries()].map(([offer, revenue]) => ({ offer, revenue })).sort((a, b) => b.revenue - a.revenue);
}

// --- Dates (chaînes AAAA-MM-JJ, sans fuseau) ---------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m : 1-12
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const parts = (day: string) => day.split("-").map(Number) as [number, number, number];
const isDay = (s: unknown): s is string => {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = parts(s);
  return m >= 1 && m <= 12 && d >= 1 && d <= lastDay(y, m);
};

export function addDays(day: string, n: number) {
  const [y, m, d] = parts(day);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string) {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000);
}

const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const monthShort = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

export function formatDay(day: string) {
  const [y, m, d] = parts(day);
  return `${d} ${monthNames[m - 1]} ${y}`;
}

// --- Périodes --------------------------------------------------------------------------

export type PeriodKind = "mois" | "trimestre" | "annee" | "perso";

export type Period = {
  kind: PeriodKind;
  start: string;
  end: string;
  label: string;
  ref?: string;
  prevRef?: string;
  nextRef?: string;
};

export const periodKinds: { id: PeriodKind; label: string }[] = [
  { id: "mois", label: "Mois" },
  { id: "trimestre", label: "Trimestre" },
  { id: "annee", label: "Année" },
  { id: "perso", label: "Personnalisée" },
];

const quarterOf = (m: number) => Math.ceil(m / 3);

function monthPeriod(y: number, m: number): Period {
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return { kind: "mois", start: ymd(y, m, 1), end: ymd(y, m, lastDay(y, m)), label: `${monthNames[m - 1]} ${y}`, ref: `${y}-${pad(m)}`, prevRef: prev, nextRef: next };
}

function quarterPeriod(y: number, q: number): Period {
  const m1 = (q - 1) * 3 + 1;
  return {
    kind: "trimestre",
    start: ymd(y, m1, 1),
    end: ymd(y, m1 + 2, lastDay(y, m1 + 2)),
    label: `${q === 1 ? "1er" : `${q}e`} trimestre ${y}`,
    ref: `${y}-T${q}`,
    prevRef: q === 1 ? `${y - 1}-T4` : `${y}-T${q - 1}`,
    nextRef: q === 4 ? `${y + 1}-T1` : `${y}-T${q + 1}`,
  };
}

function yearPeriod(y: number): Period {
  return { kind: "annee", start: ymd(y, 1, 1), end: ymd(y, 12, 31), label: `Année ${y}`, ref: String(y), prevRef: String(y - 1), nextRef: String(y + 1) };
}

export type PeriodParams = { periode?: string; ref?: string; debut?: string; fin?: string };

// Période demandée dans l'URL, ou par défaut le trimestre en cours.
export function resolvePeriod(p: PeriodParams, today: string): Period {
  const [ty, tm] = parts(today);
  const ref = p.ref ?? "";
  switch (p.periode) {
    case "mois": {
      const m = ref.match(/^(\d{4})-(\d{2})$/);
      const y = m ? Number(m[1]) : ty;
      const mo = m ? Number(m[2]) : tm;
      return mo >= 1 && mo <= 12 ? monthPeriod(y, mo) : monthPeriod(ty, tm);
    }
    case "annee": {
      const m = ref.match(/^(\d{4})$/);
      return yearPeriod(m ? Number(m[1]) : ty);
    }
    case "perso": {
      if (isDay(p.debut) && isDay(p.fin) && p.debut <= p.fin && daysBetween(p.debut, p.fin) <= 366 * 5) {
        return { kind: "perso", start: p.debut, end: p.fin, label: `du ${formatDay(p.debut)} au ${formatDay(p.fin)}` };
      }
      return { ...quarterPeriod(ty, quarterOf(tm)), kind: "perso", ref: undefined, prevRef: undefined, nextRef: undefined };
    }
    default: {
      const m = ref.match(/^(\d{4})-T([1-4])$/);
      return quarterPeriod(m ? Number(m[1]) : ty, m ? Number(m[2]) : quarterOf(tm));
    }
  }
}

// --- Séries pour les graphiques ------------------------------------------------------

// label : texte complet (tableaux) ; axis : texte court sous l'axe des graphiques
export type Bucket = { key: string; label: string; axis: string; start: string; end: string };

// Par jour jusqu'à 35 jours, par mois au-delà.
export function bucketsFor(period: { start: string; end: string }): Bucket[] {
  const out: Bucket[] = [];
  if (daysBetween(period.start, period.end) < 35) {
    for (let d = period.start; d <= period.end; d = addDays(d, 1)) {
      const [, m, day] = parts(d);
      out.push({ key: d, label: `${day} ${monthShort[m - 1]}`, axis: String(day), start: d, end: d });
    }
    return out;
  }
  let [y, m] = parts(period.start);
  const [ey, em] = parts(period.end);
  while (y < ey || (y === ey && m <= em)) {
    const s = ymd(y, m, 1);
    const e = ymd(y, m, lastDay(y, m));
    out.push({
      key: `${y}-${pad(m)}`,
      label: `${monthShort[m - 1]} ${String(y).slice(2)}`,
      axis: m === 1 || !out.length ? `${monthShort[m - 1]} ${String(y).slice(2)}` : monthShort[m - 1],
      start: s < period.start ? period.start : s,
      end: e > period.end ? period.end : e,
    });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

export type SeriesPoint = Bucket & {
  acompte: number;
  solde: number;
  complet: number;
  refunds: number;
  revenue: number;
  net: number;
  cumulativeRevenue: number;
  cumulativeNet: number;
  future: boolean; // commence après aujourd'hui
};

export function series(movs: Movement[], period: { start: string; end: string }, f: FinanceSettings, today: string): SeriesPoint[] {
  let cumulativeRevenue = 0;
  let cumulativeNet = 0;
  return bucketsFor(period).map((b) => {
    const t = totals(
      movs.filter((m) => within(m, b.start, b.end)),
      f,
    );
    cumulativeRevenue += t.revenue;
    cumulativeNet += t.net;
    return { ...b, ...t.byKind, refunds: t.refunds, revenue: t.revenue, net: t.net, cumulativeRevenue, cumulativeNet, future: b.start > today };
  });
}

// --- Déclarations URSSAF -------------------------------------------------------------

export type DeclarationState = "en_cours" | "a_declarer" | "echue";

export type Declaration = {
  key: string;
  label: string;
  start: string;
  end: string;
  deadline: string; // dernier jour du mois qui suit la période
  revenue: number;
  contributions: number;
  state: DeclarationState;
};

export const declarationStateLabels: Record<DeclarationState, string> = {
  en_cours: "Période en cours",
  a_declarer: "À déclarer",
  echue: "Échéance passée",
};

function declarationPeriodOf(day: string, periodicity: UrssafPeriodicity) {
  const [y, m] = parts(day);
  if (periodicity === "mensuelle") {
    const p = monthPeriod(y, m);
    return { key: p.ref!, label: p.label, start: p.start, end: p.end };
  }
  const q = quarterOf(m);
  const p = quarterPeriod(y, q);
  return { key: p.ref!, label: `T${q} ${y}`, start: p.start, end: p.end };
}

// Échéance : fin du mois suivant la période (ex. T3 → 31 octobre, septembre → 31 octobre).
export function deadlineOf(end: string) {
  const [y, m] = parts(end);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return ymd(ny, nm, lastDay(ny, nm));
}

function declaration(movs: Movement[], f: FinanceSettings, p: ReturnType<typeof declarationPeriodOf>, today: string): Declaration {
  const revenue = totals(
    movs.filter((m) => within(m, p.start, p.end)),
    f,
  ).revenue;
  const deadline = deadlineOf(p.end);
  const state: DeclarationState = today <= p.end ? "en_cours" : today <= deadline ? "a_declarer" : "echue";
  return { ...p, deadline, revenue, contributions: contributionsOf(revenue, f).total, state };
}

// Périodes de déclaration qui recoupent la période affichée (sans aller au-delà d'aujourd'hui).
export function declarations(movs: Movement[], f: FinanceSettings, period: { start: string; end: string }, today: string): Declaration[] {
  const out: Declaration[] = [];
  const last = period.end < today ? period.end : today;
  if (period.start > last) return out;
  let d = period.start;
  for (;;) {
    const p = declarationPeriodOf(d, f.urssafPeriodicity);
    out.push(declaration(movs, f, p, today));
    d = addDays(p.end, 1);
    if (d > last) break;
  }
  return out;
}

// Prochaine échéance : la période terminée dont l'échéance n'est pas passée, sinon la période en cours.
export function nextDeclaration(movs: Movement[], f: FinanceSettings, today: string): Declaration {
  const current = declarationPeriodOf(today, f.urssafPeriodicity);
  const previous = declarationPeriodOf(addDays(current.start, -1), f.urssafPeriodicity);
  if (today <= deadlineOf(previous.end)) return declaration(movs, f, previous, today);
  return declaration(movs, f, current, today);
}

// --- Export CSV --------------------------------------------------------------------------

const csvAmount = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");
// Texte venant des clients : neutralise les formules (=, +, -, @) à l'ouverture dans un tableur
const csvText = (v: string) => (/^[=+\-@\t\r]/.test(v) ? `'${v}` : v);
const csvCell = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

// Séparateur « ; » et virgule décimale : s'ouvre directement dans Excel en français.
export function toCsv(movs: Movement[]) {
  const head = ["Date", "Type", "Offre", "Client", "Commande", "Montant (EUR)", "Frais Stripe (EUR)", "Frais estimés"];
  const rows = movs.map((m) => [
    m.day,
    kindSingular[m.kind],
    csvText(m.offerName),
    csvText(m.customer),
    m.orderId,
    csvAmount(m.amount),
    csvAmount(m.fee),
    m.feeEstimated ? "oui" : "non",
  ]);
  return "﻿" + [head, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n") + "\r\n";
}
