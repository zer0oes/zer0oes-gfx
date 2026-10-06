import assert from "node:assert/strict";
import { test } from "node:test";
import { href, preferredLocale, splitLocale } from "./i18n";

test("adresses selon la langue", () => {
  assert.equal(href("fr", "/offres"), "/offres");
  assert.equal(href("en", "/offres"), "/en/offres");
  assert.equal(href("en", "/"), "/en");
  assert.deepEqual(splitLocale("/en/portfolio/x"), { locale: "en", path: "/portfolio/x" });
  assert.deepEqual(splitLocale("/en"), { locale: "en", path: "/" });
  assert.deepEqual(splitLocale("/offres"), { locale: "fr", path: "/offres" });
  assert.deepEqual(splitLocale("/entreprise"), { locale: "fr", path: "/entreprise" });
});

test("langue préférée du navigateur", () => {
  assert.equal(preferredLocale("fr-FR,fr;q=0.9,en;q=0.8"), "fr");
  assert.equal(preferredLocale("en-US,en;q=0.9,fr;q=0.8"), "en");
  assert.equal(preferredLocale("de-DE,de;q=0.9"), "en");
  assert.equal(preferredLocale("en;q=0.5,fr;q=0.9"), "fr");
  assert.equal(preferredLocale(""), "fr");
  assert.equal(preferredLocale(null), "fr");
});
