"use client";

import { Children, useEffect, useState } from "react";
import { useLocale } from "./I18nProvider";

// Carrousel des avis de l'accueil : un avis à la fois, en fondu. Points pour naviguer,
// défilement automatique lent (7 s) qui s'arrête au survol ou au clavier, et jamais si le
// visiteur a demandé moins d'animations. Les avis sont superposés : la hauteur reste celle
// du plus long, sans saut de mise en page.
const DELAY = 7000;

export function ReviewsCarousel({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setCurrent((c) => (c + 1) % count), DELAY);
    return () => window.clearTimeout(timer);
  }, [current, paused, count]);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-roledescription={locale === "en" ? "carousel" : "carrousel"}
      aria-label={locale === "en" ? "Client reviews" : "Avis clients"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="grid">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription={locale === "en" ? "slide" : "avis"}
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={i !== current}
            inert={i !== current}
            className={`[grid-area:1/1] transition-all duration-700 ease-out motion-reduce:transition-none ${
              i === current ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
            }`}
          >
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-10 flex justify-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={locale === "en" ? `Review ${i + 1} of ${count}` : `Avis ${i + 1} sur ${count}`}
              aria-current={i === current ? "true" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${i === current ? "w-8" : "w-2.5 bg-border hover:bg-muted"}`}
              style={i === current ? { background: "linear-gradient(90deg, var(--accent-3), var(--accent-2))" } : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
