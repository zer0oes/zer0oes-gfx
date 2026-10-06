// Langues du site public : le français (adresses sans préfixe, ex. /offres) et l'anglais (/en/offres).
// Les pages vivent sous app/(site)/[lang] ; le proxy réécrit /offres en /fr/offres sans changer l'adresse.

export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

// Cookie de préférence (choix fait avec le sélecteur FR / EN) : cookie fonctionnel, sans consentement
export const LOCALE_COOKIE = "zgfx_lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (locales as readonly string[]).includes(v);
}

export function asLocale(v: unknown): Locale {
  return isLocale(v) ? v : defaultLocale;
}

// Adresse d'une page dans une langue : href("en", "/offres") → "/en/offres", href("fr", "/") → "/"
export function href(locale: Locale, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

// Adresse sans préfixe de langue : "/en/offres?x=1" → { locale: "en", path: "/offres?x=1" }
export function splitLocale(path: string): { locale: Locale; path: string } {
  const m = path.match(/^\/(en|fr)(?=\/|\?|$)/);
  if (!m) return { locale: defaultLocale, path: path || "/" };
  const rest = path.slice(m[0].length);
  return { locale: m[1] as Locale, path: rest.startsWith("/") ? rest : `/${rest}` };
}

// Langue préférée d'après l'en-tête Accept-Language : français si le français vient avant
// l'anglais (ou si aucune langue n'est donnée, ex. robots), anglais sinon.
export function preferredLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;
  const langs = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag, q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((l) => l.tag && l.q > 0)
    .sort((a, b) => b.q - a.q);
  if (!langs.length || langs[0].tag === "*") return defaultLocale;
  return langs[0].tag.startsWith("fr") ? "fr" : "en";
}

// Texte selon la langue, pour les petits libellés colocalisés : t(lang, { fr: "…", en: "…" })
export function t<T>(locale: Locale, texts: Record<Locale, T>): T {
  return texts[locale];
}

// Formats de nombres et de dates
export const intlLocale = (locale: Locale) => (locale === "en" ? "en-GB" : "fr-FR");
