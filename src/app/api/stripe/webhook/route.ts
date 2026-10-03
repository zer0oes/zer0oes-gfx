import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { formatPrice, formulaName, getFormula, getPack, parsePaymentType, paymentLabel } from "@/data/packs";
import { notify } from "@/lib/notify";

// Webhook Stripe : prévient Aurore à chaque paiement confirmé.
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
    const s = event.data.object;
    const pack = getPack(s.metadata?.packId);
    const total = Number(s.metadata?.totalPrice);
    const payment = parsePaymentType(s.metadata?.paymentType);
    const offer = pack ? formulaName(pack, getFormula(pack, s.metadata?.formulaId)) : s.metadata?.packId ?? "?";
    await notify({
      subject: `[Commande] ${offer}${payment === "acompte" ? " — ACOMPTE" : ""} — ${s.customer_details?.email ?? ""}`,
      replyTo: s.customer_details?.email ?? undefined,
      fields: {
        Offre: offer,
        Paiement: total ? paymentLabel(total, payment) : payment,
        "Montant encaissé": s.amount_total != null ? formatPrice(s.amount_total) : "?",
        Client: s.customer_details?.name ?? "",
        "E-mail": s.customer_details?.email ?? "",
        Session: s.id,
      },
    });
  }

  return Response.json({ received: true });
}
