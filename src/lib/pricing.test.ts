import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, options, packs } from "@/data/packs";
import { amountToPay, depositAmount, orderPrice } from "./pricing";
import { quote } from "./orders";

const catalog = { settings: defaultSettings, packs, options };

test("prix, remise logo et acompte calculés côté serveur", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "base", payment: "acompte", hasLogo: true })!;
  assert.equal(q.totalPrice, 34000);
  assert.equal(q.amount, 10200);
  const s = quote(catalog, { packId: "identite-signature", formulaId: "emotes-animations", payment: "total", hasLogo: true })!;
  assert.equal(s.totalPrice, 157000);
  assert.equal(s.amount, 157000);
});

test("valeurs inconnues : formule de base, paiement complet, pas de remise", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "hack", payment: "1euro", hasLogo: false })!;
  assert.equal(q.formulaId, "base");
  assert.equal(q.payment, "total");
  assert.equal(q.amount, 49000);
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
