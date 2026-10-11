import assert from "node:assert/strict";
import { test } from "node:test";
import { cancellationRefunds } from "./cancellation-refunds";

function stripeMock(refunded = 0, status = "succeeded") {
  const calls: { payment: string; key: string }[] = [];
  const stripe = {
    paymentIntents: { retrieve: async () => ({ latest_charge: { amount: 27000, amount_refunded: refunded } }) },
    refunds: {
      create: async (params: { payment_intent: string }, options: { idempotencyKey: string }) => {
        calls.push({ payment: params.payment_intent, key: options.idempotencyKey });
        return { status };
      },
      list: async () => ({ data: [{ id: "re_test", amount: 27000, created: 1700000000, status }] }),
    },
  } as unknown as Parameters<typeof cancellationRefunds>[0];
  return { stripe, calls };
}

test("annulation : remboursement Stripe et clé stable, sans doubler un paiement", async () => {
  const { stripe, calls } = stripeMock();
  const order = { id: "order_test", paymentIntentId: "pi_test", balancePaymentIntentId: "pi_test" };
  const result = await cancellationRefunds(stripe, order);
  assert.deepEqual(calls, [{ payment: "pi_test", key: "cancel-order-order_test-pi_test" }]);
  assert.equal(result.refunds?.[0].amount, 27000);
  await cancellationRefunds(stripe, order);
  assert.equal(calls[0].key, calls[1].key);
});

test("annulation : aucun nouveau remboursement si Stripe indique déjà un remboursement intégral", async () => {
  const { stripe, calls } = stripeMock(27000);
  const result = await cancellationRefunds(stripe, { id: "order", paymentIntentId: "pi_test" });
  assert.equal(calls.length, 0);
  assert.equal(result.refunds?.length, 1);
});

test("annulation : différencie les remboursements en attente et refuse les échecs", async () => {
  assert.equal((await cancellationRefunds(stripeMock(0, "pending").stripe, { id: "order", paymentIntentId: "pi_test" })).pending, true);
  await assert.rejects(cancellationRefunds(stripeMock(0, "failed").stripe, { id: "order", paymentIntentId: "pi_test" }), /Refund not accepted/);
  await assert.rejects(cancellationRefunds(stripeMock().stripe, { id: "order" }), /Missing payment/);
});
