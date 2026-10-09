"use client";

import { useEffect, useRef, useState } from "react";
import { createLabAction } from "@/app/admin/custom-lab-actions";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";

const creations: { kind: "overlay" | "widget" | "alertbox"; label: string; icon: MaterialIconName }[] = [
  { kind: "overlay", label: "Nouvel overlay", icon: "layers" },
  { kind: "widget", label: "Nouveau widget", icon: "widgets" },
  { kind: "alertbox", label: "Nouveau pack d’alertes", icon: "notifications_active" },
];

// Bouton « + Nouveau » de la bibliothèque du Laboratoire : menu déroulant (créations et projet)
export function LabNewMenu({ disabled, className, projectDrawer }: { disabled?: boolean; className: string; projectDrawer: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Fermeture au clic en dehors et avec Échap
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", key); };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/10 hover:text-accent disabled:opacity-50";
  return (
    <div ref={root} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className={`${className} inline-flex items-center gap-1`}>
        + Nouveau
        <MaterialIcon name="expand_more" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-60 rounded-xl border border-border bg-background p-1.5 shadow-xl shadow-black/40">
          {creations.map((c) => (
            <form key={c.kind} action={createLabAction}>
              <input type="hidden" name="kind" value={c.kind} />
              <button role="menuitem" className={item}><MaterialIcon name={c.icon} className="size-4 text-muted" />{c.label}</button>
            </form>
          ))}
          <div className="my-1 border-t border-border" />
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); (document.getElementById(projectDrawer) as HTMLDialogElement | null)?.showModal(); }}>
            <MaterialIcon name="create_new_folder" className="size-4 text-muted" />Nouveau projet
          </button>
        </div>
      )}
    </div>
  );
}
