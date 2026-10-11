import assert from "node:assert/strict";
import { test } from "node:test";
import { productBriefFields, productBriefMinutes } from "./product-brief";

test("la durée du brief compte chaque création et les quantités commandées", () => {
  assert.deepEqual(productBriefMinutes([]), [5, 10]);
  const alerts = "Pack d’alertes animées — 5 alertes : follow, sub, raid, cheer, tips";
  assert.deepEqual(productBriefMinutes([alerts]), [5, 10]);
  assert.deepEqual(productBriefMinutes([alerts, "Pack de 3 emotes statiques", "Pack de 6 panneaux Twitch"]), [15, 20]);
  assert.deepEqual(productBriefMinutes(["Overlay statique × 14"]), [15, 20]);
});

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

test("brief des créations : un champ par panneau, un exemple adapté dans chaque champ", async () => {
  const { productBriefParts } = await import("./product-brief");
  const panels = productBriefParts("Pack de 6 panneaux Twitch");
  assert.deepEqual(panels?.map((p) => p.label), ["Panneau 1", "Panneau 2", "Panneau 3", "Panneau 4", "Panneau 5", "Panneau 6"]);
  assert.equal(panels?.[0].labelEn, "Panel 1");
  assert.ok(panels?.every((p) => p.example && p.exampleEn));
  const animated = productBriefParts("Pack d’alertes animées — 5 alertes : follow, sub, raid, cheer, tips");
  assert.match(animated?.[0].example ?? "", /rebondit/);
  assert.doesNotMatch(productBriefParts("Pack d’alertes statique — 5 alertes : follow, sub, raid, cheer, tips")?.[0].example ?? "", /rebondit/);
  const emotes = productBriefParts("Pack de 3 emotes statiques");
  assert.equal(new Set(emotes?.map((p) => p.example)).size, 3);
});
