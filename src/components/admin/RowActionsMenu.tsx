"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";

// Menu « ⋮ » en bout de ligne des tableaux de l'admin : actions de la ligne, puis Supprimer (avec confirmation).
// Positionné en fixe pour ne pas être coupé par le tableau. Même style que les autres menus (menuPanel, menuItem).
type Action = (form: FormData) => void | Promise<void>;
export type RowMenuItem = { label: string; icon: MaterialIconName; action: Action; fields?: Record<string, string> };

export const menuPanel = "z-50 min-w-48 rounded-xl border border-border bg-surface-2 p-1.5 shadow-xl shadow-black/40";
export const menuItem = "flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/10 hover:text-accent";

function Hidden({ id, fields }: { id: string; fields?: Record<string, string> }) {
  return <><input type="hidden" name="id" value={id} />{Object.entries(fields ?? {}).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}</>;
}

export function RowActionsMenu({ id, name, duplicateAction, deleteAction, deleteNote, fields, items = [] }: { id: string; name: string; duplicateAction?: Action; deleteAction?: Action; deleteNote?: string; fields?: Record<string, string>; items?: RowMenuItem[] }) {
  const [at, setAt] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuId = `row-menu-${id}`;
  useEffect(() => {
    if (!at) return;
    const close = (event: Event) => { if (!(event.target instanceof Node) || !document.getElementById(menuId)?.contains(event.target)) setAt(null); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setAt(null); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); window.removeEventListener("scroll", close, true); };
  }, [at, menuId]);
  const all: RowMenuItem[] = [...(duplicateAction ? [{ label: "Dupliquer", icon: "content_copy" as const, action: duplicateAction, fields }] : []), ...items];
  return (
    <>
      <button ref={button} type="button" aria-label={`Actions pour ${name}`} aria-haspopup="menu" aria-expanded={Boolean(at)} title="Actions" onClick={() => {
        // Sous le bouton, ou au-dessus s'il n'y a pas la place en bas de l'écran
        const r = button.current!.getBoundingClientRect();
        const room = window.innerHeight - r.bottom > 56 + 40 * (all.length + (deleteAction ? 1 : 0));
        setAt(at ? null : room ? { top: r.bottom + 4, right: window.innerWidth - r.right } : { bottom: window.innerHeight - r.top + 4, right: window.innerWidth - r.right });
      }} className="relative z-10 inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent">
        <MaterialIcon name="more_vert" className="size-5" />
      </button>
      {at && (
        <div id={menuId} role="menu" style={{ top: at.top, bottom: at.bottom, right: at.right }} className={`fixed ${menuPanel}`}>
          {all.map((entry) => (
            <form key={entry.label} action={entry.action} onSubmit={() => setAt(null)}>
              <Hidden id={id} fields={entry.fields ?? fields} />
              <button role="menuitem" className={menuItem}><MaterialIcon name={entry.icon} className="size-4" />{entry.label}</button>
            </form>
          ))}
          {deleteAction && <button type="button" role="menuitem" onClick={() => { setAt(null); dialog.current?.showModal(); }} className={`${menuItem} text-red-300 hover:!bg-red-500/10 hover:!text-red-300`}><MaterialIcon name="delete" className="size-4" />Supprimer</button>}
        </div>
      )}
      {deleteAction && (
        <dialog ref={dialog} aria-label="Es-tu sûre de vouloir supprimer ?" onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-left text-foreground shadow-2xl backdrop:bg-black/70">
          <p className="font-display text-lg font-bold">Es-tu sûre de vouloir supprimer « {name} » ?</p>
          {deleteNote && <p className="mt-2 text-sm text-muted">{deleteNote}</p>}
          <form action={deleteAction} className="mt-6 flex justify-end gap-3">
            <Hidden id={id} fields={{ confirm: "on", ...fields }} />
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
            <button type="submit" className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Supprimer</button>
          </form>
        </dialog>
      )}
    </>
  );
}
