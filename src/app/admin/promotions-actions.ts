"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bannerPages, normalizeCode, parseSalePrices, safeBannerLink, type Banner, type Promotion } from "@/lib/promotions";
import { getStore } from "@/lib/store";

const text = (f: FormData, k: string, max = 300) => (f.get(k)?.toString() ?? "").trim().slice(0, max);
function finish(error?: string): never {
  revalidatePath("/", "layout");
  redirect(`/admin/offres?onglet=promotions&${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
}
function period(f: FormData) {
  const startsAt = text(f, "startsAt"), endsAt = text(f, "endsAt");
  if ([startsAt, endsAt].some((d) => d && !Number.isFinite(Date.parse(d)))) throw new Error("Date invalide.");
  if (startsAt && endsAt && Date.parse(endsAt) <= Date.parse(startsAt)) throw new Error("La fin doit être après le début.");
  return { startsAt: startsAt ? new Date(startsAt).toISOString() : "", endsAt: endsAt ? new Date(endsAt).toISOString() : "" };
}
const id = (f: FormData) => {
  const value = text(f, "id", 40);
  if (value && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new Error("Identifiant invalide.");
  return value || randomUUID();
};
export async function saveBannerAction(f: FormData) {
  await requireAdmin();
  try {
    const pages = f.getAll("pages").map(String).filter((p) => p === "*" || bannerPages.some((x) => x.path === p));
    const message = text(f, "text"), link = text(f, "link", 500);
    if (!message || !pages.length) throw new Error("Renseigne un message et au moins une page.");
    if (!safeBannerLink(link)) throw new Error("Utilise un lien interne (/offres) ou une adresse HTTPS.");
    const tone = text(f, "tone");
    const banner: Banner = { id: id(f), enabled: f.get("enabled") === "on", text: message, textEn: text(f, "textEn"), code: normalizeCode(text(f, "code", 60)), link,
      linkLabel: text(f, "linkLabel", 80), linkLabelEn: text(f, "linkLabelEn", 80), pages, tone: tone === "pink" || tone === "teal" ? tone : "violet", ...period(f) };
    await getStore().saveBanner(banner);
  } catch (e) { finish(e instanceof Error ? e.message : "Enregistrement impossible."); }
  finish();
}
export async function savePromotionAction(f: FormData) {
  await requireAdmin();
  try {
    const store = getStore();
    const promotionId = id(f);
    const mode = f.get("mode") === "sale" ? "sale" : "code";
    const existing = (await store.listPromotions()).find((p) => p.id === promotionId);
    const code = (mode === "sale" ? existing?.code : normalizeCode(text(f, "code", 60))) || `${mode === "sale" ? "PROMO" : "FIDELITE"}-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
    if (!/^[A-Z0-9_-]{4,60}$/.test(code)) throw new Error("Code : 4 à 60 lettres, chiffres, tirets ou underscores.");
    if ((await store.listPromotions()).some((p) => p.id !== promotionId && p.code === code)) throw new Error("Ce code existe déjà.");
    const kind = mode === "sale" ? "percent" : text(f, "kind") === "fixed" ? "fixed" : "percent";
    const raw = text(f, "value").replace(",", ".");
    const number = /^\d+(\.\d{1,2})?$/.test(raw) ? Number(raw) : NaN;
    if (!Number.isFinite(number) || number <= 0 || number > 1_000_000 || (kind === "percent" && number > 80)) throw new Error("Remise invalide : pourcentage entre 0,01 et 80 %, ou montant positif jusqu’à 1 000 000 €.");
    const catalog = await store.getCatalog();
    const salePrices = mode === "sale" ? parseSalePrices(f, catalog, number) : undefined;
    const promotion: Promotion = { id: promotionId, mode, salePrices, productKeys: salePrices ? Object.keys(salePrices) : undefined, enabled: f.get("enabled") === "on", code, label: text(f, "label", 120), kind,
      value: kind === "fixed" ? Math.round(number * 100) : number,
      packIds: f.getAll("packIds").map(String).filter((p) => catalog.packs.some((x) => x.id === p && x.checkout)), ...period(f) };
    await store.savePromotion(promotion);
  } catch (e) { finish(e instanceof Error ? e.message : "Enregistrement impossible."); }
  finish();
}
export async function deleteMarketingAction(f: FormData) {
  await requireAdmin();
  try {
    if (f.get("confirm") !== "on") throw new Error("Confirme la suppression.");
    if (f.get("kind") === "banner") await getStore().deleteBanner(id(f));
    else await getStore().deletePromotion(id(f));
  } catch (e) { finish(e instanceof Error ? e.message : "Suppression impossible."); }
  finish();
}
