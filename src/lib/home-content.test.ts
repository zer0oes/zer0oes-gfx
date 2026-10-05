import assert from "node:assert/strict";
import { test } from "node:test";
import { homeDefaults, homeFromForm, homeSections, resetGroup, resolveHome } from "./home-content";

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

test("page Portfolio : textes enregistrés avec l'accueil, sans s'écraser", () => {
  const stored = { "hero.title1": "Mon stream.", "portfolio.title": "Ancien titre" };
  // Formulaire Portfolio : l'accueil personnalisé est conservé
  const fromPortfolio = homeFromForm((k) => ({ "portfolio.title": "Nouveaux univers", "portfolio.link": "" })[k], stored, "portfolio");
  assert.equal(fromPortfolio["hero.title1"], "Mon stream.");
  assert.equal(fromPortfolio["portfolio.title"], "Nouveaux univers");
  assert.equal("portfolio.link" in fromPortfolio, false); // vidé : texte d'origine
  // Formulaire Accueil : les textes Portfolio sont conservés
  const fromHome = homeFromForm((k) => (k === "hero.title1" ? "Ton stream." : undefined), fromPortfolio, "accueil");
  assert.equal(fromHome["portfolio.title"], "Nouveaux univers");
  assert.equal("hero.title1" in fromHome, false);
  assert.equal(resolveHome(fromHome).text("portfolio.link"), "Explorer l’univers →");
  // Retour à l'origine d'une page seulement
  assert.deepEqual(resetGroup(fromHome, "accueil"), { "portfolio.title": "Nouveaux univers" });
  assert.equal(resetGroup({ "hero.title1": "X" }, "accueil"), null);
});
