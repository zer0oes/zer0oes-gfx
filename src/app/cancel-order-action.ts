"use server";

import { getStore } from "@/lib/store";
import { getStripe } from "@/lib/stripe";
import { isDeliveryToken } from "@/lib/delivery";
import { canCancelOrder, cancellationStarted } from "@/lib/order-cancellation";
import { newOrderFrom, quoteFromMetadata } from "@/lib/orders";
import { completeOrderCancellation } from "@/lib/order-cancel";

export async function cancelOrderAction(_state: { ok: boolean; message: string } | null, data: FormData) {
  const en = data.get("lang") === "en";
  const token = String(data.get("token") ?? "");
  const sessionId = String(data.get("sessionId") ?? "");
  const fail = (fr: string, english: string) => ({ ok: false, message: en ? english : fr });
  if ((!isDeliveryToken(token) && !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) || data.get("confirm") !== "on") return fail("Confirme l’annulation avant de poursuivre.", "Confirm cancellation before continuing.");
  const store = getStore();
  const stripe = getStripe();
  if (!stripe || store.kind === "static") return fail("L’annulation est indisponible pour le moment.", "Cancellation is currently unavailable.");
  try {
    let order = isDeliveryToken(token) ? await store.getOrderByDeliveryToken(token) : await store.getOrderBySession(sessionId);
    // Le webhook peut ne pas encore avoir enregistré la commande : on vérifie la session chez Stripe.
    if (!order && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const quote = session.metadata ? quoteFromMetadata(session.metadata) : null;
      const payment = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (session.payment_status !== "paid" || !quote || !payment || session.metadata?.kind !== "commande") return fail("Le paiement de cette commande n’a pas pu être vérifié.", "The order payment could not be verified.");
      order = await store.recordPaidOrder({ ...newOrderFrom(quote, { sessionId, demo: false, customerName: session.customer_details?.name ?? "", customerEmail: session.customer_details?.email ?? "", amountPaid: session.amount_total ?? 0 }), paymentIntentId: payment });
    }
    if (!order || order.demo) return fail("Commande introuvable.", "Order not found.");
    if (order.status === "annulee") return { ok: true, message: en ? "Your order is already cancelled." : "Ta commande est déjà annulée." };
    if (!cancellationStarted(order)) {
      if (!canCancelOrder(order, await store.listDeliverables(order.id))) return fail("La création a commencé : contacte-moi pour ta demande d’annulation.", "Creation has started: contact me about cancellation.");
      if (!await store.claimOrderCancellation(order)) return fail("La commande a changé. Actualise la page avant de réessayer.", "The order has changed. Refresh before trying again.");
    }
    // Clé stable : une requête rejouée après une coupure ne rembourse pas une seconde fois.
    const { pending } = await completeOrderCancellation(order, "client");
    return { ok: true, message: en ? (pending ? "Your order is cancelled. Your refund is being processed." : "Your order is cancelled and your Stripe refund has been issued.") : (pending ? "Ta commande est annulée. Ton remboursement est en cours de traitement." : "Ta commande est annulée et ton remboursement Stripe a été effectué.") };
  } catch (error) {
    console.error("Order cancellation failed", error);
    return fail("L’annulation n’a pas pu être finalisée. Réessaie ou contacte-moi ; la création reste suspendue si l’annulation a été engagée.", "Cancellation could not be completed. Retry or contact me; creation remains paused if cancellation has started.");
  }
}
