import { formatPrice } from "./pricing";
import type { Order } from "./store/types";

export function cancellationEmail(order: Pick<Order, "id" | "offerName" | "customerName">, amount: number, pending: boolean) {
  return {
    subject: "Confirmation d’annulation de ta commande — zer0oes gfx",
    text: [
      order.customerName ? `Bonjour ${order.customerName},` : "Bonjour,",
      `Ta commande « ${order.offerName} » a bien été annulée. La création est arrêtée.`,
      `Montant remboursé : ${formatPrice(amount)}.`,
      pending
        ? "Ton remboursement a été transmis à Stripe et est en cours de traitement. Il sera crédité sur ton moyen de paiement d’origine selon les délais de ta banque."
        : "Stripe a confirmé ton remboursement sur ton moyen de paiement d’origine. Son apparition sur ton compte dépend des délais de ta banque.",
      `Référence de commande : ${order.id}`,
      "Pour toute question, réponds à cet e-mail.",
      "Aurore — zer0oes gfx",
    ].join("\n\n"),
  };
}
