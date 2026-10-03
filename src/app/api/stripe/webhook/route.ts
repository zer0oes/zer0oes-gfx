import type Stripe from "stripe";
import { handleAsyncPaymentFailed, handleCheckoutCompleted } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Webhook Stripe : enregistre la commande (ou le paiement du solde) et prévient Aurore.
// À déclarer dans le Dashboard Stripe : https://<domaine>/api/stripe/webhook
// (événements checkout.session.completed, checkout.session.async_payment_succeeded et
// checkout.session.async_payment_failed), puis renseigner STRIPE_WEBHOOK_SECRET.
// Les moyens de paiement (carte, PayPal…) sont gérés par Stripe : aucun n'est imposé ici.
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return new Response("Stripe non configuré", { status: 501 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      secret,
    );
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    try {
      if (event.type === "checkout.session.async_payment_failed") await handleAsyncPaymentFailed(event.data.object);
      else await handleCheckoutCompleted(event.data.object);
    } catch (e) {
      console.error(e);
      // 500 : Stripe renverra l'événement plus tard.
      return new Response("Erreur d'enregistrement", { status: 500 });
    }
  }

  return Response.json({ received: true });
}
