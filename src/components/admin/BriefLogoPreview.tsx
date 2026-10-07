"use client";

import { useActionState, useId, useRef, useState } from "react";
import { uploadBriefLogo } from "@/app/admin/logo-actions";

export function BriefLogoPreview({ orderId, original, stored }: { orderId: string; original: string; stored?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const [failed, setFailed] = useState(false);
  const [state, action, pending] = useActionState(uploadBriefLogo, { message: "" });
  const direct = /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(original) ? original : null;
  const source = stored ? `/admin/commandes/${orderId}/logo?version=${encodeURIComponent(stored)}` : direct;
  const visible = source && !failed;
  return <section className="rounded-xl border border-border bg-background/50 p-4">
    <h3 className="text-sm font-semibold">Logo fourni</h3>
    {visible ? <button type="button" onClick={() => dialog.current?.showModal()} title="Agrandir le logo" className="mt-3 block rounded-lg border border-border bg-surface p-3 hover:border-accent" aria-label="Agrandir le logo fourni">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={source} alt="Logo fourni par le client" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-24 w-36 object-contain" />
    </button> : <p className="mt-2 text-sm text-muted">L’aperçu n’est pas accessible depuis ce lien. Ajoute une image pour le visualiser ici.</p>}
    <a href={original} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-muted hover:text-accent">Voir l’original ↗</a>
    <div className="mt-3 border-t border-border pt-3"><p className="text-xs font-semibold text-muted">Lien fourni dans le brief</p><a href={original} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-sm text-accent hover:underline">{original}</a></div>
    <details open={!visible} className="mt-3"><summary className="cursor-pointer text-xs text-accent">{visible ? "Remplacer l’image d’aperçu" : "Ajouter une image d’aperçu"}</summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="orderId" value={orderId} />
        <input name="image" type="file" accept="image/png,image/jpeg,image/webp" required aria-label="Image d’aperçu du logo" className="block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-foreground" />
        <button disabled={pending} className="rounded-full border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer l’aperçu"}</button>
        <p role="status" className="text-xs text-muted">{state.message}</p>
      </form>
    </details>
    <dialog ref={dialog} aria-labelledby={title} className="max-h-[90dvh] w-[min(90vw,800px)] rounded-2xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/70" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="mb-4 flex items-center justify-between gap-3"><h3 id={title} className="font-semibold">Logo fourni</h3><button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-3 py-1 text-sm">Fermer ✕</button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {source && <img src={source} alt="Logo fourni agrandi" referrerPolicy="no-referrer" className="max-h-[70dvh] w-full object-contain" />}
    </dialog>
  </section>;
}
