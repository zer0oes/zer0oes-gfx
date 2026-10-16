"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { headlineParts, remainingPlacesText, slideHref, type AnnouncementSlide } from "@/lib/announcement-carousel";

type CampaignStatus = { active: boolean; remaining: number | null };
export function AnnouncementCarousel({ slides, locale, initialStatus }: { slides: AnnouncementSlide[]; locale: Locale; initialStatus: CampaignStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [auto, setAuto] = useState(true);
  const [manualChange, setManualChange] = useState(0);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const activeSlides = slides.filter((s) => s.enabled && (s.id !== "launch" || status.active));
  const count = activeSlides.length;
  const current = count ? index % count : 0;
  const rotating = count > 1 && auto && !hovered && !focused && visible && !reducedMotion;
  const en = locale === "en";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    const syncVisibility = () => setVisible(document.visibilityState === "visible");
    syncMotion(); syncVisibility();
    media.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisibility);
    return () => { media.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncVisibility); };
  }, []);

  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), 7000);
    return () => window.clearInterval(timer);
  }, [rotating, count, manualChange]);

  useEffect(() => {
    const controller = new AbortController();
    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const response = await fetch("/api/announcements", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const next = await response.json();
        if (typeof next.active === "boolean" && (next.remaining === null || Number.isSafeInteger(next.remaining) && next.remaining >= 0)) setStatus(next);
      } catch { /* Conserver la dernière valeur réellement lue, sans inventer de compteur. */ }
    };
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  const select = (next: number) => { setIndex((next + count) % count); setManualChange((v) => v + 1); };
  if (!count) return null;

  return <aside role="region" aria-roledescription="carousel" aria-label={en ? "News and offers" : "Actualités et offres"}
    className="relative isolate overflow-hidden border-b border-accent/30 bg-surface"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={(event) => { if (count > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); select(current + (event.key === "ArrowRight" ? 1 : -1)); } }}>
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(167,139,250,0.13),transparent_55%,rgba(34,211,238,0.06))]" />
    <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-accent-3/60 via-accent/70 to-accent-2/50" />
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
      {/* Présentation centrée, sans bouton : toute la diapo est le lien. Les diapos partagent la même
          cellule de grille, donc le bandeau garde la hauteur de la plus grande. */}
      <div className="grid touch-pan-y" aria-live={rotating ? "off" : "polite"} aria-atomic="false"
        onPointerDown={(event) => { swiped.current = false; if (event.isPrimary && event.button === 0) swipe.current = { x: event.clientX, y: event.clientY }; }}
        onPointerCancel={() => { swipe.current = null; }}
        onPointerUp={(event) => {
          if (!swipe.current || count < 2) return;
          const dx = event.clientX - swipe.current.x, dy = event.clientY - swipe.current.y;
          swipe.current = null;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped.current = true; select(current + (dx < 0 ? 1 : -1)); }
        }}
        onClickCapture={(event) => { if (swiped.current) { event.preventDefault(); swiped.current = false; } }}>
        {activeSlides.map((slide, i) => {
          const copy = slide.content[locale];
          const remaining = slide.id === "launch" ? remainingPlacesText(copy.remainingText, status.remaining) : "";
          const selected = i === current;
          const badgeEnd = slide.id === "launch" ? copy.title.indexOf(":") : -1;
          const badge = copy.badge ?? (badgeEnd > 0 ? copy.title.slice(0, badgeEnd).trim() : "");
          const title = badgeEnd > 0 ? copy.title.slice(badgeEnd + 1).trim() : copy.title;
          return <div key={slide.id} role="group" aria-roledescription={en ? "slide" : "diapositive"} aria-label={`${i + 1} / ${count}`} aria-hidden={!selected} inert={!selected}
            data-slide={slide.id} data-active={selected}
            className={`col-start-1 row-start-1 flex transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${selected ? "visible opacity-100" : "pointer-events-none invisible opacity-0"}`}>
            <Link href={slideHref(locale, copy.buttonHref)}
              className="group flex w-full flex-col items-center justify-center gap-2 py-5 text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent md:px-28">
              {badge && <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-accent transition group-hover:border-accent group-hover:bg-accent/20"><span aria-hidden className="text-sm leading-none">✦</span><span>{badge}</span></span>}
              <span className="text-base font-medium leading-snug text-foreground md:text-lg">
                {headlineParts(title).map((part, n) => part.highlight
                  ? <strong key={n} className="text-gradient whitespace-nowrap font-bold">{part.text}</strong>
                  : <span key={n}>{part.text}</span>)}
                <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 inline-block align-[-1px] text-accent transition-transform group-hover:translate-x-1 motion-reduce:transition-none"><path d="M2 7h10M8 3l4 4-4 4" /></svg>
              </span>
              {remaining && <span className="text-base font-medium leading-5 text-foreground">
                {copy.remainingText.split("{count}").map((part, n) => <span key={n}>{n > 0 && <strong className="font-bold text-accent">{status.remaining}</strong>}{part}</span>)}
              </span>}
              {copy.conditions && <span className="text-xs leading-4 text-muted">{copy.conditions}</span>}
            </Link>
          </div>;
        })}
        {count > 1 && <div className="relative z-10 row-start-2 flex items-center justify-center gap-0.5 pb-3 md:absolute md:right-6 md:top-1/2 md:-translate-y-1/2 md:pb-0" role="group" aria-label={en ? "Slideshow controls" : "Commandes du carrousel"}>
          {activeSlides.map((slide, i) => <button key={slide.id} type="button" onClick={() => select(i)} aria-current={i === current ? "true" : undefined}
            aria-label={`${en ? "Show slide" : "Afficher la diapo"} ${i + 1} : ${slide.content[locale].title}`} className="flex size-7 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-accent">
            <span aria-hidden className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${i === current ? "w-5 bg-accent" : "w-1.5 bg-muted/50"}`} />
          </button>)}
          {!reducedMotion && <button type="button" onClick={() => setAuto((v) => !v)} aria-label={auto ? en ? "Pause slideshow" : "Mettre le carrousel en pause" : en ? "Start slideshow" : "Démarrer le carrousel"} className="flex size-7 items-center justify-center rounded-full text-muted hover:text-accent focus-visible:outline-2 focus-visible:outline-accent">
            <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" fill="currentColor">{auto ? <><rect x="2" y="1" width="3" height="10" rx="1" /><rect x="7" y="1" width="3" height="10" rx="1" /></> : <path d="M3 1 11 6 3 11Z" />}</svg>
          </button>}
        </div>}
      </div>
    </div>
  </aside>;
}
