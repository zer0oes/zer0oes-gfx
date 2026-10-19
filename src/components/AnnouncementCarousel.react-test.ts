import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { AnnouncementCarousel } from "./AnnouncementCarousel";
import { bannerSlide } from "@/lib/announcement-carousel";
import type { Banner } from "@/lib/promotions";

const base = { textEn: "", code: "", linkLabel: "", linkLabelEn: "", pages: ["*"], startsAt: "", endsAt: "", tone: "violet" as const, enabled: true, carousel: true };
const launch: Banner = { ...base, id: "launch", linkedTo: "launch", link: "/offres", badge: "Offre de lancement", text: "−50 % sur les packs, −25 % à la carte", conditions: "Remise automatique, non cumulable", remainingText: "Plus que {count} places" };
const audit: Banner = { ...base, id: "audit", link: "/contact?sujet=audit", badge: "Audit gratuit", text: "Un œil neuf sur ta chaîne ?", textEn: "A fresh look at your channel?", conditions: "" };
const slides = [launch, audit].map(bannerSlide);
const render = (props: Partial<Parameters<typeof AnnouncementCarousel>[0]>) => renderToStaticMarkup(createElement(AnnouncementCarousel, { slides, locale: "fr", initialStatus: { active: true, remaining: 6 }, ...props }));

test("carrousel accessible : grille commune, diapo inactive inerte, points et vrai compteur en violet", () => {
  const html = render({});
  assert.match(html, /aria-roledescription="carousel"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-hidden="true" inert=""/);
  assert.match(html, /Plus que <\/span><span><strong[^>]*>6<\/strong> places/);
  assert.match(html, /Afficher la diapo 2/);
  assert.equal((html.match(/col-start-1 row-start-1/g) ?? []).length, 2);
});
test("une seule diapo : ni points ni rotation ; offre terminée masquée ; rien à afficher", () => {
  const html = render({ initialStatus: { active: false, remaining: 0 }, locale: "en" });
  assert.match(html, /A fresh look at your channel/);
  assert.doesNotMatch(html, /data-slide="launch"|Slideshow controls|Show slide|Pause slideshow/);
  assert.equal(render({ slides: [] }), "");
});
test("pastille et petite note éditées, note vide facultative", () => {
  const html = render({ slides: [bannerSlide({ ...audit, badge: "Audit personnalisé", conditions: "Ma petite note" })] });
  assert.match(html, /Audit personnalisé/);
  assert.match(html, /Ma petite note/);
  assert.doesNotMatch(render({ slides: [bannerSlide(audit)] }), /Ma petite note/);
});
