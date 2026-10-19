"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";

// Menu « ⋮ » en bout de ligne : dupliquer, supprimer (avec confirmation). Positionné en fixe pour ne pas être coupé par le tableau.
// Utilisé par la bibliothèque du Laboratoire et la liste des visuels.
type Action = (form: FormData) => void | Promise<void>;
export function RowActionsMenu({ id, name, duplicateAction, deleteAction, deleteNote }: { id: string; name: string; duplicateAction: Action; deleteAction: Action; deleteNote: string }) {
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!at) return;
    const close = (event: Event) => { if (!(event.target instanceof Node) || !document.getElementById(`row-menu-${id}`)?.contains(event.target)) setAt(null); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setAt(null); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); window.removeEventListener("scroll", close, true); };
  }, [at, id]);
  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm";
  return (
    <>
      <button ref={button} type="button" aria-label={`Actions pour ${name}`} aria-haspopup="menu" aria-expanded={Boolean(at)} title="Actions" onClick={() => { const r = button.current!.getBoundingClientRect(); setAt(at ? null : { top: r.bottom + 4, right: window.innerWidth - r.right }); }} className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent">
        <MaterialIcon name="more_vert" className="size-5" />
      </button>
      {at && (
        <div id={`row-menu-${id}`} role="menu" style={{ top: at.top, right: at.right }} className="fixed z-50 w-48 rounded-xl border border-border bg-background p-1.5 shadow-xl shadow-black/40">
          <form action={duplicateAction} onSubmit={() => setAt(null)}>
            <input type="hidden" name="id" value={id} />
            <button role="menuitem" className={`${item} hover:bg-accent/10 hover:text-accent`}><MaterialIcon name="content_copy" className="size-4" />Dupliquer</button>
          </form>
          <button type="button" role="menuitem" onClick={() => { setAt(null); dialog.current?.showModal(); }} className={`${item} text-red-300 hover:bg-red-500/10`}><MaterialIcon name="delete" className="size-4" />Supprimer</button>
        </div>
      )}
      <dialog ref={dialog} aria-label={`Supprimer « ${name} » ?`} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-left text-foreground shadow-2xl backdrop:bg-black/70">
        <p className="font-display text-lg font-bold">Supprimer « {name} » ?</p>
        <p className="mt-2 text-sm text-muted">{deleteNote}</p>
        <form action={deleteAction} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
          <button type="submit" className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Supprimer</button>
        </form>
      </dialog>
    </>
  );
}
