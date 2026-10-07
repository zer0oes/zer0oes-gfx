import assert from "node:assert/strict";
import { test } from "node:test";
import { productBriefFields } from "./product-brief";

test("le brief couvre chaque produit du snapshot de commande", () => {
  const lines = ["Overlay animé × 2", "Emote statique"];
  const values: Record<string, string> = { productBrief_0: " Démarrage et pause ", productBrief_1: "Sourire", productBrief_2: "Produit non acheté" };
  assert.deepEqual(productBriefFields(lines, (key) => values[key] ?? ""), { "Création 1 : Overlay animé × 2": "Démarrage et pause", "Création 2 : Emote statique": "Sourire" });
  assert.equal(productBriefFields(lines, (key) => key === "productBrief_0" ? "Test" : " "), null);
});
