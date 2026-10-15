import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, packs, options } from "@/data/packs";
import { launchCatalog, launchQuote, hasLaunchOffer, LAUNCH_CODE } from "./launch-offer";
import { quote, discountQuote } from "./orders";
import type { ProjectQuote } from "./quotes";
import { INSTALL_OPTION_ID } from "./brief-delivery";

const catalog = { settings: defaultSettings, packs, options };
const active = { enabled: true, remaining: 10 };
test("lancement : -50 % packs et formules, -25 % créations, tarif normal conservé", () => {
  const result = launchCatalog(catalog, active);
  for (const pack of result.packs) {
    const original = packs.find((p) => p.id === pack.id)!;
    assert.equal(pack.price, original.price - Math.round(original.price / 2));
    assert.equal(pack.normalPrice, original.price);
    for (const formula of pack.formulas ?? []) {
      assert.equal(formula.price, original.formulas!.find((f) => f.id === formula.id)!.price / 2);
    }
  }
  for (const option of result.options) {
    const original = options.find((o) => o.id === option.id)!;
    assert.equal(option.price, option.id === INSTALL_OPTION_ID ? original.price : original.price - Math.round(original.price * .25));
  }
  assert.equal(packs[0].normalPrice, undefined);
  assert.deepEqual(launchCatalog(catalog, { ...active, remaining: 0 }).packs.map((p) => p.price), packs.map((p) => p.price));
  assert.deepEqual(launchCatalog(catalog, { ...active, enabled: false }).options, options);
});

test("programmation : aucun prix remisé avant le début, activation à l'heure prévue", () => {
  const scheduled = { ...active, startsAt: "2099-01-01T08:00:00Z" };
  assert.equal(launchCatalog(catalog, scheduled).packs[0].price, packs[0].price);
  assert.equal(launchCatalog(catalog, { ...scheduled, startsAt: "2020-01-01T08:00:00Z" }).packs[0].price, packs[0].price / 2);
});

test("logo fourni, acompte et panier : montant cohérent, code privé non cumulable", () => {
  const discounted = launchCatalog(catalog, active);
  for (const pack of packs.filter((p) => p.checkout)) {
    const normal = quote(catalog, { packId: pack.id, hasLogo: true, payment: "acompte" })!;
    const reduced = quote(discounted, { packId: pack.id, hasLogo: true, payment: "acompte" })!;
    assert.equal(reduced.totalPrice, normal.totalPrice / 2);
    assert.equal(reduced.amount, Math.round(reduced.totalPrice * reduced.depositPercent / 100));
    assert.equal(hasLaunchOffer(reduced.promoCode), true);
    assert.equal(discountQuote(reduced, { id: "private", code: "PRIVATE", label: "", enabled: true, kind: "percent", value: 10, startsAt: "", endsAt: "", packIds: [] }), null);
  }
  const cart = quote(discounted, { optionItems: [{ id: options[0].id, quantity: 2 }, { id: options[1].id, quantity: 1 }] })!;
  assert.equal(cart.totalPrice, discounted.options[0].price * 2 + discounted.options[1].price);
  assert.equal(cart.promoCode, LAUNCH_CODE);
});

test("promotions concurrentes : prix le plus bas sans remise successive", () => {
  const result = launchCatalog(catalog, active, [{ id: "sale", code: "SALE", label: "", mode: "sale", enabled: true, kind: "percent", value: 60, startsAt: "", endsAt: "", packIds: [], productKeys: ["formula:premier-look:base"] }]);
  const pack = result.packs.find((p) => p.id === "premier-look")!;
  assert.equal(pack.price, 15600);
  assert.equal(pack.normalPrice, 39000);
  assert.equal(hasLaunchOffer(pack.promotionCode), false);
});

test("devis : remise affichée tant que disponible, prix accepté ensuite figé", () => {
  const q = { totalPrice: 100001, launchPercent: 25, status: "propose" } as ProjectQuote;
  assert.equal(launchQuote(q, active).totalPrice, 75001);
  assert.equal(launchQuote(q, { ...active, remaining: 0 }).totalPrice, q.totalPrice);
  assert.equal(launchQuote({ ...q, status: "accepte" }, active).totalPrice, q.totalPrice);
});
