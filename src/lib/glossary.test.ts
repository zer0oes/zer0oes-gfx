import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveHome } from "./home-content";
import { glossaryFor } from "./glossary";

const texts = resolveHome(null, "fr");
test("bulles : textes modifiables, widgets distingués", () => {
  assert.equal(glossaryFor("Widget interactif avancé (sur devis)", texts)?.id, "widgetAvance");
  assert.equal(glossaryFor("Advanced interactive widget", resolveHome(null, "en"))?.id, "widgetAvance");
  assert.equal(glossaryFor("Widget personnalisé (barre d’objectifs, tchat, sponsor, partenariats)", texts)?.id, "widget");
  assert.equal(glossaryFor("5 overlays", resolveHome({ "glossary.overlay.text": "Mon texte" }, "fr"))?.text, "Mon texte");
});
