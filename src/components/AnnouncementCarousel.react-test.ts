import assert from "node:assert/strict";
import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { AnnouncementCarousel } from "./AnnouncementCarousel";
import { parseCarouselSlides } from "@/lib/announcement-carousel";
const slides = parseCarouselSlides(JSON.parse(fs.readFileSync("supabase/migrations/20261016000200_announcement_carousel.sql", "utf8").split("$slides$")[1]));
test("carrousel accessible : grille commune, diapo inactive inerte, points et vrai compteur", () => {
  const html = renderToStaticMarkup(createElement(AnnouncementCarousel, { slides, locale: "fr", initialStatus: { active: true, started: true, remaining: 6 } }));
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-hidden="true" inert=""/);
  assert.match(html, /Plus que <\/span><span><strong[^>]*>6<\/strong> places/);
  assert.match(html, /Afficher la diapo 2/);
  assert.equal((html.match(/col-start-1 row-start-1/g) ?? []).length, 2);
});
test("une seule diapo : ni points ni rotation, contenu édité affiché sans repli codé", () => {
  const onlyAudit = slides.map((s) => ({ ...s, enabled: s.id === "audit" }));
  onlyAudit[1].content.en.title = "My edited audit headline";
  const html = renderToStaticMarkup(createElement(AnnouncementCarousel, { slides: onlyAudit, locale: "en", initialStatus: { active: true, started: true, remaining: null } }));
  assert.match(html, /My edited audit headline/);
  assert.doesNotMatch(html, /Slideshow controls|Show slide|Pause slideshow|places left/);
  assert.equal(renderToStaticMarkup(createElement(AnnouncementCarousel, { slides: [], locale: "fr", initialStatus: { active: true, started: true, remaining: 0 } })), "");
});

test("audit : pastille et ligne secondaire éditées, ligne vide facultative", () => {
  const edited = structuredClone(slides);
  const audit = edited.find((slide) => slide.id === "audit")!;
  audit.content.fr.badge = "Audit personnalisé";
  audit.content.fr.conditions = "Ma ligne secondaire";
  const render = () => renderToStaticMarkup(createElement(AnnouncementCarousel, { slides: edited, locale: "fr", initialStatus: { active: true, started: true, remaining: 6 } }));
  assert.match(render(), /Audit personnalisé/);
  assert.match(render(), /Ma ligne secondaire/);
  audit.content.fr.conditions = "";
  assert.doesNotMatch(render(), /Ma ligne secondaire/);
});

test("audit qui suit l'offre : masqué tant que l'offre n'a pas commencé, visible avec ses propres dates", () => {
  const before = renderToStaticMarkup(createElement(AnnouncementCarousel, { slides, locale: "fr", initialStatus: { active: false, started: false, remaining: 10 } }));
  assert.equal(before, "");
  const own = slides.map((s) => s.id === "audit" ? { ...s, schedule: { followLaunch: false, startsAt: "", endsAt: "" } } : s);
  const html = renderToStaticMarkup(createElement(AnnouncementCarousel, { slides: own, locale: "fr", initialStatus: { active: false, started: false, remaining: 10 } }));
  assert.match(html, /data-slide="audit"/);
  assert.doesNotMatch(html, /data-slide="launch"/);
});
