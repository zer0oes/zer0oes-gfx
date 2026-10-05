import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, options, packs } from "@/data/packs";
import { amountToPay, depositAmount, optionCategory, orderPrice, splitOptionName } from "./pricing";
import { quote } from "./orders";

const catalog = { settings: defaultSettings, packs, options };

test("prix, remise logo et acompte calculés côté serveur", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "base", payment: "acompte", hasLogo: true })!;
  assert.equal(q.totalPrice, 24000);
  assert.equal(q.amount, 7200);
  const s = quote(catalog, { packId: "identite-signature", formulaId: "emotes-animations", payment: "total", hasLogo: true })!;
  assert.equal(s.totalPrice, 84000);
  assert.equal(s.amount, 84000);
});

test("valeurs inconnues : formule de base, paiement complet, pas de remise", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "hack", payment: "1euro", hasLogo: false })!;
  assert.equal(q.formulaId, "base");
  assert.equal(q.payment, "total");
  assert.equal(q.amount, 39000);
});

test("offre archivée : non commandable", () => {
  const archived = { ...catalog, packs: catalog.packs.map((p) => (p.id === "premier-look" ? { ...p, archived: true } : p)) };
  assert.equal(quote(archived, { packId: "premier-look", formulaId: "base" }), null);
});

test("offre sur devis : pas de paiement direct", () => {
  assert.equal(quote(catalog, { packId: "univers-complet" }), null);
  assert.equal(quote(catalog, { packId: "inexistant" }), null);
});

test("helpers purs", () => {
  assert.equal(depositAmount(99000, defaultSettings), 29700);
  assert.equal(orderPrice(10000, true, defaultSettings), 0);
  assert.equal(amountToPay(49000, "total", defaultSettings), 49000);
});

test("catégories des options à la carte", () => {
  const cat = (name: string) => optionCategory({ name });
  assert.equal(cat("Overlay fixe supplémentaire"), "overlays");
  assert.equal(cat("Animation légère d'un overlay existant"), "motion");
  assert.equal(cat("Emote animée"), "emotes");
  assert.equal(cat("Pack de 5 emotes statiques"), "emotes");
  assert.equal(cat("Bannière pour une plateforme supplémentaire"), "branding");
  assert.equal(cat("Animation du logo"), "motion");
  assert.equal(cat("Overlay animé (unité)"), "overlays");
  assert.equal(cat("Pack d’alertes animées"), "overlays");
  assert.equal(cat("Pack d’alertes fixe"), "overlays");
  assert.equal(cat("Widget interactif avancé"), "overlays");
});

test("nom d'option : précision entre parenthèses à part", () => {
  assert.deepEqual(splitOptionName("Widget personnalisé (barre d’objectifs, tchat, sponsor, partenariats)"), {
    main: "Widget personnalisé",
    detail: "barre d’objectifs, tchat, sponsor, partenariats",
  });
  assert.deepEqual(splitOptionName("Logo"), { main: "Logo", detail: undefined });
});
