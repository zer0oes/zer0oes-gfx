import assert from "node:assert/strict";
import { test } from "node:test";
import { completionPatch, filesExpired, orderSteps, statusMessage } from "./portal";

const order = (o: Partial<Parameters<typeof orderSteps>[0]> = {}) => ({ status: "payee" as const, totalPrice: 99000, amountPaid: 29700, ...o });
const states = (s: ReturnType<typeof orderSteps>) => s.map((x) => x.state[0]).join("");

test("étapes : du brief à la livraison", () => {
  assert.equal(states(orderSteps(order(), [])), "eaaaa"); // e = en cours, a = à venir, f = fait
  assert.equal(states(orderSteps(order({ status: "brief_recu" }), [])), "feaaa");
  assert.equal(states(orderSteps(order({ status: "en_cours" }), [{}, {}])), "ffeaa");
  assert.equal(states(orderSteps(order({ status: "livree" }), [{ approvedAt: "x" }, { approvedAt: "x" }])), "fffea");
  const paid = orderSteps(order({ status: "livree", amountPaid: 99000 }), [{ approvedAt: "x" }]);
  assert.equal(states(paid), "fffff");
  assert.match(statusMessage(orderSteps(order(), [])), /brief/);
  assert.match(statusMessage(paid), /terminé/);
});

test("conservation des fichiers : 6 mois après la clôture", () => {
  const done = { completedAt: "2026-01-01T00:00:00Z" };
  assert.equal(filesExpired({}), false);
  assert.equal(filesExpired(done, new Date("2026-06-30T00:00:00Z")), false);
  assert.equal(filesExpired(done, new Date("2026-07-02T00:00:00Z")), true);
});

test("date de clôture posée et retirée selon le statut", () => {
  assert.ok(completionPatch({ status: "livree" }, "terminee").completedAt);
  assert.deepEqual(completionPatch({ status: "terminee", completedAt: "x" }, "terminee"), {});
  assert.deepEqual(completionPatch({ status: "terminee", completedAt: "x" }, "livree"), { completedAt: null });
  assert.deepEqual(completionPatch({ status: "payee" }, "en_cours"), {});
});
