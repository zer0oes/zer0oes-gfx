import assert from "node:assert/strict";
import { test } from "node:test";
import { completionPatch, filesExpireAt, filesExpired, orderSteps, statusMessage } from "./portal";

const order = (o: Partial<Parameters<typeof orderSteps>[0]> = {}) => ({ status: "payee" as const, totalPrice: 99000, amountPaid: 29700, ...o });
const states = (s: ReturnType<typeof orderSteps>) => s.map((x) => x.state[0]).join("");

test("étapes : du brief à la livraison", () => {
  assert.equal(states(orderSteps(order(), [])), "eaaaa"); // e = en cours, a = à venir, f = fait
  assert.equal(states(orderSteps(order({ status: "brief_recu" }), [])), "faaaa");
  assert.equal(states(orderSteps(order({ status: "en_cours" }), [{}, {}])), "feeaa");
  assert.equal(states(orderSteps(order({ status: "livree" }), [{ approvedAt: "x" }, { approvedAt: "x" }])), "fffea");
  const ready = orderSteps(order({ status: "livree", amountPaid: 99000 }), [{ approvedAt: "x", storagePath: "o/avatar.png" }]);
  assert.equal(ready.at(-1)?.state, "en_cours");
  const paid = orderSteps(order({ status: "livree", amountPaid: 99000 }), [{ approvedAt: "x", storagePath: "o/avatar.png", accessedFinalAssets: ["o/avatar.png"] }]);
  assert.equal(states(paid), "fffff");
  assert.match(statusMessage(orderSteps(order(), [])), /brief/);
  assert.match(statusMessage(paid), /Livraison validée/);
  assert.match(statusMessage(paid, "fr", true), /terminé/);
  assert.match(statusMessage(paid, "en"), /Delivery approved/);
  assert.match(statusMessage(paid, "en", true), /Project complete/);
});

test("le brief est à compléter avant réception et le paiement intégral n’a pas d’étape solde", () => {
  const initial = orderSteps(order({ paymentType: "total", amountPaid: 99000 }), []);
  assert.equal(initial[0].label, "Brief à compléter");
  assert.deepEqual(initial.map((step) => step.id), ["brief", "creation", "validation", "livraison"]);
  assert.equal(states(initial), "eaaa");
  const received = orderSteps(order({ paymentType: "total", amountPaid: 99000, briefReceivedAt: "2026-10-07" }), []);
  assert.equal(received[0].label, "Brief reçu");
  assert.equal(states(received), "faaa");
  assert.equal(orderSteps(order({ paymentType: "total" }), [], "en")[0].label, "Complete your brief");
  assert.ok(orderSteps(order({ paymentType: "acompte", amountPaid: 99000 }), []).some((step) => step.id === "solde"));
});

test("la création suit le statut admin, indépendamment du brief et des aperçus", () => {
  const creation = (status: Parameters<typeof orderSteps>[0]["status"]) => orderSteps(order({ status, briefReceivedAt: "2026-10-07" }), [{}]).find((step) => step.id === "creation")?.state;
  assert.equal(creation("brief_recu"), "a_venir");
  assert.equal(creation("en_cours"), "en_cours");
  assert.equal(creation("livree"), "fait");
  assert.equal(creation("terminee"), "fait");
  assert.match(statusMessage(orderSteps(order({ status: "brief_recu" }), [])), /en attente/);
});

test("des emplacements sans aperçu publié ne déclenchent pas la validation", () => {
  const item = { plannedKey: "avatar" };
  assert.equal(orderSteps(order({ status: "en_cours" }), [item]).find((step) => step.id === "validation")?.state, "a_venir");
  assert.equal(orderSteps(order({ status: "en_cours" }), [{ ...item, publishedAt: "now" }]).find((step) => step.id === "validation")?.state, "en_cours");
});

test("conservation des fichiers : 6 mois après la clôture", () => {
  const done = { completedAt: "2026-01-01T00:00:00Z" };
  assert.equal(filesExpired({}), false);
  assert.equal(filesExpired(done, new Date("2026-06-30T00:00:00Z")), false);
  assert.equal(filesExpired(done, new Date("2026-07-02T00:00:00Z")), true);
  assert.equal(filesExpired(done, new Date("2026-07-01T00:00:00Z")), true);
  assert.equal(filesExpireAt({ completedAt: "2026-08-31T12:00:00Z" })?.toISOString(), "2027-02-28T12:00:00.000Z");
});

test("la première date de clôture est conservée même après réouverture", () => {
  assert.ok(completionPatch({ status: "livree" }, "terminee").completedAt);
  assert.deepEqual(completionPatch({ status: "terminee", completedAt: "x" }, "terminee"), {});
  assert.deepEqual(completionPatch({ status: "terminee", completedAt: "x" }, "livree"), {});
  assert.deepEqual(completionPatch({ status: "payee" }, "en_cours"), {});
});
