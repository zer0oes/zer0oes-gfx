"use client";

import { Children, useEffect, useState } from "react";
import { useLocale } from "./I18nProvider";

// Carrousel des avis de l'accueil : un avis à la fois, en glissement de droite à gauche avec fondu. Points pour naviguer,
// défilement automatique lent (10 s) qui s'arrête au survol ou au clavier, et jamais si le
// visiteur a demandé moins d'animations. Les avis sont superposés : la hauteur reste celle
// du plus long, sans saut de mise en page.
const DELAY = 10000;

export function ReviewsCarousel({ children }: { children: React.ReactNode }) {
  const slides = Children.toArray(children);
  const locale = useLocale();
  const [{ current, previous }, setSlide] = useState<{ current: number; previous: number | null }>({ current: 0, previous: null });
  const selectSlide = (index: number) => setSlide((slide) => index === slide.current ? slide : { current: index, previous: slide.current });
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setSlide((slide) => ({ current: (slide.current + 1) % count, previous: slide.current })), DELAY);
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
      <div className="grid overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription={locale === "en" ? "slide" : "avis"}
            aria-label={`${i + 1} / ${count}`}
            aria-hidden={i !== current}
            inert={i !== current}
            className={`[grid-area:1/1] ${
              i === current ? (previous === null ? "" : "review-slide-in") : i === previous ? "pointer-events-none review-slide-out" : "pointer-events-none invisible"
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
              onClick={() => selectSlide(i)}
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
