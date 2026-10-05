import assert from "node:assert/strict";
import { test } from "node:test";
import { DIRECT, deviceOf, isBot, pageLabel, sourceOf, summarize, type StatEvent } from "./stats";

test("provenance : utm, réseaux, moteurs, accès direct, navigation interne", () => {
  const site = "www.zer0oes-gfx.com";
  assert.equal(sourceOf("https://www.twitch.tv/zer0oes", undefined, site), "Twitch");
  assert.equal(sourceOf("https://l.instagram.com/?u=x", undefined, site), "Instagram");
  assert.equal(sourceOf("https://www.google.fr/", undefined, site), "Google");
  assert.equal(sourceOf("https://t.co/abc", undefined, site), "X (Twitter)");
  assert.equal(sourceOf("https://exemple.fr/page", undefined, site), "exemple.fr");
  assert.equal(sourceOf(undefined, undefined, site), DIRECT);
  assert.equal(sourceOf("pas une url", undefined, site), DIRECT);
  assert.equal(sourceOf("https://zer0oes-gfx.com/offres", undefined, site), null); // interne
  assert.equal(sourceOf("https://www.google.com/", "twitch", site), "Twitch"); // utm prioritaire
  assert.equal(sourceOf(undefined, "newsletter", site), "Newsletter");
});

test("appareil et robots", () => {
  assert.equal(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"), "mobile");
  assert.equal(deviceOf("Mozilla/5.0 (Linux; Android 14; SM-S918B) Mobile Safari/537.36"), "mobile");
  assert.equal(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"), "tablette");
  assert.equal(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0"), "ordinateur");
  assert.equal(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isBot(""), true);
  assert.equal(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0"), false);
});

test("noms de pages", () => {
  assert.equal(pageLabel("/"), "Accueil");
  assert.equal(pageLabel("/contact?onglet=message"), "Contact : message simple");
  assert.equal(pageLabel("/contact"), "Contact : projet sur-mesure");
  assert.equal(pageLabel("/portfolio/tomavega"), "Projet : tomavega");
});

test("résumé : visiteurs par jour, provenance de la visite, période", () => {
  const ev = (createdAt: string, e: Partial<StatEvent>): StatEvent => ({ createdAt, kind: "vue", path: "/", ...e });
  const events = [
    ev("2026-10-01T08:00:00Z", { visitor: "a", source: "Twitch", device: "mobile" }),
    ev("2026-10-01T08:01:00Z", { visitor: "a", path: "/offres" }),
    ev("2026-10-01T08:02:00Z", { kind: "clic", visitor: "a", label: "Parlons de ton projet" }),
    ev("2026-10-01T09:00:00Z", { visitor: "b", source: DIRECT, device: "ordinateur" }),
    // Même empreinte le lendemain : compte comme un nouveau visiteur du jour
    ev("2026-10-02T09:00:00Z", { visitor: "a", source: "Google", device: "mobile" }),
    ev("2026-10-02T10:00:00Z", { kind: "formulaire", label: "Projet : Projet sur mesure", path: "/contact" }),
    // Hors période (30 sept. à Paris)
    ev("2026-09-30T20:00:00Z", { visitor: "z", source: "Twitch" }),
  ];
  const s = summarize(events, { start: "2026-10-01", end: "2026-10-31" });
  assert.equal(s.views, 4);
  assert.equal(s.visitors, 3);
  assert.equal(s.clicks, 1);
  assert.equal(s.forms, 1);
  assert.deepEqual(s.sources, [
    { label: "Accès direct", count: 1 },
    { label: "Google", count: 1 },
    { label: "Twitch", count: 1 },
  ]);
  assert.deepEqual(s.devices, [
    { label: "Mobile", count: 2 },
    { label: "Ordinateur", count: 1 },
  ]);
  assert.deepEqual(s.pages[0], { label: "Accueil", count: 3 });
  assert.deepEqual(s.clickTargets, [{ label: "Parlons de ton projet", count: 1 }]);
  const day1 = s.points.find((p) => p.key === "2026-10-01")!;
  assert.equal(day1.views, 3);
  assert.equal(day1.visitors, 2);
});
