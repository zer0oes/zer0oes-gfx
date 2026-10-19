import { launchOnlyBanner, type Banner } from "./promotions";
import { href, type Locale } from "./i18n";

// Diapo affichée sous le menu, construite depuis un bandeau (textes déjà choisis par langue).
export type SlideCopy = { badge: string; title: string; conditions: string; remainingText: string; href: string };
export type AnnouncementSlide = { id: string; launch: boolean; pages: string[]; content: Record<Locale, SlideCopy> };

export function slideHref(locale: Locale, link: string) {
  return !link.startsWith("/") || /^\/(?:fr|en)(?:\/|\?|$)/.test(link) ? link : href(locale, link);
}
// Un texte anglais vide reprend le français, comme ailleurs sur le site.
export function bannerSlide(b: Banner): AnnouncementSlide {
  const fr: SlideCopy = { badge: b.badge ?? "", title: b.text, conditions: b.conditions ?? "", remainingText: b.remainingText ?? "", href: b.link || "/" };
  const en: SlideCopy = { badge: b.badgeEn || fr.badge, title: b.textEn || fr.title, conditions: b.conditionsEn || fr.conditions, remainingText: b.remainingTextEn || fr.remainingText, href: fr.href };
  return { id: b.id, launch: launchOnlyBanner(b), pages: b.pages, content: { fr, en } };
}
export function remainingPlacesText(template: string, count: number | null) {
  return count !== null && Number.isSafeInteger(count) && count >= 0 && template.includes("{count}") ? template.replaceAll("{count}", String(count)) : "";
}
export function headlineParts(title: string) {
  return title.split(/([−-]?\d+(?:[.,]\d+)?\s?%)/g).filter(Boolean).map((text) => ({ text, highlight: /^[−-]?\d+(?:[.,]\d+)?\s?%$/.test(text) }));
}
