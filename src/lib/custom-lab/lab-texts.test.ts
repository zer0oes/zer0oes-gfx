import assert from "node:assert/strict";
import { test } from "node:test";
import { LAB_TEXT_DEFAULTS, resolveLabTexts } from "./lab-texts";

test("textes du Laboratoire : texte enregistré, sinon texte d'origine", () => {
  assert.deepEqual(resolveLabTexts(null), LAB_TEXT_DEFAULTS);
  const texts = resolveLabTexts({ "laboratoire.streamlabs.lien": "Ouvrir Streamlabs", "laboratoire.streamlabs.note": "  ", autre: "x" });
  assert.equal(texts["laboratoire.streamlabs.lien"], "Ouvrir Streamlabs");
  assert.equal(texts["laboratoire.streamlabs.note"], LAB_TEXT_DEFAULTS["laboratoire.streamlabs.note"]);
  assert.match(LAB_TEXT_DEFAULTS["laboratoire.streamlabs.note"], /Widget Themes > Create Widget Theme > Use/);
});
