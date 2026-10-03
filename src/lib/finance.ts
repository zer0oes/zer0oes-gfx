// Revenu net réel d'une vente : prix encaissé → frais de paiement → cotisations → net.
// Tous les taux sont des réglages (admin « Offres et réglages »), jamais codés en dur ici.
// Montants en centimes.

export type FinanceSettings = {
  // Cotisations sociales micro-entrepreneur, activité libérale non réglementée (BNC), en %
  urssafRate: number;
  // Contribution à la formation professionnelle (CFP), en %
  cfpRate: number;
  // Versement libératoire de l'impôt sur le revenu (optionnel)
  vlEnabled: boolean;
  vlRate: number;
  // Frais Stripe par paiement : pourcentage + montant fixe (centimes)
  stripePercent: number;
  stripeFixed: number;
  // Factures Abby : envoyer aussi le PDF au client par e-mail
  abbySendInvoice: boolean;
};

// Taux 2026, à mettre à jour si l'URSSAF ou Stripe changent (modifiables dans l'admin).
export const defaultFinance: FinanceSettings = {
  urssafRate: 25.6,
  cfpRate: 0.2,
  vlEnabled: false,
  vlRate: 2.2,
  stripePercent: 1.5,
  stripeFixed: 25,
  abbySendInvoice: false,
};

export type NetBreakdown = {
  gross: number;
  fees: number;
  urssaf: number;
  cfp: number;
  vl: number;
  net: number;
  transactions: number;
};

const pct = (amount: number, rate: number) => Math.round((amount * rate) / 100);

// Estimation des frais Stripe d'un paiement.
export function stripeFee(amount: number, f: FinanceSettings) {
  return amount > 0 ? pct(amount, f.stripePercent) + f.stripeFixed : 0;
}

// payments : montants de chaque paiement (ex. [acompte, solde]).
// realFees : frais Stripe réels s'ils sont connus (remplacent l'estimation).
export function netBreakdown(payments: number[], f: FinanceSettings, realFees?: number): NetBreakdown {
  const paid = payments.filter((a) => a > 0);
  const gross = paid.reduce((s, a) => s + a, 0);
  const fees = realFees ?? paid.reduce((s, a) => s + stripeFee(a, f), 0);
  // Les cotisations portent sur le chiffre d'affaires encaissé (frais non déductibles en micro).
  const urssaf = pct(gross, f.urssafRate);
  const cfp = pct(gross, f.cfpRate);
  const vl = f.vlEnabled ? pct(gross, f.vlRate) : 0;
  return { gross, fees, urssaf, cfp, vl, net: gross - fees - urssaf - cfp - vl, transactions: paid.length };
}

// « 25,6 % »
export function formatRate(rate: number) {
  return `${rate.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export function chargesRate(f: FinanceSettings) {
  return f.urssafRate + f.cfpRate + (f.vlEnabled ? f.vlRate : 0);
}
