import assert from "node:assert/strict";
import { test } from "node:test";
import { homeDefaults, homeFromForm, homeSections, resolveHome } from "./home-content";

test("chaque champ de l'admin a une valeur d'origine", () => {
  for (const f of homeSections.flatMap((s) => s.fields)) assert.ok(f.key in homeDefaults, f.key);
});

test("seules les valeurs modifiées sont enregistrées", () => {
  const saved = homeFromForm((k) => (k === "hero.title1" ? "  Ton live. " : k === "hero.text" ? "" : k === "universe.work" ? "-" : homeDefaults[k]));
  assert.deepEqual(saved, { "hero.title1": "Ton live.", "universe.work": "-" });
});

test("contenu enregistré par-dessus l'origine, valeurs inconnues ou invalides ignorées", () => {
  const c = resolveHome({ "hero.title1": "Ton live.", "emotes.title": "A\n\nB\nC\nD", inconnu: "x", "hero.text": 42 });
  assert.equal(c.text("hero.title1"), "Ton live.");
  assert.deepEqual(c.lines("emotes.title"), ["A", "B", "C"]);
  assert.equal(c.text("hero.text"), homeDefaults["hero.text"]);
  assert.equal(c.text("inconnu"), "");
  assert.equal(resolveHome(null).text("custom.button"), "Demander un devis");
});
