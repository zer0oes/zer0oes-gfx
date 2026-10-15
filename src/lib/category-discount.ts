export type CategoryDiscount = { percent: number; upTo: boolean };

// Le catalogue public contient uniquement les promotions actuellement applicables.
export function categoryDiscount(items: { price: number; normalPrice?: number; promotionCode?: string }[]): CategoryDiscount | null {
  const rates = items.map((item) => item.promotionCode && item.normalPrice && item.normalPrice > item.price
    ? Math.round((item.normalPrice - item.price) / item.normalPrice * 10_000) / 100
    : 0);
  const percent = Math.max(0, ...rates);
  return percent > 0 ? { percent, upTo: rates.some((rate) => rate !== percent) } : null;
}
