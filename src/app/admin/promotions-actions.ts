"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bannerPages, LAUNCH_LINK, normalizeCode, parseSalePrices, safeBannerLink, type Banner, type Promotion } from "@/lib/promotions";
import { getStore } from "@/lib/store";
import { parseParisSchedule } from "@/lib/launch-schedule";
import { LAUNCH_CODE } from "@/lib/launch-offer";

export async function saveLaunchOfferAction(f: FormData) {
  await requireAdmin();
  try {
    const enabled = f.get("enabled") === "on";
    const day = text(f, "launchDay", 10);
    const startsAt = day ? parseParisSchedule(day, text(f, "launchTime", 5)) : "";
    if (enabled && !startsAt) throw new Error("Choisis la date de début avant d’activer l’offre.");
    await getStore().saveLaunchSettings({ enabled, startsAt });
  } catch (e) { finish(e instanceof Error ? e.message : "Programmation impossible.", "remises", "lancement"); }
  finish(undefined, "remises");
}

const text = (f: FormData, k: string, max = 300) => (f.get(k)?.toString() ?? "").trim().slice(0, max);
// Retour à l'onglet, avec le panneau de l'élément rouvert (open) pour afficher le message
function finish(error: string | undefined, tab: "remises" | "bandeaux", open = ""): never {
  revalidatePath("/", "layout");
  const panel = open ? `&ouvrir=${encodeURIComponent(open)}` : "";
  redirect(`/admin/offres?onglet=${tab}${panel}&${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
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
const copyFields = { badge: 80, text: 600, conditions: 400, remainingText: 150 } as const;
export async function saveBannerAction(f: FormData) {
  await requireAdmin();
  try {
    const store = getStore();
    const bannerId = id(f);
    const banners = await store.listBanners();
    const existing = banners.find((b) => b.id === bannerId);
    const pages = f.getAll("pages").map(String).filter((p) => p === "*" || bannerPages.some((x) => x.path === p));
    const link = text(f, "link", 500);
    const linkedTo = text(f, "linkedTo", 40);
    // La liste des remises n'est relue que pour un bandeau lié à une remise
    if (linkedTo && linkedTo !== LAUNCH_LINK && !(await store.listPromotions()).some((p) => p.id === linkedTo)) throw new Error("Remise liée introuvable.");
    const copy = Object.fromEntries(Object.entries(copyFields).flatMap(([field, max]) => [[field, text(f, field, max)], [`${field}En`, text(f, `${field}En`, max)]])) as Record<string, string>;
    if (!copy.text) throw new Error("Écris la phrase du bandeau.");
    if (!pages.length) throw new Error("Choisis au moins une page.");
    if (!link || !safeBannerLink(link)) throw new Error("Utilise un lien interne (/offres) ou une adresse HTTPS.");
    if (Object.values(copy).some((t) => /\bHT\b/i.test(t))) throw new Error("La mention HT ne doit pas apparaître dans les bandeaux.");
    if ([copy.remainingText, copy.remainingTextEn].some((t) => t && !t.includes("{count}"))) throw new Error("Le compteur doit utiliser {count}, remplacé par les vraies places restantes.");
    const banner: Banner = {
      ...(existing ?? { code: "", linkLabel: "", linkLabelEn: "", tone: "violet" as const }),
      id: bannerId, enabled: f.get("enabled") === "on", carousel: f.get("carousel") === "on", linkedTo, link, pages,
      badge: copy.badge, badgeEn: copy.badgeEn, text: copy.text, textEn: copy.textEn, conditions: copy.conditions, conditionsEn: copy.conditionsEn,
      remainingText: linkedTo === LAUNCH_LINK ? copy.remainingText : "", remainingTextEn: linkedTo === LAUNCH_LINK ? copy.remainingTextEn : "",
      position: existing?.position ?? Math.max(-1, ...banners.map((b) => b.position ?? -1)) + 1,
      ...(linkedTo ? { startsAt: "", endsAt: "" } : period(f)),
    };
    await store.saveBanner(banner);
  } catch (e) { finish(e instanceof Error ? e.message : "Enregistrement impossible.", "bandeaux", text(f, "id", 40) || "nouveau"); }
  finish(undefined, "bandeaux");
}
// Ordre du carrousel (glisser-déposer dans le tableau des bandeaux)
export async function reorderBannersAction(ids: string[]) {
  await requireAdmin();
  const store = getStore();
  const banners = await store.listBanners();
  await Promise.all(banners.flatMap((banner) => {
    const position = ids.indexOf(banner.id);
    return position >= 0 && banner.position !== position ? [store.saveBanner({ ...banner, position })] : [];
  }));
  revalidatePath("/", "layout");
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
    if (code === LAUNCH_CODE) throw new Error("Ce code est réservé à l’offre de lancement.");
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
  } catch (e) { finish(e instanceof Error ? e.message : "Enregistrement impossible.", "remises", text(f, "id", 40) || "nouvelle"); }
  finish(undefined, "remises");
}
export async function deleteMarketingAction(f: FormData) {
  await requireAdmin();
  try {
    if (f.get("confirm") !== "on") throw new Error("Confirme la suppression.");
    if (f.get("kind") === "banner") await getStore().deleteBanner(id(f));
    else await getStore().deletePromotion(id(f));
  } catch (e) { finish(e instanceof Error ? e.message : "Suppression impossible.", f.get("kind") === "banner" ? "bandeaux" : "remises"); }
  finish(undefined, f.get("kind") === "banner" ? "bandeaux" : "remises");
}
