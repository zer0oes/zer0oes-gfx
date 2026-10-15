import assert from "node:assert/strict";
import { test } from "node:test";
import { categoryDiscount } from "./category-discount";

test("pastilles : aucun taux sans promotion applicable", () => {
  assert.equal(categoryDiscount([]), null);
  assert.equal(categoryDiscount([{ price: 7500 }]), null);
  assert.equal(categoryDiscount([{ price: 7500, normalPrice: 10000 }]), null);
});
test("pastilles : taux réels du catalogue, uniformes ou partiels", () => {
  const item = { price: 6300, normalPrice: 10000, promotionCode: "ACTIVE" };
  assert.deepEqual(categoryDiscount([item, item]), { percent: 37, upTo: false });
  assert.deepEqual(categoryDiscount([item, { price: 10000 }]), { percent: 37, upTo: true });
  assert.deepEqual(categoryDiscount([item, { ...item, price: 8900 }]), { percent: 37, upTo: true });
});
