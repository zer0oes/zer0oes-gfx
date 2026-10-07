import test from "node:test";
import assert from "node:assert/strict";
import { correctionPending } from "./delivery";

test("une correction reste en attente jusqu'à publication d'un nouvel aperçu", () => {
  const item = { publishedAt: "2026-10-07T10:00:00Z", clientNotes: [{ at: "2026-10-07T11:00:00Z" }] };
  assert.equal(correctionPending(item), true);
  assert.equal(correctionPending({ ...item, publishedAt: undefined, previewVersions: [{ publishedAt: item.publishedAt }] }), true);
  assert.equal(correctionPending({ ...item, publishedAt: "2026-10-07T12:00:00Z" }), false);
  assert.equal(correctionPending({}), false);
});
