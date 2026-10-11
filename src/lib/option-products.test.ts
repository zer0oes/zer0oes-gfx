import assert from "node:assert/strict";
import { test } from "node:test";
import { options } from "@/data/packs";
import { emoteCount, optionIncludes, optionProducts, productBriefHint } from "./option-products";

test("chaque option apparaît dans une seule carte, avec ses variantes disponibles", () => {
  const products = optionProducts(options);
  assert.equal(products.length, options.length - 9);
  const ids = products.flatMap((p) => p.variants.map((v) => v.id));
  assert.deepEqual([...ids].sort(), options.map((o) => o.id).sort());
  assert.equal(new Set(ids).size, options.length);
  const emotes = products.filter((p) => p.category === "emotes");
  assert.equal(emotes.length, 1);
  assert.deepEqual(emotes[0].variants.map((v) => [emoteCount(v), /anim/i.test(v.id)]).sort((a, b) => Number(a[0]) - Number(b[0]) || Number(a[1]) - Number(b[1])), [[1, false], [1, true], [3, false], [3, true], [5, false], [5, true], [10, false], [10, true]]);
});

test("les créations admin et les variantes isolées restent visibles", () => {
  const products = optionProducts([{ id: "custom", name: "Création spéciale", price: 10000 }, options[1]]);
  assert.deepEqual(products.map((p) => p.id), ["custom", "overlay-anime-unite"]);
});

test("les contenus précisent le nombre d'emotes et les besoins du brief", () => {
  assert.match(optionIncludes(options.find((o) => o.id === "emotes-animees-5")!, "fr"), /5 emotes.*animées/);
  assert.match(productBriefHint("Overlay statique × 3", "fr"), /Tu en as commandé 3 : détaille chacune/);
  assert.match(optionIncludes(options.find((o) => o.id === "alertes-fixes")!, "fr"), /5 alertes.*follow, sub, raid, cheer et tips/);
});
