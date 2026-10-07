import test from "node:test";
import assert from "node:assert/strict";
import { archiveEntries, canDownloadArchive } from "./order-archive";
import type { Deliverable } from "./store/types";

const item: Deliverable = { id: "a", orderId: "o", createdAt: "now", kind: "fichier", label: "Avatar", plannedKey: "avatar", publishedAt: "now", approvedAt: "now", finalAssets: [{ path: "o/avatar.png", label: "Tartifl8 - Avatar" }] };

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
