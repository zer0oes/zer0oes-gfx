import assert from "node:assert/strict";
import { test } from "node:test";
import { portfolioCategoryColor } from "./product-categories";

test("portfolio : couleur de la catégorie de même nom, sinon de celle où la création serait rangée", () => {
  const list = [{ id: "overlays", name: "Overlays", color: "#111111" }, { id: "branding", name: "Identité visuelle", color: "#222222" }, { id: "a1", name: "Alertes", color: "#333333" }];
  assert.equal(portfolioCategoryColor(list, "overlays", "Overlays"), "#111111");
  assert.equal(portfolioCategoryColor(list, "alertes", "Alertes"), "#333333");
  assert.equal(portfolioCategoryColor(list, "logo", "Logo"), "#222222");
  assert.equal(portfolioCategoryColor(list, "widgets", "Widgets"), "#111111");
});
