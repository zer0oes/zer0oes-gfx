import test from "node:test";
import assert from "node:assert/strict";
import { reviewedRevisions } from "./brief-review";

test("chaque modification garde son état et ses dates, sans masquer une nouvelle alerte", () => {
  const first = { at: "first", changes: { Couleurs: { before: "bleu", after: "violet" } } };
  assert.throws(() => reviewedRevisions([first], "first", "acknowledged", "t1"));
  const read = reviewedRevisions([first], "first", "consulted", "t1");
  assert.equal(read[0].consultedAt, "t1");
  const acknowledged = reviewedRevisions(read, "first", "acknowledged", "t2");
  assert.equal(acknowledged[0].acknowledgedAt, "t2");
  const next = [...acknowledged, { at: "second", changes: {} }];
  const again = reviewedRevisions(next, "first", "consulted", "t3");
  assert.equal(again[0].consultedAt, "t1");
  assert.equal(again[0].acknowledgedAt, "t2");
  assert.equal(again[1].consultedAt, undefined);
});
