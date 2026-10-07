import assert from "node:assert/strict";
import { test } from "node:test";
import { pendingPreview, previewsEmail } from "./delivery";

test("seules les versions nouvelles sont notifiées", () => {
  assert.equal(pendingPreview({ plannedKey: "avatar" }), null);
  assert.equal(pendingPreview({ previewPath: "preview-v1", notifiedPreview: "preview-v1" }), null);
  assert.equal(pendingPreview({ previewPath: "preview-v2", notifiedPreview: "preview-v1" }), "preview-v2");
});

test("l’e-mail compte les aperçus et adapte la protection au paiement", () => {
  const mail = previewsEmail({ offerName: "Premier look", url: "https://example.com/commande/token", labels: ["Avatar", "Bannière"], paid: true });
  assert.match(mail.subject, /aperçus sont prêts à être validés/);
  assert.match(mail.text, /2 aperçus/);
  assert.match(mail.text, /Les fichiers HD seront accessibles après validation\./);
  assert.doesNotMatch(mail.text, /solde|livraison est prête/);
});
