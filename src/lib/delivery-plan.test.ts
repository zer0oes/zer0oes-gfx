import assert from "node:assert/strict";
import { test } from "node:test";
import { plannedDelivery, deliveryState } from "./delivery-plan";
import { unlockState } from "./delivery";
import type { Deliverable } from "./store/types";

test("livraison à la carte : conserver chaque produit et sa quantité sans dépendre des scènes du brief", () => {
  const deliveryTemplate = ["Overlay animé (unité) × 2", "Pack de 3 emotes statiques", "Avatar"];
  assert.deepEqual(plannedDelivery({ packId: "options", formulaId: "[]", hasLogo: false, deliveryTemplate }).map((item) => item.label), deliveryTemplate);
});

test("le plan figé suit le brief et exclut le logo fourni et les corrections", () => {
  const order = { packId: "premier-look", formulaId: "base", hasLogo: true, deliveryTemplate: ["Logo", "2 overlays fixes au choix", "Bannière et avatar", "2 séries de corrections regroupées"], brief: { "Overlays choisis": "Démarrage, Gameplay" } };
  assert.deepEqual(plannedDelivery(order).map((item) => item.label), ["Overlay Démarrage", "Overlay Gameplay", "Bannière", "Avatar"]);
  assert.equal(plannedDelivery({ ...order, formulaId: "emotes" }).at(-1)?.label, "5 emotes personnalisées");
});

test("aperçu, validation et paiement intégral contrôlent la livraison finale", () => {
  const order = { totalPrice: 24000, amountPaid: 24000 };
  const item = { id: "d", orderId: "o", label: "Avatar", createdAt: "now", kind: "fichier", plannedKey: "avatar", finalAssets: [{ label: "Avatar HD.png", path: "o/avatar.png" }] } satisfies Deliverable;
  assert.equal(deliveryState(order, item), "À préparer");
  assert.equal(unlockState(order, { approvedAt: undefined }), "a_valider");
  assert.equal(deliveryState(order, { ...item, previewPath: "o/preview.png" }), "À préparer");
  assert.equal(deliveryState(order, { ...item, previewPath: "o/preview.png", publishedAt: "now" }), "À valider");
  assert.equal(deliveryState({ ...order, amountPaid: 10000 }, { ...item, publishedAt: "now", approvedAt: "now" }), "Validé");
  assert.equal(unlockState({ ...order, amountPaid: 10000 }, { approvedAt: "now" }), "solde_a_regler");
  assert.equal(deliveryState(order, { ...item, publishedAt: "now", approvedAt: "now" }), "Prêt à télécharger");
  assert.equal(deliveryState(order, { ...item, publishedAt: "now", approvedAt: "now", accessedFinalAssets: ["o/avatar.png"] }), "Téléchargé");
});
