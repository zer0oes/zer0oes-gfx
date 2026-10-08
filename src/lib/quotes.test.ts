import assert from "node:assert/strict";
import { test } from "node:test";
import { quoteEditable, quoteExpired, validQuoteProposal, type ProjectQuote } from "./quotes";

test("la proposition reste modifiable avant envoi, puis se verrouille à l’envoi ou à l’acceptation", () => {
  const q = { status: "propose" } as ProjectQuote;
  assert.equal(quoteEditable(q), true);
  assert.equal(quoteEditable({ ...q, sentAt: "2026-10-08T12:00:00Z" }), false);
  assert.equal(quoteEditable({ ...q, sendingAt: "2026-10-08T12:00:00Z" }), false);
  assert.equal(quoteEditable({ ...q, status: "accepte" }), false);
  assert.equal(quoteEditable({ ...q, status: "refuse" }), false);
  assert.equal(quoteEditable({ ...q, orderId: "commande" }), false);
});
import { plannedDelivery } from "./delivery-plan";

test("les livrables sur mesure conservent chaque ligne, même sans sélection d’overlays", () => {
  const lines = ["3 overlays animés", "Logo", "Bannière et avatar", "2 emotes"];
  const items = plannedDelivery({ packId: "sur-mesure", formulaId: "base", hasLogo: false, brief: {}, deliveryTemplate: lines });
  assert.deepEqual(items.map((item) => item.label), lines);
  assert.equal(new Set(items.map((item) => item.key)).size, lines.length);
});

test("une proposition exige un prix en centimes, des livrables et une validité", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  const q = { title: "Projet", description: "Détail", deliverables: ["Logo"], totalPrice: 50000, validUntil: "2026-10-08" };
  assert.equal(validQuoteProposal(q, now), true);
  for (const patch of [{ totalPrice: NaN }, { totalPrice: 49 }, { totalPrice: 500.5 }, { deliverables: [] }, { validUntil: "2026-10-07" }, { title: " " }]) {
    assert.equal(validQuoteProposal({ ...q, ...patch }, now), false);
  }
  assert.equal(quoteExpired(q, now), false);
  assert.equal(quoteExpired(q, new Date("2026-10-09T00:00:00Z")), true);
});
