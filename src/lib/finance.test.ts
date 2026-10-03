import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFinance, netBreakdown, stripeFee } from "./finance";

test("Premier look 490 € payé en une fois", () => {
  const r = netBreakdown([49000], defaultFinance);
  assert.equal(r.fees, 760); // 1,5 % de 490 € = 7,35 € + 0,25 €
  assert.equal(r.urssaf, 12544); // 25,6 %
  assert.equal(r.cfp, 98); // 0,2 %
  assert.equal(r.vl, 0);
  assert.equal(r.net, 49000 - 760 - 12544 - 98);
});

test("acompte + solde : deux frais fixes", () => {
  const once = netBreakdown([99000], defaultFinance);
  const twice = netBreakdown([29700, 69300], defaultFinance);
  assert.equal(twice.gross, once.gross);
  assert.equal(twice.transactions, 2);
  // Un frais fixe de plus (à 1 centime près : arrondi de chaque paiement)
  assert.ok(Math.abs(twice.fees - once.fees - defaultFinance.stripeFixed) <= 1);
  assert.ok(Math.abs(once.net - twice.net - defaultFinance.stripeFixed) <= 1);
});

test("versement libératoire et frais réels", () => {
  const f = { ...defaultFinance, vlEnabled: true };
  const r = netBreakdown([100000], f, 1234);
  assert.equal(r.vl, 2200);
  assert.equal(r.fees, 1234);
  assert.equal(r.net, 100000 - 1234 - 25600 - 200 - 2200);
});

test("cas limites", () => {
  assert.equal(stripeFee(0, defaultFinance), 0);
  assert.deepEqual(netBreakdown([], defaultFinance).net, 0);
});
