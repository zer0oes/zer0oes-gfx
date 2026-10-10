import assert from "node:assert/strict";
import { test } from "node:test";
import { productBriefFields } from "./product-brief";

test("le brief couvre chaque produit du snapshot de commande", () => {
  const lines = ["Overlay animé × 2", "Emote statique"];
  const values: Record<string, string> = { productBrief_0: " Démarrage et pause ", productBrief_1: "Sourire", productBrief_2: "Produit non acheté" };
  assert.deepEqual(productBriefFields(lines, (key) => values[key] ?? ""), { "Création 1 : Overlay animé × 2": "Démarrage et pause", "Création 2 : Emote statique": "Sourire" });
  assert.equal(productBriefFields(lines, (key) => key === "productBrief_0" ? "Test" : " "), null);
});

test("brief des créations : un champ par alerte, un par emote achetée", async () => {
  const { productBriefParts, readProductBrief, splitProductBrief } = await import("./product-brief");
  const alerts = "Pack d’alertes statique — 5 alertes : follow, sub, raid, cheer, tips";
  assert.deepEqual(productBriefParts(alerts)?.map((p) => p.label), ["Follow", "Sub", "Raid", "Cheer", "Tips"]);
  assert.equal(productBriefParts("Pack de 3 emotes statiques")?.length, 3);
  assert.equal(productBriefParts("Pack de 3 emotes statiques × 2")?.length, 6);
  assert.equal(productBriefParts("Emote statique × 4")?.length, 4);
  assert.equal(productBriefParts("Emote statique"), null);
  assert.equal(productBriefParts("Bannière pour YouTube / Twitch"), null);

  const values: Record<string, string> = { productBrief_0_0: "Merci !", productBrief_0_1: "Bienvenue\nau club", productBrief_0_2: "Raid", productBrief_0_3: "Bits", productBrief_0_4: "Don", productBrief_1: "Sourire" };
  const [pack, emote] = readProductBrief([alerts, "Emote statique"], (key) => values[key] ?? "");
  assert.equal(pack, "Follow : Merci !\nSub : Bienvenue\nau club\nRaid : Raid\nCheer : Bits\nTips : Don");
  assert.equal(emote, "Sourire");
  assert.deepEqual(splitProductBrief(alerts, pack), ["Merci !", "Bienvenue\nau club", "Raid", "Bits", "Don"]);
  // une alerte sans texte : réponse incomplète
  assert.equal(readProductBrief([alerts], (key) => (key === "productBrief_0_2" ? "" : values[key] ?? ""))[0], "");
});
