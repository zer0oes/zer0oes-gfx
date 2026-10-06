"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { categories, emoteGroups, type Work } from "@/data/portfolio";
import { t } from "@/lib/i18n";
import { useLocale } from "./I18nProvider";
import { ProtectedMedia, Watermark } from "./protection";

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
  streamerNames = {},
  index,
  onClose,
  onNavigate,
}: {
  works: Work[];
  streamerNames?: Record<string, string>;
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const locale = useLocale();
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
            {work.emotes ? (
              <EmoteSheet key={work.id} work={work} reducedMotion={reducedMotion} />
            ) : (
            <div className="relative aspect-video w-[min(100%,calc(70dvh*16/9))] overflow-hidden rounded-xl border border-border bg-black shadow-2xl">
              <ProtectedMedia className="h-full w-full">
                {work.video ? (
                  <LightboxVideo key={work.id} src={work.video} poster={work.image} title={work.title} autoPlay={!reducedMotion} />
                ) : work.image ? (
                  <Image
                    key={work.id}
                    src={work.image}
                    alt={work.title}
                    width={1600}
                    height={900}
                    draggable={false}
                    sizes="(min-width: 1280px) 1152px, 100vw"
                    className="block h-full w-full object-contain"
                  />
                ) : null}
              </ProtectedMedia>
            </div>
            )}
            <figcaption className="mt-4 w-full max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                {category}
                {streamerNames[work.streamer] ? ` · ${streamerNames[work.streamer]}` : ""}
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
            aria-label={t(locale, { fr: "Fermer", en: "Close" })}
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
                aria-label={t(locale, { fr: "Réalisation précédente", en: "Previous work" })}
                className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/80 p-3 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:block sm:left-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label={t(locale, { fr: "Réalisation suivante", en: "Next work" })}
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/80 p-3 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:block sm:right-5"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
              <div className="flex items-center gap-4 sm:hidden">
                <button type="button" onClick={() => go(-1)} aria-label={t(locale, { fr: "Réalisation précédente", en: "Previous work" })} className="rounded-full bg-surface/80 p-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <span className="text-xs text-muted/70">Glisse pour naviguer</span>
                <button type="button" onClick={() => go(1)} aria-label={t(locale, { fr: "Réalisation suivante", en: "Next work" })} className="rounded-full bg-surface/80 p-3">
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

// Planche d'emotes, groupées comme dans le tableau d'Aurore, sur le fond du site.
function EmoteSheet({ work, reducedMotion }: { work: Work; reducedMotion: boolean }) {
  const locale = useLocale();
  return (
    <div className="max-h-[68dvh] w-[min(100%,64rem)] overflow-y-auto rounded-xl border border-border bg-background shadow-2xl">
      <div
        className="protected-media relative select-none p-4 [-webkit-touch-callout:none] sm:p-6"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <Watermark sheet />
      {emoteGroups.map((g) => {
        const emotes = work.emotes!.filter((e) => e.group === g.id);
        if (!emotes.length) return null;
        return (
          <section key={g.id} className="mb-6 last:mb-0">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">{g.label}</h3>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3 sm:gap-4">
              {emotes.map((e) => (
                <li key={e.name} className="group flex flex-col items-center gap-1.5">
                  <ProtectedMedia watermark={false} className="h-20 w-20 sm:h-24 sm:w-24">
                    <Image
                      src={e.animated ? e.src.replace(/\.webp$/, "-still.webp") : e.src}
                      alt={`Emote ${e.name}${e.animated ? t(locale, { fr: " (animée)", en: " (animated)" }) : ""}`}
                      width={112}
                      height={112}
                      unoptimized
                      draggable={false}
                      className="h-full w-full object-contain"
                    />
                    {e.animated && !reducedMotion && (
                      // Animée au survol avec une souris, en continu sur écran tactile
                      <Image
                        src={e.src}
                        alt=""
                        width={112}
                        height={112}
                        unoptimized
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-contain transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
                      />
                    )}
                  </ProtectedMedia>
                  <span className="font-mono text-[11px] text-muted">{e.name}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      </div>
    </div>
  );
}

// Vidéo de la visionneuse : sans contrôles natifs (pas de téléchargement ni
// d'image dans l'image) ; bouton lecture/pause du site si la lecture auto est coupée.
function LightboxVideo({ src, poster, title, autoPlay }: { src: string; poster?: string; title: string; autoPlay: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const locale = useLocale();
  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noremoteplayback nofullscreen"
        draggable={false}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        aria-label={`${title} — animation`}
        className="block h-full w-full object-contain"
      />
      <Watermark />
      <button
        type="button"
        onClick={() => (ref.current?.paused ? ref.current.play() : ref.current?.pause())}
        aria-label={playing ? t(locale, { fr: "Mettre en pause l'animation", en: "Pause the animation" }) : t(locale, { fr: "Lire l'animation", en: "Play the animation" })}
        className="absolute bottom-3 left-3 z-[3] rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur hover:bg-surface-2"
      >
        {playing ? "❚❚ Pause" : t(locale, { fr: "▶ Lire", en: "▶ Play" })}
      </button>
    </>
  );
}
