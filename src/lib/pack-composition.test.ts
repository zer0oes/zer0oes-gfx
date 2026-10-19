import { test } from "node:test";
import assert from "node:assert/strict";
import { compositionFromForm, compositionKey, compositionLine, compositionValue, readComposition, savingPercent, writeComposition } from "./pack-composition";
import type { Option } from "./pricing";

const options: Option[] = [
  { id: "overlay", name: "Overlay animé (unité)", price: 12000 },
  { id: "emotes-5", name: "Pack de 5 emotes", price: 15000, normalPrice: 20000 },
  { id: "logo", name: "Logo", price: 25000, priceFrom: true },
];

test("composition : relue, nettoyée et supprimée du contenu quand elle est vide", () => {
  const saved = writeComposition({ autre: "x" }, "premier-look", { base: [{ option: "overlay", qty: 3 }, { option: "", qty: 2 }], vide: [] });
  assert.deepEqual(JSON.parse(saved[compositionKey("premier-look")]), { base: [{ option: "overlay", qty: 3 }] });
  assert.deepEqual(readComposition(saved, "premier-look"), { base: [{ option: "overlay", qty: 3 }] });
  assert.equal(saved.autre, "x");
  assert.equal(compositionKey("premier-look") in writeComposition(saved, "premier-look", {}), false);
  assert.deepEqual(readComposition({ [compositionKey("x")]: "pas du json" }, "x"), {});
});

test("composition du formulaire : seules les formules et produits existants, quantités bornées", () => {
  const json = JSON.stringify({ base: [{ option: "overlay", qty: 500 }, { option: "inconnu", qty: 1 }, { option: "logo", qty: 0 }], ancienne: [{ option: "logo", qty: 1 }] });
  assert.deepEqual(compositionFromForm(json, ["base"], options), { base: [{ option: "overlay", qty: 99 }] });
  assert.deepEqual(compositionFromForm("{", ["base"], options), {});
});

test("valeur à la carte : prix habituels × quantités, « à partir de » si un produit l'est", () => {
  assert.deepEqual(compositionValue([{ option: "overlay", qty: 3 }, { option: "emotes-5", qty: 1 }], options), { total: 56000, priceFrom: false, missing: [] });
  const withLogo = compositionValue([{ option: "logo", qty: 1 }, { option: "supprime", qty: 1 }], options);
  assert.equal(withLogo.priceFrom, true);
  assert.deepEqual(withLogo.missing, ["supprime"]);
  assert.equal(savingPercent(39000, 56000), 30);
  assert.equal(savingPercent(60000, 56000), -7);
  assert.equal(savingPercent(1000, 0), 0);
});

test("ligne de livrable : quantité devant le nom au-delà de 1, sans « (unité) »", () => {
  assert.equal(compositionLine({ option: "overlay", qty: 3 }, options[0]), "3 × Overlay animé");
  assert.equal(compositionLine({ option: "x", qty: 1 }, { name: "Widget (barre, tchat)" }), "Widget (barre, tchat)");
  assert.equal(compositionLine({ option: "logo", qty: 1 }, options[2]), "Logo");
});
