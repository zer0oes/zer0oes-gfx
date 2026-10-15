import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { headlineParts, parseCarouselSlides, remainingPlacesText, slideHref } from "./announcement-carousel";
const seed = () => JSON.parse(fs.readFileSync("supabase/migrations/20261016000200_announcement_carousel.sql", "utf8").split("$slides$")[1]);
test("diapos : édition bilingue, ordre et activation conservés, pourcentages mis en valeur", () => {
  const input = seed().reverse();
  input[0].enabled = false;
  input[0].content.en.buttonLabel = "Review my channel";
  const slides = parseCarouselSlides(input);
  assert.equal(slides[0].id, "audit");
  assert.equal(slides[0].enabled, false);
  assert.equal(slides[0].content.en.buttonLabel, "Review my channel");
  assert.deepEqual(headlineParts(slides[1].content.fr.title).filter((p) => p.highlight).map((p) => p.text), ["−50 %", "−25 %"]);
});
test("aucun compteur fabriqué, aucun lien dangereux, aucune mention HT", () => {
  assert.equal(remainingPlacesText("Plus que {count} places", null), "");
  assert.equal(remainingPlacesText("Plus que {count} places", -1), "");
  assert.equal(remainingPlacesText("Plus que {count} places", 7), "Plus que 7 places");
  assert.equal(remainingPlacesText("Plus que 10 places", 7), "");
  for (const value of ["javascript:alert(1)", "//evil.example", "http://evil.example"]) {
    const input = seed(); input[0].content.fr.buttonHref = value;
    assert.throws(() => parseCarouselSlides(input));
  }
  const withTax = seed(); withTax[0].content.en.title = "Prices HT";
  assert.throws(() => parseCarouselSlides(withTax));
  const fakeCounter = seed(); fakeCounter[0].content.fr.remainingText = "Plus que 5 places";
  assert.throws(() => parseCarouselSlides(fakeCounter));
  assert.throws(() => parseCarouselSlides([seed()[0], seed()[0]]));
  assert.equal(slideHref("en", "/offres"), "/en/offres");
  assert.equal(slideHref("en", "/en/offres"), "/en/offres");
  assert.equal(slideHref("fr", "https://example.com/audit"), "https://example.com/audit");
});
