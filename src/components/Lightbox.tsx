"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { categories, type Work } from "@/data/portfolio";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

// Affiche une réalisation en grand dans une modale native (<dialog>) :
// Échap, clic hors du visuel et bouton pour fermer ; flèches clavier et swipe pour naviguer.
export function Lightbox({
  works,
  index,
  onClose,
  onNavigate,
}: {
  works: Work[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const open = index !== null && works.length > 0;
  const work = open ? works[index] : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.body.style.overflow = "";
  }, [open]);

  useEffect(() => () => void (document.body.style.overflow = ""), []);

  const go = (delta: number) => {
    if (index === null) return;
    onNavigate((index + delta + works.length) % works.length);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const category = work && categories.find((c) => c.id === work.category)?.label;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lightbox-title"
      onClose={onClose}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // Clic sur le fond (hors du contenu) : fermeture
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => (touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={onTouchEnd}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 text-foreground backdrop:bg-black/90 backdrop:backdrop-blur-sm"
    >
      {work && (
        <div
          className="flex h-full flex-col items-center justify-center gap-4 px-4 py-16 sm:px-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <figure className="flex w-full max-w-6xl flex-col items-center">
            <div className="relative aspect-video w-[min(100%,calc(70dvh*16/9))] overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
              {work.video ? (
                <video
                  key={work.id}
                  src={work.video}
                  poster={work.image}
                  muted
                  loop
                  playsInline
                  autoPlay={!reducedMotion}
                  controls={reducedMotion}
                  preload="metadata"
                  aria-label={`${work.title} — animation`}
                  className="block h-full w-full object-contain"
                />
              ) : work.image ? (
                <Image
                  key={work.id}
                  src={work.image}
                  alt={work.title}
                  width={1600}
                  height={900}
                  sizes="(min-width: 1280px) 1152px, 100vw"
                  className="block h-full w-full object-contain"
                />
              ) : null}
            </div>
            <figcaption className="mt-4 w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                {category} · {work.client}
              </p>
              <h2 id="lightbox-title" className="mt-1 font-display text-xl font-bold sm:text-2xl">
                {work.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{work.description}</p>
              {works.length > 1 && (
                <p className="mt-2 text-xs text-muted/70" aria-live="polite">
                  {index! + 1} / {works.length}
                </p>
              )}
            </figcaption>
          </figure>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="absolute right-3 top-3 rounded-full bg-surface/80 p-3 text-foreground transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:right-6 sm:top-6"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {works.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Réalisation précédente"
                className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/80 p-3 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:block sm:left-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Réalisation suivante"
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/80 p-3 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:block sm:right-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <div className="flex items-center gap-4 sm:hidden">
                <button type="button" onClick={() => go(-1)} aria-label="Réalisation précédente" className="rounded-full bg-surface/80 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <span className="text-xs text-muted/70">Glissez pour naviguer</span>
                <button type="button" onClick={() => go(1)} aria-label="Réalisation suivante" className="rounded-full bg-surface/80 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
