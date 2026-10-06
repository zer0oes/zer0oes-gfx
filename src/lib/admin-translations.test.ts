import assert from "node:assert/strict";
import { test } from "node:test";
import { translationsFromForm, withTranslations } from "./admin-translations";
import { trDeep } from "./translations-en";
import { homeFromForm, resetGroup, resolveHome } from "./home-content";
import { optionChoices } from "./pricing";

test("sauvegarder une traduction conserve le français et les autres sections, vider la supprime", () => {
  const stored = { "hero.title1": "Mon live", "en:hero.title1": "My live", "translation:work:one:title": "Work" };
  const form = new FormData();
  form.set("en:name", "  My package\r\n ");
  form.set("en:untrusted", "ignored");
  const mapping = { name: "translation:pack:one:name" };
  const saved = translationsFromForm(stored, form, mapping);
  assert.deepEqual(saved, { ...stored, "translation:pack:one:name": "My package" });
  form.set("en:name", " ");
  assert.deepEqual(translationsFromForm(saved, form, mapping), stored);
  assert.deepEqual(translationsFromForm(saved, new FormData(), mapping), saved);
});

test("les traductions restent liées aux champs et aux identifiants, sans modifier les prix ou le français", () => {
  const raw = { "translation:pack:one:name": "Custom package", "translation:pack:one:deliverables": "First\nSecond" };
  const original = { id: "one", name: "Premier look", price: 49000, deliverables: ["Logo"] };
  const decorated = withTranslations(original, raw, "pack:one", ["name", "deliverables"]);
  assert.equal(trDeep("fr", decorated).name, "Premier look");
  assert.deepEqual(trDeep("en", decorated), { ...original, name: "Custom package", deliverables: ["First", "Second"] });
  assert.equal(trDeep("en", withTranslations(original, raw, "pack:two", ["name"])).name, "First Look");
  assert.equal(original.name, "Premier look");
  const renamed = withTranslations({ ...original, name: "Nouveau nom" }, raw, "pack:one", ["name"]);
  assert.equal(trDeep("en", renamed).name, "Custom package");
});

test("les formules se traduisent indépendamment et leurs identifiants sont conservés", () => {
  const formula = withTranslations({ id: "base", label: "Premier look", price: 49000 }, { "translation:pack:one:formula:base:label": "My formula" }, "pack:one:formula:base", ["label"]);
  assert.deepEqual(trDeep("en", { formulas: [formula] }), { formulas: [{ id: "base", label: "My formula", price: 49000 }] });
});

test("une liste anglaise reste une liste même si le champ français facultatif est absent", () => {
  const translated = withTranslations({ name: "Pack", extras: undefined }, { "translation:pack:one:extras": "One\nTwo" }, "pack:one", ["extras"], ["extras"]);
  assert.deepEqual(trDeep("en", translated).extras, ["One", "Two"]);
});

test("les sauvegardes et réinitialisations de l'accueil préservent les traductions des autres sections", () => {
  const stored = { "en:hero.title1": "Custom hero", "en:portfolio.title": "Projects", "translation:pack:one:name": "Package" };
  const saved = homeFromForm((key) => key === "hero.title1" ? "Mon live" : undefined, stored);
  assert.equal(resolveHome(saved, "en").text("hero.title1"), "Custom hero");
  assert.deepEqual(resetGroup(saved, "accueil"), { "en:portfolio.title": "Projects", "translation:pack:one:name": "Package" });
});

test("les options traduisent leur nom et unité tout en conservant le libellé français envoyé", () => {
  const option = withTranslations({ id: "one", name: "Mon option", unit: "visuel", price: 1000 }, { "translation:option:one:name": "My add-on", "translation:option:one:unit": "visual" }, "option:one", ["name", "unit"]);
  const [choice] = optionChoices([option], "en");
  assert.equal(choice.main, "My add-on");
  assert.match(choice.price!, /visual/);
  assert.match(choice.label, /Mon option/);
});
