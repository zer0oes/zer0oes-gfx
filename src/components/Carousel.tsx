"use client";

import { useEffect, useRef, useState } from "react";

// Rangée horizontale défilante (glisser au doigt / trackpad, flèches au clavier ou à la souris).
export function Carousel({ label, children }: { label: string; children: React.ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? "auto" : "smooth" });
  };

  const arrow = "rounded-full border border-border bg-surface p-2 text-foreground transition hover:border-accent disabled:cursor-default disabled:opacity-30";

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={label} className="relative">
      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 px-4 pb-4 [scrollbar-width:thin] sm:-mx-0 sm:scroll-px-0 sm:px-0"
      >
        {children}
      </ul>
      {!(edges.start && edges.end) && (
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={`${label} : précédent`} className={arrow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={`${label} : suivant`} className={arrow}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export function CarouselItem({ children }: { children: React.ReactNode }) {
  return <li className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">{children}</li>;
}
