import type Stripe from "stripe";
import { handleCheckoutCompleted } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

// Webhook Stripe : enregistre la commande (ou le paiement du solde) et prévient Aurore.
// À déclarer dans le Dashboard Stripe : https://<domaine>/api/stripe/webhook
// (événement checkout.session.completed), puis renseigner STRIPE_WEBHOOK_SECRET.
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

  if (event.type === "checkout.session.completed") {
    try {
      await handleCheckoutCompleted(event.data.object);
    } catch (e) {
      console.error(e);
      // 500 : Stripe renverra l'événement plus tard.
      return new Response("Erreur d'enregistrement", { status: 500 });
    }
  }

  return Response.json({ received: true });
}
