"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { t, type Locale } from "@/lib/i18n";

export function OfferTabs({ packs, options, locale }: { packs: ReactNode; options: ReactNode; locale: Locale }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = [t(locale, { fr: "Packs", en: "Packages" }), t(locale, { fr: "À la carte", en: "À la carte" })];

  return (
    <>
      <div role="tablist" aria-label={t(locale, { fr: "Types d’offres", en: "Offer types" })} className="relative mx-auto mb-8 grid w-fit grid-cols-2 rounded-full border border-border bg-surface p-1">
        <span aria-hidden className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent shadow-sm transition-transform duration-200 motion-reduce:transition-none ${active === 1 ? "translate-x-full" : "translate-x-0"}`} />
        {labels.map((label, index) => (
          <button
            key={index}
            ref={(node) => { buttons.current[index] = node; }}
            type="button"
            role="tab"
            id={`${id}-tab-${index}`}
            aria-controls={`${id}-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
              setActive(next);
              buttons.current[next]?.focus();
            }}
            className={`relative z-10 cursor-pointer rounded-full px-6 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${active === index ? "text-background" : "text-muted hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {[packs, options].map((content, index) => (
        <div key={index} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0}>
          {content}
        </div>
      ))}
    </>
  );
}
