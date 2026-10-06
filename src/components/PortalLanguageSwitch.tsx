"use client";

import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

// Sélecteur FR / EN de l'espace client (adresse sans préfixe de langue) : mémorise le choix
// puis recharge la page dans la langue choisie.
function choose(l: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}

export function PortalLanguageSwitch({ locale }: { locale: Locale }) {
  return (
    <div className="inline-flex rounded-full border border-border p-0.5 text-xs font-semibold" role="group" aria-label={locale === "en" ? "Language" : "Langue"}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          onClick={() => l !== locale && choose(l)}
          aria-pressed={l === locale}
          aria-label={l === "fr" ? "Français" : "English"}
          className={`rounded-full px-2.5 py-1 uppercase transition ${l === locale ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
