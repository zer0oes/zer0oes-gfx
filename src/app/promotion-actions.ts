"use server";
import { getStore } from "@/lib/store";
import { quote, discountQuote } from "@/lib/orders";
import { normalizeCode, validPromotion } from "@/lib/promotions";
import { getPublicCatalog } from "@/lib/public-catalog";
export async function previewPromotion(input: { code: string; packId: string; formulaId?: string; hasLogo: boolean; payment: string }) {
  const store = getStore();
  const code = normalizeCode(input.code).slice(0, 60);
  const q = quote(await getPublicCatalog(), input);
  if (!q || !code) return null;
  const p = (await store.listPromotions()).find((p) => p.code === code && validPromotion(p, q.packId));
  const discounted = p ? discountQuote(q, p) : null;
  return discounted ? { code, totalPrice: discounted.totalPrice, discount: discounted.promoDiscount ?? 0 } : null;
}
