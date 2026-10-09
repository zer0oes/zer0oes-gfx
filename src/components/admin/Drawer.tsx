"use client";

import { useEffect, useRef } from "react";

// Panneau latéral droit (comme les livrables d'une commande). openOnLoad : rouvert après un enregistrement.
// footer : boutons d'action, sous un séparateur en bas du panneau
export function Drawer({ id, kicker, title, openOnLoad = false, footer, children }: { id: string; kicker: string; title: string; openOnLoad?: boolean; footer?: React.ReactNode; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (openOnLoad && !dialog.current?.open) dialog.current?.showModal();
  }, [openOnLoad]);
  return (
    <dialog
      ref={dialog}
      id={id}
      aria-labelledby={`${id}-title`}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-full max-w-xl border-l border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col text-left">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">{kicker}</p>
            <h3 id={`${id}-title`} className="font-display text-xl font-bold">{title}</h3>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-accent/10 hover:text-foreground" aria-label="Fermer le panneau" title="Fermer">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-5 pt-3 sm:px-6 sm:pb-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </dialog>
  );
}

const openDrawer = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.showModal();

// Ligne de tableau cliquable : ouvre le panneau, sauf sur ses boutons et liens (ordre, etc.)
// sortId : ligne réordonnable (voir SortableRows)
export function DrawerRow({ drawer, label, className = "", sortId, children }: { drawer: string; label: string; className?: string; sortId?: string; children: React.ReactNode }) {
  return (
    <tr
      tabIndex={0}
      aria-label={label}
      data-sort-id={sortId}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button, a, input, select, form, [data-sort-handle]")) openDrawer(drawer);
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
          event.preventDefault();
          openDrawer(drawer);
        }
      }}
      className={`cursor-pointer outline-none transition hover:bg-accent/5 focus-visible:bg-accent/10 ${className}`}
    >
      {children}
    </tr>
  );
}

export function DrawerButton({ drawer, className, children }: { drawer: string; className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => openDrawer(drawer)} className={className}>
      {children}
    </button>
  );
}

// Suppression confirmée dans une petite modale (le formulaire n'est envoyé qu'après « Supprimer »)
// fields : champs cachés supplémentaires envoyés avec la suppression (ex. identifiant de la commande)
export function ConfirmDelete({ action, id, label = "Supprimer", question = "Es-tu sûre de vouloir supprimer ?", fields = {} }: { action: (form: FormData) => void | Promise<void>; id: string; label?: string; question?: string; fields?: Record<string, string> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10">
        {label}
      </button>
      <dialog ref={dialog} aria-label={question} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
        <p className="font-display text-lg font-bold">{question}</p>
        <form action={action} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="confirm" value="on" />
          {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
          <button type="submit" className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Supprimer</button>
        </form>
      </dialog>
    </>
  );
}
