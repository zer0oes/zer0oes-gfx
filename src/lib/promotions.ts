import type { Catalog } from "@/lib/pricing";

export const bannerPages = [
  { path: "/", label: "Accueil" }, { path: "/offres", label: "Offres" },
  { path: "/portfolio", label: "Portfolio et projets" }, { path: "/a-propos", label: "À propos" },
  { path: "/contact", label: "Contact" }, { path: "/mentions-legales", label: "Mentions légales" },
  { path: "/confidentialite", label: "Confidentialité" }, { path: "/cgv", label: "CGV" },
] as const;

export type Banner = {
  id: string; enabled: boolean; text: string; textEn: string; code: string;
  link: string; linkLabel: string; linkLabelEn: string; pages: string[];
  startsAt: string; endsAt: string; tone: "violet" | "pink" | "teal";
};
export type Promotion = {
  mode?: "code" | "sale";
  salePrices?: Record<string, number>;
  productKeys?: string[];
  id: string; enabled: boolean; code: string; label: string;
  kind: "percent" | "fixed"; value: number; startsAt: string; endsAt: string;
  packIds: string[];
};
export const normalizeCode = (code: string) => code.trim().toUpperCase();
export type AffiliateLink = { id: string; name: string; url: string; notes: string };
export function activePeriod(item: { enabled: boolean; startsAt: string; endsAt: string }, now = Date.now()) {
  return item.enabled && (!item.startsAt || Date.parse(item.startsAt) <= now) && (!item.endsAt || Date.parse(item.endsAt) > now);
}
export function bannerMatches(banner: Banner, path: string, now = Date.now()) {
  return activePeriod(banner, now) && banner.pages.some((page) => page === "*" || page === path || (page === "/portfolio" && path.startsWith("/portfolio/")));
}
// Une seule réduction promotionnelle, appliquée après la remise pour logo fourni.
export function discountedPrice(price: number, promotion: Pick<Promotion, "kind" | "value">) {
  const discount = promotion.kind === "percent" ? Math.round(price * promotion.value / 100) : promotion.value;
  return Math.max(0, price - discount);
}
export function validPromotion(promotion: Promotion, packId: string, now = Date.now()) {
  return promotion.mode !== "sale" && activePeriod(promotion, now) && (!promotion.packIds.length || promotion.packIds.includes(packId));
}

export function promotionProducts(catalog: Catalog) {
  return [
    ...catalog.packs.filter((p) => !p.archived).flatMap((p) => p.formulas?.length
      ? p.formulas.map((f, i) => ({ key: `formula:${p.id}:${f.id}`, name: i === 0 ? p.name : `${p.name} — ${f.label}`, price: f.price }))
      : [{ key: `pack:${p.id}`, name: p.name, price: p.price }]),
    ...catalog.options.map((o) => ({ key: `option:${o.id}`, name: `À la carte · ${o.name}`, price: o.price })),
  ];
}

export function parseSalePrices(form: FormData, catalog: Catalog, percent: number): Record<string, number> {
  if (!Number.isFinite(percent) || percent <= 0 || percent > 80) throw new Error("Indique une remise entre 0,01 et 80 %.");
  const products = promotionProducts(catalog);
  const selected = [...new Set(form.getAll("products").map(String))];
  if (!selected.length) throw new Error("Sélectionne au moins un produit pour la promotion.");
  return Object.fromEntries(selected.map((key) => {
    const product = products.find((p) => p.key === key);
    if (!product) throw new Error("Un produit sélectionné n’existe plus.");
    const cents = discountedPrice(product.price, { kind: "percent", value: percent });
    if (!Number.isSafeInteger(cents) || cents < 50 || cents >= product.price) throw new Error(`${product.name} : ce pourcentage doit réduire le prix, en laissant au moins 0,50 €.`);
    return [key, cents];
  }));
}

// Seules les promotions publiques modifient le catalogue ; les codes privés restent privés.
// Plusieurs promotions actives : retenir le prix le plus bas, sans cumul.
export function saleCatalog(catalog: Catalog, promotions: Promotion[], now = Date.now()): Catalog {
  const sales = promotions.filter((p) => p.mode === "sale" && activePeriod(p, now));
  function apply<T extends { price: number }>(item: T, key: string): T & { normalPrice?: number; promotionCode?: string } {
    let price = item.price, code: string | undefined;
    for (const sale of sales) {
      const offered = sale.productKeys
        ? sale.productKeys.includes(key) && sale.kind === "percent" && sale.value > 0 && sale.value <= 80
          ? discountedPrice(item.price, sale) : undefined
        : sale.salePrices?.[key];
      if (offered !== undefined && Number.isSafeInteger(offered) && offered >= 50 && offered < price) {
        price = offered; code = sale.code;
      }
    }
    return code ? { ...item, price, normalPrice: item.price, promotionCode: code } : { ...item };
  }
  return {
    ...catalog,
    packs: catalog.packs.map((p) => {
      const formulas = p.formulas?.map((f) => apply(f, `formula:${p.id}:${f.id}`));
      const pack = apply(p, `pack:${p.id}`);
      const base = formulas?.[0];
      return base?.promotionCode ? { ...pack, formulas, price: base.price, normalPrice: base.normalPrice, promotionCode: base.promotionCode } : { ...pack, formulas };
    }),
    options: catalog.options.map((o) => apply(o, `option:${o.id}`)),
  };
}
export function safeBannerLink(link: string) {
  if (!link) return true;
  if (link.startsWith("/") && !link.startsWith("//") && !/[\\\s]/.test(link)) return true;
  try { return new URL(link).protocol === "https:"; } catch { return false; }
}
