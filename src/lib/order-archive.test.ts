import test from "node:test";
import assert from "node:assert/strict";
import { archiveEntries, archiveGuides, canDownloadArchive } from "./order-archive";
import type { Deliverable } from "./store/types";

const item: Deliverable = { id: "a", orderId: "o", createdAt: "now", kind: "fichier", label: "Avatar", plannedKey: "avatar", publishedAt: "now", approvedAt: "now", finalAssets: [{ path: "o/avatar.png", label: "Tartifl8 - Avatar" }] };

test("les overlays multiples et les packs ne reçoivent qu'un guide de chaque type", () => {
  const overlay = { ...item, itemType: "overlay" };
  const widget = { ...item, itemType: "widget" };
  const alert = { ...item, itemType: "alerte" };
  assert.deepEqual(archiveGuides([overlay, overlay]), ["guide-installation-overlay-obs.html"]);
  assert.deepEqual(archiveGuides([widget, alert, widget]), ["guide-installation-widgets.html"]);
  assert.deepEqual(archiveGuides([overlay, widget, alert, overlay]), ["guide-installation-overlay-obs.html", "guide-installation-widgets.html"]);
  assert.deepEqual(archiveGuides([item]), []);
  assert.deepEqual(archiveGuides([]), []);
  assert.deepEqual(archiveGuides([{ ...item, kind: "lien" }]), ["guide-installation-overlay-obs.html"]);
  assert.deepEqual(archiveGuides([{ ...item, itemType: "visuel", label: "Overlay animé" }, { ...item, label: "Pack d’alertes" }]), ["guide-installation-overlay-obs.html", "guide-installation-widgets.html"]);
  assert.deepEqual(archiveGuides([{ ...item, itemType: "guide", label: "Guide overlays" }]), []);
});

test("un fichier client ne peut pas écraser le guide automatique", () => {
  const filename = "guide-installation-overlay-obs.html";
  const entries = archiveEntries("o", [{ ...item, finalAssets: [{ path: `o/${filename}`, label: filename }] }], [filename]);
  assert.equal(entries[0].name, "guide-installation-overlay-obs (2).html");
});

test("le ZIP exige tous les aperçus validés, les fichiers prêts et le paiement intégral", () => {
  const paid = { totalPrice: 24000, amountPaid: 24000 };
  assert.equal(canDownloadArchive(paid, [item]), true);
  assert.equal(canDownloadArchive(paid, [item, { ...item, approvedAt: undefined }]), false);
  assert.equal(canDownloadArchive({ ...paid, amountPaid: 10000 }, [item]), false);
  assert.equal(canDownloadArchive(paid, [{ ...item, finalAssets: [] }]), false);
  assert.equal(canDownloadArchive(paid, []), false);
});

test("les noms gardent les extensions et les doublons ne sont pas écrasés", () => {
  const entries = archiveEntries("o", [item, { ...item, id: "b" }]);
  assert.deepEqual(entries.map((entry) => entry.name), ["Tartifl8 - Avatar.png", "Tartifl8 - Avatar (2).png"]);
  assert.throws(() => archiveEntries("other", [item]));
});
