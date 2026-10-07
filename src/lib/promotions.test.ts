import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, options, packs } from "@/data/packs";
import { activePeriod, bannerMatches, normalizeCode, parseSalePrices, saleCatalog, safeBannerLink, validPromotion, type Banner, type Promotion } from "./promotions";
import { quote, discountQuote, quoteMetadata, newOrderFrom } from "./orders";
const promotion: Promotion = { id: "test", enabled: true, code: "FIDELITE-TEST", label: "Client privé", kind: "percent", value: 10, startsAt: "", endsAt: "", packIds: [] };
const catalog = { settings: defaultSettings, packs, options };
test("remise après logo : acompte et solde calculés sur le total réduit, traçabilité conservée", () => {
  const q = quote(catalog, { packId: "premier-look", formulaId: "base", hasLogo: true, payment: "acompte" })!;
  const discounted = discountQuote(q, promotion)!;
  assert.equal(discounted.totalPrice, 21600);
  assert.equal(discounted.amount, 6480);
  assert.equal(discounted.totalPrice - discounted.amount, 15120);
  assert.equal(quoteMetadata(discounted).promoDiscount, "2400");
  const order = newOrderFrom(discounted, { sessionId: "test", demo: true });
  assert.equal(order.totalPrice, 21600);
  assert.equal(order.promoCode, promotion.code);
  assert.equal(order.promoDiscount, 2400);
});
test("remise fixe en centimes et refus des paiements inférieurs au minimum", () => {
  const q = quote(catalog, { packId: "premier-look" })!;
  assert.equal(discountQuote(q, { ...promotion, kind: "fixed", value: 2500 })!.totalPrice, q.totalPrice - 2500);
  assert.equal(discountQuote(q, { ...promotion, kind: "fixed", value: q.totalPrice }), null);
});
test("code désactivé, expiré, futur ou réservé à un autre pack : inutilisable", () => {
  const now = Date.parse("2026-10-07T10:00:00Z");
  assert.equal(validPromotion({ ...promotion, enabled: false }, "premier-look", now), false);
  assert.equal(validPromotion({ ...promotion, startsAt: "2026-10-07T11:00:00Z" }, "premier-look", now), false);
  assert.equal(validPromotion({ ...promotion, endsAt: "2026-10-07T10:00:00Z" }, "premier-look", now), false);
  assert.equal(validPromotion({ ...promotion, packIds: ["autre"] }, "premier-look", now), false);
  assert.equal(activePeriod({ ...promotion, startsAt: "invalide" }, now), false);
  assert.equal(normalizeCode(" fidelite-test "), promotion.code);
});
test("bandeau ciblé sur portfolio inclut les projets ; liens exécutables refusés", () => {
  const banner: Banner = { ...promotion, text: "Offre", textEn: "", pages: ["/portfolio"], link: "", linkLabel: "", linkLabelEn: "", tone: "violet" };
  assert.equal(bannerMatches(banner, "/portfolio/projet"), true);
  assert.equal(bannerMatches(banner, "/offres"), false);
  assert.equal(safeBannerLink("javascript:alert(1)"), false);
  assert.equal(safeBannerLink("//example.com"), false);
  assert.equal(safeBannerLink("/offres"), true);
});

const sale: Promotion = { ...promotion, mode: "sale", salePrices: { "formula:premier-look:base": 30000, [`option:${options[0].id}`]: options[0].price - 100 } };
test("prix publics ciblés : catalogue conservé, prix barré et montant payé cohérents", () => {
  const originalPrice = catalog.packs[0].price;
  const publicCatalog = saleCatalog(catalog, [sale]);
  const pack = publicCatalog.packs.find((p) => p.id === "premier-look")!;
  assert.equal(pack.price, 30000);
  assert.equal(pack.normalPrice, 39000);
  assert.equal(publicCatalog.options[0].price, options[0].price - 100);
  assert.equal(publicCatalog.options[0].normalPrice, options[0].price);
  assert.equal(catalog.packs[0].price, originalPrice);
  assert.equal(catalog.options[0].normalPrice, undefined);
  const q = quote(publicCatalog, { packId: "premier-look", payment: "acompte", hasLogo: true })!;
  assert.equal(q.listPrice, 39000);
  assert.equal(q.totalPrice, 15000);
  assert.equal(q.amount, 4500);
  assert.equal(q.logoDiscount, 15000);
  assert.equal(q.promoDiscount, 9000);
  assert.equal(newOrderFrom(q, { sessionId: "sale-test", demo: true }).totalPrice, 15000);
  assert.equal(quoteMetadata(q).promoCode, sale.code);
  assert.equal(discountQuote(q, promotion), null);
});
test("promotions expirées, futures, désactivées et codes privés ne barrent aucun prix", () => {
  const now = Date.parse("2026-10-07T10:00:00Z");
  for (const p of [promotion, { ...sale, enabled: false }, { ...sale, endsAt: "2026-10-07T10:00:00Z" }, { ...sale, startsAt: "2026-10-07T11:00:00Z" }]) {
    const result = saleCatalog(catalog, [p], now);
    assert.equal(result.packs[0].price, catalog.packs[0].price);
    assert.equal(result.packs[0].normalPrice, undefined);
  }
  assert.equal(validPromotion(sale, "premier-look", now), false);
});
test("promotions multiples : meilleur prix, sans additionner les remises", () => {
  const result = saleCatalog(catalog, [sale, { ...sale, code: "SECOND", salePrices: { "formula:premier-look:base": 28000 } }]);
  assert.equal(result.packs.find((p) => p.id === "premier-look")!.price, 28000);
});
test("prix calculés côté serveur depuis le pourcentage : sélection et taux validés", () => {
  const f = new FormData();
  assert.throws(() => parseSalePrices(f, catalog, 20), /au moins un produit/);
  f.append("products", "formula:premier-look:base");
  f.set("sale:formula:premier-look:base", "1"); // Un prix envoyé par le navigateur est ignoré.
  assert.deepEqual(parseSalePrices(f, catalog, 20), { "formula:premier-look:base": 31200 });
  assert.deepEqual(parseSalePrices(f, catalog, 12.5), { "formula:premier-look:base": 34125 });
  for (const invalid of [0, -5, 81, NaN, Infinity]) {
    assert.throws(() => parseSalePrices(f, catalog, invalid), /remise entre/);
  }
  f.set("products", "option:inexistant");
  assert.throws(() => parseSalePrices(f, catalog, 20), /n’existe plus/);
});

test("pourcentage public : prix barré, acompte et changements du catalogue suivent le taux enregistré", () => {
  const percentageSale: Promotion = { ...sale, kind: "percent", value: 20, productKeys: ["formula:premier-look:base"] };
  const result = saleCatalog(catalog, [percentageSale]);
  assert.equal(result.packs.find((p) => p.id === "premier-look")!.price, 31200);
  const q = quote(result, { packId: "premier-look", payment: "acompte" })!;
  assert.equal(q.amount, 9360);
  assert.equal(q.promoDiscount, 7800);
  const changed = { ...catalog, packs: catalog.packs.map((p) => p.id === "premier-look" ? { ...p, price: 40000, formulas: p.formulas?.map((f) => f.id === "base" ? { ...f, price: 40000 } : f) } : p) };
  const updated = saleCatalog(changed, [percentageSale]).packs.find((p) => p.id === "premier-look")!;
  assert.equal(updated.price, 32000);
  assert.equal(updated.normalPrice, 40000);
});
