import assert from "node:assert/strict";
import { test } from "node:test";
import type { Deliverable, Order } from "@/lib/store/types";
import { installationEligibility as checkEligibility, packSourcesValid } from "./eligibility";
import type { AlertPackVersion } from "./types";

const order = { id: "order-1", totalPrice: 10000, amountPaid: 10000 } as Order;
const item: Deliverable = { id: "item-1", orderId: order.id, kind: "fichier", label: "Alertes", createdAt: "2026-10-09", approvedAt: "2026-10-09" };
const pack: AlertPackVersion = { platform: "streamelements", kind: "alertes", id: "pack-1", orderId: order.id, deliverableId: item.id, version: 1, label: "Alertes", status: "pret", configurationPath: "order-1/alerts.json", media: [{ key: "follow", label: "Follow", kind: "video", storagePath: "order-1/follow.webm" }] };
const installationEligibility = (o: Order, d: Deliverable, p: AlertPackVersion | null, now?: Date) => checkEligibility(o, d, p, "streamelements", now);

test("chaque plateforme possède sa configuration et ne peut utiliser celle de l'autre", () => {
  const streamlabs = { ...pack, id: "sl-pack-1", platform: "streamlabs" as const, configurationPath: "order-1/streamlabs.json" };
  assert.ok(packSourcesValid(streamlabs));
  assert.equal(checkEligibility(order, item, streamlabs, "streamlabs"), "integration_indisponible");
  assert.equal(checkEligibility(order, item, pack, "streamlabs"), "introuvable");
  assert.equal(checkEligibility(order, item, streamlabs, "streamelements"), "introuvable");
  assert.equal(checkEligibility({ ...order, amountPaid: 0 }, item, streamlabs, "streamlabs"), "solde_a_regler");
  assert.equal(checkEligibility(order, { ...item, approvedAt: undefined }, streamlabs, "streamlabs"), "a_valider");
  assert.ok(packSourcesValid({ ...streamlabs, kind: "widget" }));
});

test("l'installation reste indisponible même pour un pack validé et intégralement payé", () => {
  assert.equal(installationEligibility(order, item, pack), "integration_indisponible");
});

test("une autre commande ou un autre livrable ne peut pas utiliser le pack", () => {
  assert.equal(installationEligibility(order, { ...item, orderId: "other" }, pack), "introuvable");
  assert.equal(installationEligibility(order, item, { ...pack, deliverableId: "other" }), "introuvable");
});

test("validation, publication et paiement sont nécessaires", () => {
  assert.equal(installationEligibility(order, { ...item, approvedAt: undefined }, pack), "a_valider");
  assert.equal(installationEligibility(order, { ...item, plannedKey: "alertes" }, pack), "a_valider");
  assert.equal(installationEligibility({ ...order, amountPaid: 3000 }, item, pack), "solde_a_regler");
  assert.equal(installationEligibility({ ...order, amountPaid: NaN }, item, pack), "solde_a_regler");
  assert.equal(installationEligibility(order, { ...item, clientNotes: [{ at: "2026-10-09", body: "Correction" }] }, pack), "a_valider");
});

test("expiration et remboursements bloquent une nouvelle installation", () => {
  assert.equal(installationEligibility({ ...order, completedAt: "2026-04-09T00:00:00Z" }, item, pack, new Date("2026-10-09T00:00:00Z")), "expiree");
  assert.equal(installationEligibility({ ...order, refunds: [{ id: "re-1", amount: 100, at: "2026-10-09" }] }, item, pack), "remboursement");
});

test("seuls les packs prêts avec des références privées valides sont préparés", () => {
  assert.equal(installationEligibility(order, item, null), "pack_a_preparer");
  assert.equal(installationEligibility(order, item, { ...pack, status: "brouillon" }), "pack_a_preparer");
  assert.ok(packSourcesValid(pack));
  for (const path of ["other/file.webm", "order-1/../other.webm", "order-1/%2e%2e/file", "order-1/a\\b", "https://cdn.example.com/a", "order-1/a?token=x"]) {
    assert.equal(packSourcesValid({ ...pack, configurationPath: path }), false, path);
    assert.equal(packSourcesValid({ ...pack, media: [{ ...pack.media[0], storagePath: path }] }), false, path);
  }
  assert.equal(packSourcesValid({ ...pack, media: [...pack.media, ...pack.media] }), false);
  assert.equal(packSourcesValid({ ...pack, version: 0 }), false);
});
