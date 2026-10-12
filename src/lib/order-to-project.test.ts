import assert from "node:assert/strict";
import { test } from "node:test";
import { withoutDrafts } from "@/data/portfolio";
import { projectCategory, projectName, projectSource, projectUrl } from "./order-to-project";

test("nom et lien du projet repris du brief", () => {
  assert.equal(projectName({ brief: { Pseudo: " Kira " }, customerName: "Zoé", offerName: "Premier look" }), "Kira");
  assert.equal(projectName({ customerName: "Zoé", offerName: "Premier look" }), "Zoé");
  assert.equal(projectUrl({ brief: { Chaîne: "twitch.tv/kira" } }), "https://twitch.tv/kira");
  assert.equal(projectUrl({ brief: { Chaîne: "http://twitch.tv/kira" } }), undefined);
  assert.equal(projectUrl({ brief: {} }), undefined);
});

test("type de réalisation d'après le badge puis l'intitulé", () => {
  assert.equal(projectCategory({ kind: "fichier", itemType: "overlay", label: "Overlay Jeu" }), "overlays");
  assert.equal(projectCategory({ kind: "fichier", itemType: "visuel", label: "Logo principal" }), "logo");
  assert.equal(projectCategory({ kind: "fichier", itemType: "visuel", label: "Bannière" }), "reseaux");
  assert.equal(projectCategory({ kind: "fichier", itemType: "guide", label: "Guide d'installation" }), null);
  assert.equal(projectCategory({ kind: "fichier", storagePath: "a/b.zip", label: "Sources" }), null);
});

test("fichier repris : visuel final, sinon aperçu, vidéo en aperçu léger", () => {
  assert.deepEqual(projectSource({ previewPath: "p.png", finalAssets: [{ path: "f.zip", label: "" }, { path: "f.png", label: "" }] }), { path: "f.png", kind: "image" });
  assert.deepEqual(projectSource({ previewPath: "p.mp4", previewType: "video", finalAssets: [{ path: "f.mov", label: "" }] }), { path: "p.mp4", kind: "video" });
  assert.deepEqual(projectSource({ finalAssets: [{ path: "f.webm", label: "" }] }), { path: "f.webm", kind: "video" });
  assert.equal(projectSource({ storagePath: "f.zip" }), null);
});

test("les brouillons et leurs réalisations sont masqués sur le site", () => {
  const p = withoutDrafts({ streamers: [{ id: "a", name: "A", description: "" }, { id: "b", name: "B", description: "", draft: true }], works: [{ streamer: "a" }, { streamer: "b" }] });
  assert.deepEqual(p.streamers.map((s) => s.id), ["a"]);
  assert.deepEqual(p.works, [{ streamer: "a" }]);
});
