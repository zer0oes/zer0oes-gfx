import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { realInvoicingEnabled } from "./orders";

const saved = { ...process.env };
afterEach(() => {
  for (const k of ["ABBY_API_KEY", "STRIPE_SECRET_KEY", "ABBY_IN_TEST_MODE"]) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test("aucune facture Abby réelle pour une démo ou en mode test Stripe", () => {
  process.env.ABBY_API_KEY = "cle-factice";
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  delete process.env.ABBY_IN_TEST_MODE;
  assert.equal(realInvoicingEnabled({ demo: false }), false);
  process.env.STRIPE_SECRET_KEY = "sk_live_x";
  assert.equal(realInvoicingEnabled({ demo: false }), true);
  assert.equal(realInvoicingEnabled({ demo: true }), false);
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal(realInvoicingEnabled({ demo: false }), false);
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.ABBY_IN_TEST_MODE = "1";
  assert.equal(realInvoicingEnabled({ demo: false }), true);
  delete process.env.ABBY_API_KEY;
  assert.equal(realInvoicingEnabled({ demo: false }), false);
});
