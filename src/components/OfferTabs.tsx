"use client";

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import type { CategoryDiscount } from "@/lib/category-discount";
import { t, type Locale } from "@/lib/i18n";

type PackSelection = { packId: string; formulaId?: string; hasLogo: boolean; revision: number };
const PackSelectionContext = createContext<PackSelection | null>(null);
export const usePackSelection = () => useContext(PackSelectionContext);
const OfferNavigation = createContext<(packId: string, formulaId?: string, hasLogo?: boolean) => void>(() => {});
export const useOfferNavigation = () => useContext(OfferNavigation);

export function OfferTabs({ packs, options, locale, labels, discounts, upToLabel }: { packs: ReactNode; options: ReactNode; locale: Locale; labels: [string, string]; discounts: [CategoryDiscount | null, CategoryDiscount | null]; upToLabel: string }) {
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<PackSelection | null>(null);
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);


  return (
    <PackSelectionContext.Provider value={selection}><OfferNavigation.Provider value={(packId, formulaId, hasLogo = false) => {
      setSelection((current) => ({ packId, formulaId, hasLogo, revision: (current?.revision ?? 0) + 1 }));
      setActive(0);
      requestAnimationFrame(() => {
        buttons.current[0]?.focus({ preventScroll: true });
        document.getElementById(`offre-${packId}`)?.scrollIntoView({ block: "start" });
      });
    }}>
      <div role="tablist" aria-label={t(locale, { fr: "Types d’offres", en: "Offer types" })} className="relative mx-auto mb-8 grid w-full max-w-xl grid-cols-2 rounded-full border border-border bg-surface p-1">
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
            className={`relative z-10 flex min-w-0 cursor-pointer flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full px-2 py-2.5 text-xs sm:px-4 sm:text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${active === index ? "text-background" : "text-muted hover:text-foreground"}`}
          >
            <span>{label}</span>
            {discounts[index] && <span className="inline-flex shrink-0 rounded-full bg-gradient-to-br from-accent-3/80 via-accent/70 to-accent-2/70 p-px font-display text-[11px] font-bold leading-none sm:text-xs"><span className="rounded-full bg-[#15131f] px-2 py-1"><span className="text-gradient whitespace-nowrap">{discounts[index].upTo ? `${upToLabel} ` : ""}−{new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(discounts[index].percent)} %</span></span></span>}
          </button>
        ))}
      </div>
      {[packs, options].map((content, index) => (
        <div key={index} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={active !== index} tabIndex={0}>
          {content}
        </div>
      ))}
    </OfferNavigation.Provider></PackSelectionContext.Provider>
  );
}
