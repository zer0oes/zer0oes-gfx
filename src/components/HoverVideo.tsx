"use client";

import { useEffect, useRef, useState } from "react";
import { Watermark } from "./protection";

// Une seule vidéo d'aperçu joue à la fois.
let playing: HTMLVideoElement | null = null;

function play(video: HTMLVideoElement, src: string) {
  if (!video.getAttribute("src")) video.src = src; // chargement au premier besoin seulement
  if (playing && playing !== video) stop(playing);
  playing = video;
  video.play().catch(() => {});
}

function stop(video: HTMLVideoElement) {
  video.pause();
  video.currentTime = 0;
  if (playing === video) playing = null;
}

// Vidéo d'aperçu posée sur l'image fixe d'une carte :
// - avec une souris : lecture au survol de l'élément parent marqué [data-hover-root] ;
// - sur écran tactile : lecture quand la carte est bien visible à l'écran ;
// - jamais de lecture automatique si prefers-reduced-motion.
export function HoverVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const video = ref.current;
    const root = video?.closest<HTMLElement>("[data-hover-root]");
    if (!video || !root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onPlaying = () => setActive(true);
    const onPause = () => setActive(false);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);

    let cleanup: () => void;
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const enter = () => play(video, src);
      const leave = () => stop(video);
      root.addEventListener("pointerenter", enter);
      root.addEventListener("pointerleave", leave);
      root.addEventListener("focusin", enter);
      root.addEventListener("focusout", leave);
      cleanup = () => {
        root.removeEventListener("pointerenter", enter);
        root.removeEventListener("pointerleave", leave);
        root.removeEventListener("focusin", enter);
        root.removeEventListener("focusout", leave);
      };
    } else {
      const observer = new IntersectionObserver(
        ([entry]) => (entry.intersectionRatio >= 0.6 ? play(video, src) : stop(video)),
        { threshold: [0, 0.6] },
      );
      observer.observe(root);
      cleanup = () => observer.disconnect();
    }

    return () => {
      cleanup();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      stop(video);
    };
  }, [src]);

  return (
    <>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload noremoteplayback"
        draggable={false}
        aria-hidden
        tabIndex={-1}
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          active ? "opacity-100" : "opacity-0"
        }`}
      />
      <Watermark active={active} />
    </>
  );
}
