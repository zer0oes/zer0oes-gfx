"use client";

import { useRef } from "react";
import { ProtectedMedia } from "./protection";

export function OrderPreview({ src, alt, en }: { src: string; alt: string; en: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} aria-label={en ? "Enlarge protected preview" : "Agrandir l’aperçu protégé"} className="block w-full cursor-zoom-in rounded-xl focus-visible:outline-2 focus-visible:outline-accent">
      <ProtectedMedia className="overflow-hidden rounded-xl border border-border bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="lazy" draggable={false} className="max-h-[480px] w-full object-contain" />
      </ProtectedMedia>
    </button>
    <dialog ref={dialog} className="m-auto max-h-[95dvh] w-[95vw] max-w-6xl rounded-2xl border border-border bg-background p-4 text-foreground backdrop:bg-black/80">
      <form method="dialog" className="mb-3 flex justify-end"><button className="rounded-full border border-border px-4 py-2">{en ? "Close" : "Fermer"} ✕</button></form>
      <ProtectedMedia className="overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} draggable={false} className="max-h-[80dvh] w-full object-contain" />
      </ProtectedMedia>
    </dialog>
  </>;
}
