"use client";

import { useId, useRef } from "react";

export function DeliveryDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  return <>
    <button type="button" title="Modifier ce livrable" onClick={() => dialog.current?.showModal()} className="inline-flex size-9 items-center justify-center rounded-full border border-accent/40 text-accent hover:bg-accent/10" aria-label={`Modifier ce livrable : ${label}`}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" /></svg></button>
    <dialog ref={dialog} aria-labelledby={title} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl border-l border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60">
      <div className="flex h-full flex-col text-left">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><p className="mb-1 text-xs uppercase tracking-wider text-accent">Livrable</p><h3 id={title} className="font-display text-xl font-bold">{label}</h3></div><button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-3 py-1.5 text-sm" aria-label="Fermer le panneau">Fermer ✕</button></div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </dialog>
  </>;
}
