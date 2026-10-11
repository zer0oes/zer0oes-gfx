"use client";

import { useRef } from "react";
import { ProtectedMedia } from "./protection";

// Aperçu vidéo d'un livrable : lecture en boucle sans commandes (ni téléchargement ni plein écran natif,
// qui retirerait le logo). L'agrandissement ouvre la vidéo en grand avec le logo toujours par-dessus.
function Video({ src, className }: { src: string; className: string }) {
  return <>
    <video src={src} autoPlay loop muted playsInline preload="auto" disablePictureInPicture disableRemotePlayback controlsList="nodownload nofullscreen noremoteplayback" tabIndex={-1} className={className} />
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/logo-zeroes-gfx.png" alt="" aria-hidden draggable={false} className="pointer-events-none absolute left-1/2 top-[42%] w-2/5 -translate-x-1/2 -translate-y-1/2 opacity-25" />
  </>;
}

export function OrderVideoPreview({ src, en }: { src: string; en: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} aria-label={en ? "Enlarge protected preview" : "Agrandir l’aperçu protégé"} className="block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
      <ProtectedMedia className="overflow-hidden rounded-xl border border-border bg-background">
        <Video src={src} className="aspect-video w-full" />
      </ProtectedMedia>
    </button>
    <dialog ref={dialog} className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl rounded-2xl border border-border bg-background p-4 text-foreground backdrop:bg-black/80">
      <form method="dialog" className="mb-3 flex justify-end"><button className="rounded-full border border-border px-4 py-2">{en ? "Close" : "Fermer"} ✕</button></form>
      <ProtectedMedia className="overflow-hidden rounded-xl">
        <Video src={src} className="max-h-[80dvh] w-full" />
      </ProtectedMedia>
    </dialog>
  </>;
}
