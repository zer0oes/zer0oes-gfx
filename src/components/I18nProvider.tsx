"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect } from "react";
import { LOCALE_COOKIE, defaultLocale, href, splitLocale, type Locale } from "@/lib/i18n";

// Langue de la page, pour les composants côté navigateur (formulaires, menu…)
const LocaleContext = createContext<Locale>(defaultLocale);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // La balise <html> est commune à tout le site : sa langue suit la page affichée
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

// Lien vers une page dans la langue courante : useHref()("/offres") → "/en/offres" en anglais
export function useHref() {
  const locale = useLocale();
  return (path: string) => href(locale, path);
}

function rememberLocale(l: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

// Sélecteur FR / EN : même page dans l'autre langue, choix mémorisé (cookie de préférence, 1 an)
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const { path } = splitLocale(pathname);
  return (
    <div className={`inline-flex rounded-full border border-border p-0.5 text-xs font-semibold ${className}`} role="group" aria-label={locale === "en" ? "Language" : "Langue"}>
      {(["fr", "en"] as const).map((l) => (
        <a
          key={l}
          href={href(l, path)}
          hrefLang={l}
          lang={l}
          onClick={() => rememberLocale(l)}
          aria-current={l === locale ? "true" : undefined}
          aria-label={l === "fr" ? "Français" : "English"}
          className={`rounded-full px-2.5 py-1 uppercase transition ${l === locale ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
        >
          {l}
        </a>
      ))}
    </div>
  );
}
