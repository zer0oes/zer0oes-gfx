import type Stripe from "stripe";
import type { Order } from "./store/types";
import { mergeRefunds } from "./refunds";

export async function cancellationRefunds(stripe: Pick<Stripe, "paymentIntents" | "refunds">, order: Pick<Order, "id" | "paymentIntentId" | "balancePaymentIntentId" | "refunds">) {
  const payments = [...new Set([order.paymentIntentId, order.balancePaymentIntentId].filter((id): id is string => Boolean(id)))];
  if (!payments.length) throw new Error("Missing payment");
  let refunds = order.refunds;
  let pending = false;
  for (const payment of payments) {
    const intent = await stripe.paymentIntents.retrieve(payment, { expand: ["latest_charge"] });
    const charge = intent.latest_charge;
    if (!charge || typeof charge === "string") throw new Error("Missing charge");
    if (charge.amount > charge.amount_refunded) {
      const refund = await stripe.refunds.create({ payment_intent: payment, reason: "requested_by_customer", metadata: { orderId: order.id } }, { idempotencyKey: `cancel-order-${order.id}-${payment}` });
      if (refund.status !== "succeeded" && refund.status !== "pending") throw new Error("Refund not accepted");
      pending ||= refund.status === "pending";
    }
    const list = await stripe.refunds.list({ payment_intent: payment, limit: 100 });
    const accepted = list.data.filter((refund) => refund.status === "succeeded" || refund.status === "pending");
    if (accepted.reduce((total, refund) => total + refund.amount, 0) < charge.amount) throw new Error("Refund reconciliation incomplete");
    pending ||= accepted.some((refund) => refund.status === "pending");
    refunds = mergeRefunds(refunds, payment, accepted.map((refund) => ({ id: refund.id, amount: refund.amount, at: new Date(refund.created * 1000).toISOString() })));
  }
  return { refunds, pending };
}
