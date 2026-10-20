import { optionCategory, type Catalog } from "@/lib/pricing";
import { defaultCategories } from "@/lib/product-categories";

export const bannerPages = [
  { path: "/", label: "Accueil" }, { path: "/offres", label: "Offres" },
  { path: "/portfolio", label: "Portfolio et projets" }, { path: "/a-propos", label: "À propos" },
  { path: "/contact", label: "Contact" }, { path: "/mentions-legales", label: "Mentions légales" },
  { path: "/confidentialite", label: "Confidentialité" }, { path: "/cgv", label: "CGV" },
] as const;

// Bandeau sous le menu. text / textEn : la phrase ; badge : la pastille ; conditions : la note en petit dessous ;
// remainingText : compteur de places de l'offre de lancement ({count}). Tout le bandeau est le lien.
// carousel : tourne avec les autres bandeaux du carrousel (sinon affiché fixe). links : offres liées ("launch" = offre de
// lancement, sinon l'id d'une remise), affiché pendant l'une d'elles ; aucune : ses propres dates. linkedTo : ancienne forme (une offre).
// code, linkLabel, linkLabelEn, tone : anciens bandeaux, conservés mais plus affichés.
export type Banner = {
  id: string; enabled: boolean; text: string; textEn: string; code: string;
  link: string; linkLabel: string; linkLabelEn: string; pages: string[];
  startsAt: string; endsAt: string; tone: "violet" | "pink" | "teal";
  badge?: string; badgeEn?: string; conditions?: string; conditionsEn?: string;
  remainingText?: string; remainingTextEn?: string;
  carousel?: boolean; links?: string[]; linkedTo?: string; position?: number;
};
export type Promotion = {
  mode?: "code" | "sale";
  // Prix promotionnels publics : un pourcentage par produit (productRates), ou anciennes formes
  // (un seul pourcentage pour productKeys, ou des prix figés salePrices)
  productRates?: Record<string, number>;
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
export function pagesMatch(pages: string[], path: string) {
  return pages.some((page) => page === "*" || page === path || (page === "/portfolio" && path.startsWith("/portfolio/")));
}
export function bannerMatches(banner: Banner, path: string, now = Date.now()) {
  return activePeriod(banner, now) && pagesMatch(banner.pages, path);
}
export const LAUNCH_LINK = "launch";
// Ordre du carrousel : position choisie dans l'admin, puis texte
export function sortBanners(banners: Banner[]) {
  return [...banners].sort((a, b) => (a.position ?? 999) - (b.position ?? 999) || a.text.localeCompare(b.text));
}
export const bannerLinks = (banner: Pick<Banner, "links" | "linkedTo">) => banner.links ?? (banner.linkedTo ? [banner.linkedTo] : []);
// Bandeau lié uniquement à l'offre de lancement : le carrousel suit lui-même sa date et ses places
export const launchOnlyBanner = (banner: Banner) => { const links = bannerLinks(banner); return links.length > 0 && links.every((l) => l === LAUNCH_LINK); };
// Affiché pendant l'une de ses offres liées (une remise supprimée ou désactivée ne compte plus), sinon à ses propres dates.
// launch.enabled suffit pour un bandeau lié seulement au lancement ; lié aussi à une remise, il faut l'offre réellement en cours.
export function bannerScheduled(banner: Banner, promotions: Promotion[], launch: { enabled: boolean; active: boolean } = { enabled: false, active: false }, now = Date.now()) {
  if (!banner.enabled) return false;
  const links = bannerLinks(banner);
  if (!links.length) return activePeriod(banner, now);
  if (launchOnlyBanner(banner)) return launch.enabled;
  return links.some((link) => {
    if (link === LAUNCH_LINK) return launch.active;
    const promotion = promotions.find((p) => p.id === link);
    return !!promotion && activePeriod(promotion, now);
  });
}
// Une seule réduction promotionnelle, appliquée après la remise pour logo fourni.
export function discountedPrice(price: number, promotion: Pick<Promotion, "kind" | "value">) {
  const discount = promotion.kind === "percent" ? Math.round(price * promotion.value / 100) : promotion.value;
  return Math.max(0, price - discount);
}
export function validPromotion(promotion: Promotion, packId: string, now = Date.now()) {
  return promotion.mode !== "sale" && activePeriod(promotion, now) && (!promotion.packIds.length || promotion.packIds.includes(packId));
}

// Produits remisables, avec leur groupe (pack, ou catégorie des créations à la carte) pour les raccourcis de l'admin
export type PromotionProduct = { key: string; name: string; price: number; group: { id: string; label: string }; kind: "pack" | "option" };
export function promotionProducts(catalog: Catalog): PromotionProduct[] {
  return [
    ...catalog.packs.filter((p) => !p.archived).flatMap((p) => (p.formulas?.length
      ? p.formulas.map((f, i) => ({ key: `formula:${p.id}:${f.id}`, name: i === 0 ? p.name : `${p.name} — ${f.label}`, price: f.price }))
      : [{ key: `pack:${p.id}`, name: p.name, price: p.price }]).map((x) => ({ ...x, kind: "pack" as const, group: { id: `pack:${p.id}`, label: p.name } }))),
    ...catalog.options.map((o) => {
      const id = optionCategory(o);
      const label = (catalog.categories ?? defaultCategories).find((c) => c.id === id)?.name ?? "À la carte";
      return { key: `option:${o.id}`, name: `À la carte · ${o.name}`, price: o.price, kind: "option" as const, group: { id: `category:${id}`, label } };
    }),
  ];
}
export const MAX_RATE = 80;
// Un pourcentage par produit coché (champs products et rate:<clé>) ; chaque prix remisé garde au moins 0,50 €.
export function parseProductRates(form: FormData, products: PromotionProduct[], max = MAX_RATE): Record<string, number> {
  const selected = [...new Set(form.getAll("products").map(String))];
  if (!selected.length) throw new Error("Sélectionne au moins un produit.");
  return Object.fromEntries(selected.map((key) => {
    const product = products.find((p) => p.key === key);
    if (!product) throw new Error("Un produit sélectionné n’existe plus.");
    const raw = String(form.get(`rate:${key}`) ?? "").replace(",", ".").trim();
    const rate = /^\d+(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;
    if (!(rate > 0 && rate <= max)) throw new Error(`${product.name} : indique une remise entre 0,01 et ${max} %.`);
    const cents = discountedPrice(product.price, { kind: "percent", value: rate });
    if (cents < 50 || cents >= product.price) throw new Error(`${product.name} : ce pourcentage doit réduire le prix, en laissant au moins 0,50 €.`);
    return [key, rate];
  }));
}
// Pourcentages d'une remise publique par produit, quelle que soit sa forme d'enregistrement
export function promotionRates(promotion: Promotion, products: PromotionProduct[]): Record<string, number> {
  if (promotion.productRates) return promotion.productRates;
  if (promotion.productKeys) return Object.fromEntries(promotion.productKeys.map((key) => [key, promotion.value]));
  return Object.fromEntries(Object.entries(promotion.salePrices ?? {}).flatMap(([key, cents]) => {
    const product = products.find((p) => p.key === key);
    return product && product.price > 0 ? [[key, Math.round((1 - cents / product.price) * 10000) / 100]] : [];
  }));
}

// Seules les promotions publiques modifient le catalogue ; les codes privés restent privés.
// Plusieurs promotions actives : retenir le prix le plus bas, sans cumul.
export function saleCatalog(catalog: Catalog, promotions: Promotion[], now = Date.now()): Catalog {
  const sales = promotions.filter((p) => p.mode === "sale" && activePeriod(p, now));
  function apply<T extends { price: number }>(item: T, key: string): T & { normalPrice?: number; promotionCode?: string } {
    let price = item.price, code: string | undefined;
    for (const sale of sales) {
      const rate = sale.productRates?.[key];
      const offered = sale.productRates
        ? rate !== undefined && rate > 0 && rate <= MAX_RATE ? discountedPrice(item.price, { kind: "percent", value: rate }) : undefined
        : sale.productKeys
        ? sale.productKeys.includes(key) && sale.kind === "percent" && sale.value > 0 && sale.value <= MAX_RATE
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
