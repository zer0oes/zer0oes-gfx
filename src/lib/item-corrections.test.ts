import test from "node:test";
import assert from "node:assert/strict";
import { itemRevisionLimit } from "./delivery";

test("les limites de correction dépendent du pack et pas des modifications du brief", () => {
  assert.equal(itemRevisionLimit({ packId: "premier-look" }), 2);
  assert.equal(itemRevisionLimit({ packId: "identite-signature" }), 2);
  assert.equal(itemRevisionLimit({ packId: "univers-complet" }), 3);
});
