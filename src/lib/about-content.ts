import { aboutDefaults } from "@/data/about-texts";
import { documentKey, type DocumentField } from "@/lib/editable-document";
import type { Locale } from "@/lib/i18n";

export function aboutFields(locale: Locale): DocumentField[] {
  return [{ key: "image.src", label: "Portrait", section: "En-tête et portrait", value: "/a-propos/aurore.webp", multiline: false, image: true }, ...Object.entries(aboutDefaults[locale]).map(([key, value]) => {
    const chapter = /^chapter\.(\d+)\.(title|text)$/.exec(key);
    const labels: Record<string, string> = { kicker: "Surtitre", "image.alt": "Description de l’image", "image.caption": "Légende de l’image", "cta.title": "Titre", "cta.text": "Texte", "cta.button": "Bouton de contact", "cta.link": "Lien vers le portfolio" };
    return {
      key, value,
      label: chapter ? chapter[2] === "title" ? "Titre" : "Texte" : labels[key] ?? key,
      section: chapter ? `Chapitre ${Number(chapter[1]) + 1} — ${aboutDefaults.fr[`chapter.${chapter[1]}.title` as keyof typeof aboutDefaults.fr]}` : key.startsWith("cta.") ? "Appel au contact" : "En-tête et portrait",
      multiline: chapter?.[2] === "text" || key === "cta.text",
    };
  })];
}

export function resolveAbout(raw: unknown, locale: Locale) {
  const stored = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  return { text(key: string) {
    if (key === "image.src") {
      const image = stored[documentKey("a-propos", "fr", key)];
      return typeof image === "string" && image.trim() ? image : "/a-propos/aurore.webp";
    }
    const value = stored[documentKey("a-propos", locale, key)];
    return typeof value === "string" && value.trim() ? value : aboutDefaults[locale][key as keyof typeof aboutDefaults.fr] ?? "";
  } };
}
