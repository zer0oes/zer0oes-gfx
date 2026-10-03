import type { Refund } from "@/lib/store/types";

// Remplace les remboursements d'un paiement (payment_intent) par la liste relue chez Stripe,
// en gardant ceux de l'autre paiement de la commande (acompte / solde).
// Idempotent : un webhook rejoué donne le même résultat.
export function mergeRefunds(existing: Refund[] | undefined, paymentIntentId: string, fromStripe: Refund[]): Refund[] {
  const others = (existing ?? []).filter((r) => r.paymentIntentId !== paymentIntentId && !fromStripe.some((x) => x.id === r.id));
  return [...others, ...fromStripe.map((r) => ({ ...r, paymentIntentId }))].sort((a, b) => a.at.localeCompare(b.at));
}

export function refundedTotal(refunds: Refund[] | undefined) {
  return (refunds ?? []).reduce((s, r) => s + r.amount, 0);
}
