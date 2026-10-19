import assert from "node:assert/strict";
import { test } from "node:test";
import { bannerSlide, headlineParts, remainingPlacesText, slideHref } from "./announcement-carousel";
import { bannerScheduled, sortBanners, type Banner, type Promotion } from "./promotions";

const banner = (over: Partial<Banner> = {}): Banner => ({ id: "b1", enabled: true, text: "−50 % sur les packs", textEn: "", code: "", link: "/offres", linkLabel: "", linkLabelEn: "",
  pages: ["*"], startsAt: "", endsAt: "", tone: "violet", badge: "Offre de lancement", badgeEn: "Launch offer", conditions: "Remise automatique", ...over });
const promo = (over: Partial<Promotion> = {}): Promotion => ({ id: "p1", enabled: true, code: "FIDELITE", label: "Fidélité", kind: "percent", value: 10, startsAt: "", endsAt: "", packIds: [], ...over });

test("bandeau → diapo : un champ anglais vide reprend le français, l'offre de lancement est repérée", () => {
  const slide = bannerSlide(banner({ linkedTo: "launch" }));
  assert.equal(slide.launch, true);
  assert.equal(slide.content.en.badge, "Launch offer");
  assert.equal(slide.content.en.title, "−50 % sur les packs");
  assert.equal(slide.content.en.conditions, "Remise automatique");
  assert.equal(bannerSlide(banner()).launch, false);
  assert.deepEqual(headlineParts(slide.content.fr.title).filter((p) => p.highlight).map((p) => p.text), ["−50 %"]);
});
test("aucun compteur fabriqué, liens localisés", () => {
  assert.equal(remainingPlacesText("Plus que {count} places", null), "");
  assert.equal(remainingPlacesText("Plus que {count} places", -1), "");
  assert.equal(remainingPlacesText("Plus que {count} places", 7), "Plus que 7 places");
  assert.equal(remainingPlacesText("Plus que 10 places", 7), "");
  assert.equal(slideHref("en", "/offres"), "/en/offres");
  assert.equal(slideHref("en", "/en/offres"), "/en/offres");
  assert.equal(slideHref("fr", "https://example.com/audit"), "https://example.com/audit");
});
test("programmation : dates propres, remise liée, remise supprimée ; ordre du carrousel", () => {
  const nov = banner({ startsAt: "2026-11-01T00:00:00.000Z", endsAt: "2026-11-30T23:00:00.000Z" });
  assert.equal(bannerScheduled(nov, [], undefined, Date.parse("2026-10-20T00:00:00Z")), false);
  assert.equal(bannerScheduled(nov, [], undefined, Date.parse("2026-11-10T00:00:00Z")), true);
  assert.equal(bannerScheduled(banner({ enabled: false }), []), false);
  const linked = banner({ linkedTo: "p1" });
  assert.equal(bannerScheduled(linked, [promo()]), true);
  assert.equal(bannerScheduled(linked, [promo({ enabled: false })]), false);
  assert.equal(bannerScheduled(linked, []), false);
  // Plusieurs offres liées : affiché pendant l'une d'elles ; lancement + remise : il faut l'offre réellement en cours
  const several = banner({ links: ["launch", "p1"] });
  assert.equal(bannerScheduled(several, [promo({ enabled: false })], { enabled: true, active: false }), false);
  assert.equal(bannerScheduled(several, [promo({ enabled: false })], { enabled: true, active: true }), true);
  assert.equal(bannerScheduled(several, [promo()]), true);
  assert.equal(bannerScheduled(banner({ links: ["launch"] }), [], { enabled: true, active: false }), true);
  assert.deepEqual(sortBanners([banner({ id: "b", position: 1 }), banner({ id: "a", position: 0 }), banner({ id: "c" })]).map((b) => b.id), ["a", "b", "c"]);
});
