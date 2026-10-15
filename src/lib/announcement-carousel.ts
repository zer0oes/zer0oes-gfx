import { safeBannerLink } from "./promotions";
import { href, type Locale } from "./i18n";

export type SlideCopy = { badge?: string; title: string; conditions: string; remainingText: string; buttonLabel: string; buttonHref: string };
export type AnnouncementSlide = { id: "launch" | "audit"; enabled: boolean; content: Record<Locale, SlideCopy> };
export function slideHref(locale: Locale, link: string) {
  return !link.startsWith("/") || /^\/(?:fr|en)(?:\/|\?|$)/.test(link) ? link : href(locale, link);
}
export function parseCarouselSlides(input: unknown): AnnouncementSlide[] {
  if (!Array.isArray(input) || input.length !== 2 || new Set(input.map((s) => s?.id)).size !== 2) throw new Error("Conserve les deux diapos, dans l’ordre souhaité.");
  return input.map((s) => {
    if (!s || !["launch", "audit"].includes(s.id) || typeof s.enabled !== "boolean") throw new Error("Diapo invalide.");
    const content = {} as Record<Locale, SlideCopy>;
    for (const locale of ["fr", "en"] as const) {
      const raw = s.content?.[locale];
      const copy = {} as SlideCopy;
      for (const [field, max] of Object.entries({ title: 600, conditions: 400, remainingText: 150, buttonLabel: 80, buttonHref: 500 })) {
        if (typeof raw?.[field] !== "string" || raw[field].length > max) throw new Error(`Champ ${field} invalide (${locale}).`);
        copy[field as keyof SlideCopy] = raw[field].trim();
      }
      if (raw?.badge !== undefined && (typeof raw.badge !== "string" || raw.badge.length > 80)) throw new Error(`Champ pastille invalide (${locale}).`);
      if (raw?.badge !== undefined) copy.badge = raw.badge.trim();
      if (!copy.title || !copy.buttonLabel || !copy.buttonHref || !safeBannerLink(copy.buttonHref)) throw new Error(`Renseigne le titre, le bouton et un lien interne ou HTTPS (${locale}).`);
      if (Object.values(copy).some((text) => /\bHT\b/i.test(text))) throw new Error("La mention HT ne doit pas apparaître dans les diapos.");
      if (s.id === "launch" && copy.remainingText && !copy.remainingText.includes("{count}")) throw new Error("Le compteur doit utiliser {count}, remplacé par les vraies commandes.");
      content[locale] = copy;
    }
    return { id: s.id, enabled: s.enabled, content };
  });
}
export function remainingPlacesText(template: string, count: number | null) {
  return count !== null && Number.isSafeInteger(count) && count >= 0 && template.includes("{count}") ? template.replaceAll("{count}", String(count)) : "";
}
export function headlineParts(title: string) {
  return title.split(/([−-]?\d+(?:[.,]\d+)?\s?%)/g).filter(Boolean).map((text) => ({ text, highlight: /^[−-]?\d+(?:[.,]\d+)?\s?%$/.test(text) }));
}
