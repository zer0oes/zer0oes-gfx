// Magasin JSON de développement : transforme les deux diapos de l'ancien carrousel en bandeaux,
// comme la migration 20261016000400_carousel_banners.sql. Ne remplace jamais un bandeau existant.
import { localStore } from "../src/lib/store/local";
import type { Banner } from "../src/lib/promotions";
import fs from "node:fs/promises";

type Copy = { badge?: string; title: string; conditions?: string; remainingText?: string; buttonHref?: string };
type Slide = { id: "launch" | "audit"; enabled: boolean; schedule?: { followLaunch: boolean; startsAt: string; endsAt: string }; content: { fr: Copy; en: Copy } };
const file = new URL("../.data/dev-store.json", import.meta.url);
const raw = JSON.parse(await fs.readFile(file, "utf8").catch(() => "{}")) as { carouselSlides?: Slide[] };
const ids = { launch: "b5d3a6e0-0000-4000-8000-000000000001", audit: "b5d3a6e0-0000-4000-8000-000000000002" };
const existing = new Set((await localStore.listBanners()).map((b) => b.id));
const split = (slide: Slide, copy: Copy) => {
  const cut = slide.id === "launch" ? copy.title.indexOf(":") : -1;
  return { badge: copy.badge ?? (cut > 0 ? copy.title.slice(0, cut).trim() : ""), title: cut > 0 ? copy.title.slice(cut + 1).trim() : copy.title };
};
let added = 0;
for (const [position, slide] of (raw.carouselSlides ?? []).entries()) {
  const id = ids[slide.id];
  if (!id || existing.has(id)) continue;
  const fr = split(slide, slide.content.fr), en = split(slide, slide.content.en);
  const banner: Banner = { id, enabled: slide.enabled, carousel: true, position, pages: ["*"], tone: "violet", code: "", linkLabel: "", linkLabelEn: "",
    linkedTo: slide.id === "launch" || slide.schedule?.followLaunch !== false ? "launch" : "", startsAt: slide.schedule?.startsAt ?? "", endsAt: slide.schedule?.endsAt ?? "",
    link: slide.content.fr.buttonHref || "/", badge: fr.badge, text: fr.title, conditions: slide.content.fr.conditions ?? "", remainingText: slide.content.fr.remainingText ?? "",
    badgeEn: en.badge, textEn: en.title, conditionsEn: slide.content.en.conditions ?? "", remainingTextEn: slide.content.en.remainingText ?? "" };
  await localStore.saveBanner(banner);
  added++;
}
console.log(added ? `${added} bandeau(x) ajouté(s) depuis l'ancien carrousel.` : "Aucun bandeau à ajouter.");
