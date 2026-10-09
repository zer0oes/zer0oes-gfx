import assert from "node:assert/strict";
import { test } from "node:test";
import { briefDeliveryAnswers, briefDeliveryNeeds, overlayDeliveryChoices, pickChoice, streamToolChoices } from "./brief-delivery";

test("brief : questions de plateforme et de livraison selon le contenu de la commande", () => {
  assert.deepEqual(briefDeliveryNeeds(["Widget personnalisé (barre d’objectifs)"]), { platform: true, overlays: false });
  assert.deepEqual(briefDeliveryNeeds(["Alertes néon — 5 alertes : follow, sub, raid, cheer, tips"]), { platform: true, overlays: false });
  assert.deepEqual(briefDeliveryNeeds(["Overlay fixe (unité)"]), { platform: false, overlays: true });
  assert.deepEqual(briefDeliveryNeeds(["Scènes « Gaming » et « Just Chatting »", "Alertes électriques"]), { platform: true, overlays: true });
  assert.deepEqual(briefDeliveryNeeds(["Logo", "Bannière et avatar"]), { platform: false, overlays: false });
  // pack avec overlays au choix
  assert.deepEqual(briefDeliveryNeeds([], 3), { platform: false, overlays: true });
});

test("brief : seules les réponses proposées sont conservées", () => {
  assert.equal(pickChoice("Streamlabs", streamToolChoices), "Streamlabs");
  assert.equal(pickChoice("OBS", streamToolChoices), "");
  assert.equal(pickChoice(undefined, overlayDeliveryChoices), "");
  assert.equal(pickChoice("Fichiers à configurer soi-même", overlayDeliveryChoices), "Fichiers à configurer soi-même");
});

test("brief : réponses enregistrées, refus si une question affichée reste vide", () => {
  const form = (v: Record<string, string>) => (name: string) => v[name];
  assert.deepEqual(briefDeliveryAnswers(form({ streamTool: "Les deux", overlayDelivery: "Widget StreamElements prêt à intégrer" }), { platform: true, overlays: true }),
    { "Plateforme des widgets et alertes": "Les deux", "Livraison des overlays": "Widget StreamElements prêt à intégrer" });
  assert.equal(briefDeliveryAnswers(form({ overlayDelivery: "Fichiers à configurer soi-même" }), { platform: true, overlays: true }), null);
  assert.deepEqual(briefDeliveryAnswers(form({}), { platform: false, overlays: false }), {});
  assert.deepEqual(briefDeliveryAnswers(form({ streamTool: "OBS" }), { platform: false, overlays: false }), {});
});
