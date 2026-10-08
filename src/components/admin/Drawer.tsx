"use client";

import { useEffect, useRef } from "react";

// Panneau latéral droit (comme les livrables d'une commande). openOnLoad : rouvert après un enregistrement.
export function Drawer({ id, kicker, title, openOnLoad = false, children }: { id: string; kicker: string; title: string; openOnLoad?: boolean; children: React.ReactNode }) {
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
            <p className="mb-1 text-xs uppercase tracking-wider text-accent">{kicker}</p>
            <h3 id={`${id}-title`} className="font-display text-xl font-bold">{title}</h3>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-3 py-1.5 text-sm" aria-label="Fermer le panneau">
            Fermer ✕
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </dialog>
  );
}

const openDrawer = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.showModal();

// Ligne de tableau cliquable : ouvre le panneau, sauf sur ses boutons et liens (ordre, etc.)
export function DrawerRow({ drawer, label, className = "", children }: { drawer: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <tr
      tabIndex={0}
      aria-label={label}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button, a, input, select, form")) openDrawer(drawer);
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
