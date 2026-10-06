import type { Metadata } from "next";
import { site } from "@/data/site";
import { href, type Locale } from "@/lib/i18n";

// Adresses de la page dans les deux langues (balises hreflang), pour que Google relie les versions
export function languageAlternates(locale: Locale, path: string): Metadata["alternates"] {
  return {
    canonical: href(locale, path),
    languages: { fr: href("fr", path), en: href("en", path), "x-default": href("fr", path) },
  };
}

// Métadonnées d'une page : titre et description dans la langue, versions FR / EN liées
export function pageMetadata(locale: Locale, path: string, texts: Record<Locale, { title?: string; description: string }>): Metadata {
  const { title, description } = texts[locale];
  return {
    ...(title ? { title } : {}),
    description,
    alternates: languageAlternates(locale, path),
    openGraph: { siteName: site.name, locale: locale === "en" ? "en_GB" : "fr_FR", type: "website", ...(title ? { title } : {}), description },
  };
}
