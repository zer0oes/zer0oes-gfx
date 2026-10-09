import assert from "node:assert/strict";
import { test } from "node:test";
import { INSTALL_LINE, briefDeliveryNeeds, briefPlatformAnswer, hasInstallLine, pickChoice, streamToolChoices, withoutInstallLine } from "./brief-delivery";

test("installation : plateforme demandée selon le contenu de la commande", () => {
  assert.equal(briefDeliveryNeeds(["Widget personnalisé (barre d’objectifs)"]).platform, true);
  assert.equal(briefDeliveryNeeds(["Alertes néon — 5 alertes : follow, sub, raid, cheer, tips"]).platform, true);
  assert.equal(briefDeliveryNeeds(["Overlay fixe (unité)"]).platform, true);
  assert.equal(briefDeliveryNeeds(["Scènes « Gaming » et « Just Chatting »"]).platform, true);
  assert.equal(briefDeliveryNeeds(["Logo", "Bannière et avatar"]).platform, false);
  // pack avec overlays au choix ; la ligne d'installation seule ne compte pas
  assert.equal(briefDeliveryNeeds([], 5).platform, true);
  assert.equal(briefDeliveryNeeds([INSTALL_LINE]).platform, false);
});

test("installation : ligne du supplément repérée et retirée des créations à décrire", () => {
  const lines = ["Overlay fixe (unité)", INSTALL_LINE];
  assert.equal(hasInstallLine(lines), true);
  assert.deepEqual(withoutInstallLine(lines), ["Overlay fixe (unité)"]);
  assert.equal(hasInstallLine(["Overlay fixe (unité)"]), false);
});

test("brief : plateforme obligatoire si demandée, « Les deux » réservé aux devis", () => {
  assert.deepEqual(briefPlatformAnswer("Streamlabs", true), { "Plateforme des widgets et alertes": "Streamlabs" });
  assert.equal(briefPlatformAnswer("Les deux", true), null);
  assert.deepEqual(briefPlatformAnswer("Les deux", true, streamToolChoices), { "Plateforme des widgets et alertes": "Les deux" });
  assert.equal(briefPlatformAnswer(undefined, true), null);
  assert.deepEqual(briefPlatformAnswer(undefined, false), {});
  assert.equal(pickChoice("OBS", streamToolChoices), "");
});
