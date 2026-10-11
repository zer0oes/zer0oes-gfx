import assert from "node:assert/strict";
import { test } from "node:test";
import { canCancelOrder, cancellationStarted } from "./order-cancellation";
import type { OrderStatus } from "./store/types";

test("l’annulation est possible après le brief mais avant la création", () => {
  const order = { status: "brief_recu" as OrderStatus, demo: false, amountPaid: 27000, paymentIntentId: "pi_test" };
  for (const status of ["payee", "brief_attente", "brief_recu"] as OrderStatus[]) assert.equal(canCancelOrder({ ...order, status }, []), true);
  for (const status of ["en_cours", "livree", "solde_paye", "terminee", "annulee", "annulation_en_cours"] as OrderStatus[]) assert.equal(canCancelOrder({ ...order, status }, []), false);
  assert.equal(canCancelOrder(order, [{ publishedAt: "2026-10-10" }]), false);
  assert.equal(canCancelOrder({ ...order, deliveredAt: "2026-10-10" }, []), false);
  assert.equal(canCancelOrder({ ...order, demo: true }, []), false);
  assert.equal(canCancelOrder({ ...order, amountPaid: 0 }, []), false);
  assert.equal(canCancelOrder({ ...order, paymentIntentId: undefined }, []), false);
  assert.equal(cancellationStarted({ status: "annulation_en_cours" }), true);
  assert.equal(cancellationStarted({ status: "annulee" }), true);
});
