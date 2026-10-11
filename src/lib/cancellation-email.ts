import { formatPrice } from "./pricing";
import type { Order } from "./store/types";

export function cancellationEmail(order: Pick<Order, "id" | "offerName" | "customerName">, amount: number, pending: boolean) {
  return {
    subject: "Ta commande a bien été annulée",
    eyebrow: "Annulation",
    highlights: [
      `${pending ? "Montant à rembourser" : "Montant remboursé"} : ${formatPrice(amount)}`,
      pending ? "en cours de traitement chez Stripe" : "Stripe a confirmé ton remboursement",
      "le moyen de paiement utilisé lors de la commande",
    ],
    footer: "Une question sur ton annulation ou ton remboursement ? Réponds simplement à ce mail.",
    text: [
      order.customerName ? `Bonjour ${order.customerName},` : "Bonjour,",
      `L’annulation de ta commande « ${order.offerName} » est confirmée. Le projet est désormais clôturé.`,
      `${pending ? "Montant à rembourser" : "Montant remboursé"} : ${formatPrice(amount)}.`,
      pending
        ? "Ton remboursement est en cours de traitement chez Stripe. Il sera effectué sur le moyen de paiement utilisé lors de la commande. Le délai de réception dépend ensuite de ta banque."
        : "Stripe a confirmé ton remboursement. Le montant sera reversé sur le moyen de paiement utilisé lors de la commande ; le délai de réception dépend de ta banque.",
      `Référence de commande : ${order.id}`,
      "Merci d’avoir pensé à moi pour ton projet. Au plaisir de te retrouver pour une prochaine création !",
      "Aurore — zer0oes gfx",
    ].join("\n\n"),
  };
}
