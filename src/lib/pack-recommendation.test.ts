import assert from "node:assert/strict";
import { test } from "node:test";
import { packs, options, defaultSettings } from "@/data/packs";
import { quote } from "./orders";
import { recommendPack } from "./pack-recommendation";

const identity = [{ id: "banniere", quantity: 1 }, { id: "avatar", quantity: 1 }];

test("Identité signature logo fourni : suggestion et paiement à 515 €", () => {
  const settings = { ...defaultSettings, logoDiscount: 15000 };
  const r = recommendPack(packs, options, [...identity, { id: "overlay-fixe-unite", quantity: 5 }], settings)!;
  assert.equal(r.price, 51500);
  const q = quote({ packs, options, settings }, { packId: r.pack.id, formulaId: r.formula?.id, hasLogo: true })!;
  assert.equal(q.totalPrice, 51500);
  assert.equal(q.amount, 51500);
  assert.equal(q.logoDiscount, 25000);
  const deposit = quote({ packs, options, settings }, { packId: r.pack.id, hasLogo: true, payment: "acompte" })!;
  assert.equal(deposit.amount, Math.round(51500 * settings.depositPercent / 100));
});

test("la suggestion logo fourni utilise les réglages et le même tarif que le paiement", () => {
  const settings = { ...defaultSettings, logoDiscount: 12300 };
  const r = recommendPack(packs, options, [...identity, { id: "overlay-fixe-unite", quantity: 2 }], settings)!;
  assert.equal(r.hasLogo, true);
  assert.equal(r.addsLogo, false);
  assert.equal(r.price, 26700);
  assert.equal(r.price, quote({ packs, options, settings }, { packId: r.pack.id, formulaId: r.formula?.id, hasLogo: r.hasLogo })?.totalPrice);
});

test("orienter une identité complète vers la formule adaptée sans inventer une économie", () => {
  const first = recommendPack(packs, options, [...identity, { id: "overlay-fixe-unite", quantity: 2 }])!;
  assert.equal(first.pack.id, "premier-look");
  assert.equal(first.price, 39000);
  assert.equal(first.addsLogo, true);
  assert.deepEqual(first.remaining, []);
  const signature = recommendPack(packs, options, [...identity, { id: "overlay-fixe-unite", quantity: 5 }, { id: "emotes-10", quantity: 1 }])!;
  assert.equal(signature.pack.id, "identite-signature");
  assert.equal(signature.formula?.id, "emotes");
  assert.equal(signature.price, 86500);
});

test("animation, quantités supplémentaires et options non incluses sont distinguées", () => {
  const animated = recommendPack(packs, options, [...identity, { id: "overlay-anime-unite", quantity: 5 }, { id: "emotes-10", quantity: 1 }])!;
  assert.equal(animated.formula?.id, "emotes-animations");
  const extra = recommendPack(packs, options, [...identity, { id: "overlay-fixe-unite", quantity: 6 }, { id: "alertes-fixes", quantity: 1 }, { id: "emote-animee", quantity: 1 }])!;
  assert.ok(extra.remaining.includes("1 overlays"));
  assert.ok(!extra.remaining.includes(options.find((o) => o.id === "alertes-fixes")!.name));
  assert.ok(extra.remaining.includes(options.find((o) => o.id === "emote-animee")!.name));
  const universe = recommendPack(packs, options, [...identity, { id: "overlay-anime-unite", quantity: 5 }, { id: "emotes-5", quantity: 3 }])!;
  assert.equal(universe.pack.id, "univers-complet");
  assert.equal(universe.pack.checkout, false);
});

test("pas de recommandation sur un asset isolé, un pack archivé ou une variante incompatible", () => {
  assert.equal(recommendPack(packs, options, [{ id: "emotes-10", quantity: 1 }]), null);
  assert.equal(recommendPack(packs, options, [...identity, { id: "overlay-anime-unite", quantity: 2 }]), null);
  assert.equal(recommendPack(packs.map((p) => ({ ...p, archived: true })), options, [...identity, { id: "overlay-fixe-unite", quantity: 2 }]), null);
});
