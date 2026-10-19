import test from "node:test";
import assert from "node:assert/strict";
import { itemRevisionLimit } from "./delivery";

test("les limites de correction dépendent du pack et pas des modifications du brief", () => {
  assert.equal(itemRevisionLimit({ packId: "premier-look" }), 2);
  assert.equal(itemRevisionLimit({ packId: "identite-signature" }), 2);
  assert.equal(itemRevisionLimit({ packId: "univers-complet" }), 3);
  assert.equal(itemRevisionLimit({ packId: "options" }), 1);
  assert.equal(itemRevisionLimit({ packId: "option:overlay-fixe-unite" }), 1);
});

test("un pack suit le nombre de corrections réglé dans l'admin, pas les options ni le sur-mesure", () => {
  assert.equal(itemRevisionLimit({ packId: "premier-look" }, 4), 4);
  assert.equal(itemRevisionLimit({ packId: "univers-complet" }, 0), 0);
  assert.equal(itemRevisionLimit({ packId: "option:overlay-fixe-unite" }, 4), 1);
  assert.equal(itemRevisionLimit({ packId: "sur-mesure" }, 4), 2);
});
