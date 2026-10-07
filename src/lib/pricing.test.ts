import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, options, packs } from "@/data/packs";
import { amountToPay, depositAmount, optionCategory, orderPrice, splitOptionName } from "./pricing";
import { quote, quoteMetadata, quoteFromMetadata } from "./orders";

const catalog = { settings: defaultSettings, packs, options };

test("panier à la carte : quantités, prix et reconstitution", () => {
  const q = quote(catalog, { optionItems: [{ id: "emote-statique", quantity: 3 }, { id: "avatar", quantity: 1 }], payment: "acompte", hasLogo: true })!;
  assert.equal(q.amount, 7500);
  assert.equal(q.payment, "total");
  assert.equal(q.hasLogo, false);
  assert.deepEqual(q.deliveryTemplate, ["Emote statique (unité) × 3", "Avatar"]);
  assert.deepEqual(quote(catalog, { packId: q.packId, formulaId: q.formulaId }), q);
  const restored = quoteFromMetadata(quoteMetadata(q))!;
  assert.deepEqual(restored.deliveryTemplate, q.deliveryTemplate);
  assert.equal(restored.totalPrice, q.totalPrice);
  assert.equal(restored.formulaId, q.formulaId);
});

test("panier invalide : aucun paiement partiel de la sélection", () => {
  for (const optionItems of [[], [{ id: "avatar", quantity: 0 }], [{ id: "avatar", quantity: 1.5 }], [{ id: "avatar", quantity: 21 }], [{ id: "avatar", quantity: 1 }, { id: "logo", quantity: 1 }], [{ id: "avatar", quantity: 1 }, { id: "avatar", quantity: 1 }]]) {
    assert.equal(quote(catalog, { optionItems }), null);
  }
  assert.equal(quote(catalog, { packId: "options", formulaId: "invalid" }), null);
});

test("option à prix fixe : paiement complet sans remise logo ni acompte", () => {
  const q = quote(catalog, { optionId: "emote-statique", hasLogo: true, payment: "acompte" })!;
  assert.equal(q.packId, "option:emote-statique");
  assert.equal(q.totalPrice, 1500);
  assert.equal(q.amount, 1500);
  assert.equal(q.payment, "total");
  assert.equal(q.hasLogo, false);
  assert.deepEqual(q.deliveryTemplate, ["Emote statique (unité)"]);
  assert.deepEqual(quote(catalog, { packId: q.packId }), q);
});

test("options inconnues, sur devis ou sous le minimum Stripe : refusées", () => {
  assert.equal(quote(catalog, { optionId: "inconnue" }), null);
  assert.equal(quote(catalog, { optionId: "logo" }), null);
  assert.equal(quote({ ...catalog, options: [{ id: "invalid", name: "Invalid", price: 49 }] }, { optionId: "invalid" }), null);
});

test("promotion publique d'une option conservée dans la commande", () => {
  const q = quote({ ...catalog, options: [{ id: "sale", name: "Sale", price: 1000, normalPrice: 1500, promotionCode: "SALE" }] }, { optionId: "sale" })!;
  assert.equal(q.amount, 1000);
  assert.equal(q.listPrice, 1500);
  assert.equal(q.promoCode, "SALE");
  assert.equal(q.promoDiscount, 500);
});

test("prix, remise logo et acompte calculés côté serveur", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "base", payment: "acompte", hasLogo: true })!;
  assert.equal(q.totalPrice, 24000);
  assert.equal(q.amount, 7200);
  const s = quote(catalog, { packId: "identite-signature", formulaId: "emotes-animations", payment: "total", hasLogo: true })!;
  assert.equal(s.totalPrice, 81500);
  assert.equal(s.amount, 81500);
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
