"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition, type ReactNode } from "react";
import { deleteLabAction, duplicateLabAction, moveLabAction } from "@/app/admin/custom-lab-actions";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import { ClickableRow } from "./ClickableRow";
import { MaterialIcon } from "./MaterialIcon";

export type LabRow = { id: string; name: string; description: string; kindLabel: string; kindTone: string; platforms: Platform[]; size: string; updated: string };
export type LabSection = { name: string; header: ReactNode; rows: LabRow[] };

const platformIcons: Record<Platform, { src: string; label: string }> = {
  streamelements: { src: "/streamerlab/platforms/streamelements-icon.svg", label: "StreamElements" },
  // Version menthe, lisible sur fond sombre (la version « active » est prévue pour le fond menthe du sélecteur)
  streamlabs: { src: "/streamerlab/platforms/streamlabs-icon.svg", label: "Streamlabs" },
};

// Compatibilité : logo de chaque plateforme dont le code est rempli
function Compatibility({ platforms }: { platforms: readonly Platform[] }) {
  if (!platforms.length) return <span className="text-muted">—</span>;
  return (
    <span className="flex items-center gap-2" aria-label={`Compatible ${platforms.map((p) => platformIcons[p].label).join(" et ")}`}>
      {platforms.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={p} src={platformIcons[p].src} alt="" title={platformIcons[p].label} width={22} height={22} className="size-[22px] object-contain" />
      ))}
    </span>
  );
}

// Menu « ⋮ » d'une création : dupliquer, supprimer (avec confirmation). Positionné en fixe pour ne pas être coupé par le tableau.
function RowMenu({ row }: { row: LabRow }) {
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!at) return;
    const close = (event: Event) => { if (!(event.target instanceof Node) || !document.getElementById(`lab-menu-${row.id}`)?.contains(event.target)) setAt(null); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setAt(null); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); window.removeEventListener("scroll", close, true); };
  }, [at, row.id]);
  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm";
  return (
    <>
      <button ref={button} type="button" aria-label={`Actions pour ${row.name}`} aria-haspopup="menu" aria-expanded={Boolean(at)} title="Actions" onClick={() => { const r = button.current!.getBoundingClientRect(); setAt(at ? null : { top: r.bottom + 4, right: window.innerWidth - r.right }); }} className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent">
        <MaterialIcon name="more_vert" className="size-5" />
      </button>
      {at && (
        <div id={`lab-menu-${row.id}`} role="menu" style={{ top: at.top, right: at.right }} className="fixed z-50 w-48 rounded-xl border border-border bg-background p-1.5 shadow-xl shadow-black/40">
          <form action={duplicateLabAction} onSubmit={() => setAt(null)}>
            <input type="hidden" name="id" value={row.id} />
            <button role="menuitem" className={`${item} hover:bg-accent/10 hover:text-accent`}><MaterialIcon name="content_copy" className="size-4" />Dupliquer</button>
          </form>
          <button type="button" role="menuitem" onClick={() => { setAt(null); dialog.current?.showModal(); }} className={`${item} text-red-300 hover:bg-red-500/10`}><MaterialIcon name="delete" className="size-4" />Supprimer</button>
        </div>
      )}
      <dialog ref={dialog} aria-label={`Supprimer « ${row.name} » ?`} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-left text-foreground shadow-2xl backdrop:bg-black/70">
        <p className="font-display text-lg font-bold">Supprimer « {row.name} » ?</p>
        <p className="mt-2 text-sm text-muted">La suppression est définitive. Un overlay qui l’utilise affichera un calque vide à la place.</p>
        <form action={deleteLabAction} className="mt-6 flex justify-end gap-3">
          <input type="hidden" name="id" value={row.id} />
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
          <button type="submit" className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Supprimer</button>
        </form>
      </dialog>
    </>
  );
}

type Drag = { row: LabRow; from: string; over: string; index: number; x: number; y: number; offset: number; left: number; width: number; height: number };
type Move = { id: string; project: string; orderedIds: string[] };

// Déplace une création dans l'affichage (ordre du projet d'arrivée)
function applyMove(sections: LabSection[], move: Move): LabSection[] {
  const row = sections.flatMap((s) => s.rows).find((r) => r.id === move.id);
  if (!row) return sections;
  return sections.map((section) => {
    const rows = section.rows.filter((r) => r.id !== move.id);
    if (section.name !== move.project) return { ...section, rows };
    const byId = new Map([...rows, row].map((r) => [r.id, r]));
    return { ...section, rows: move.orderedIds.map((id) => byId.get(id)).filter((r): r is LabRow => Boolean(r)) };
  });
}

// Bibliothèque : un tableau par projet ; poignée en début de ligne pour changer l'ordre ou déplacer vers un autre projet,
// menu « ⋮ » en fin de ligne (dupliquer, supprimer)
export function LabLibraryBoard({ sections: initial }: { sections: LabSection[] }) {
  const [sections, addMove] = useOptimistic(initial, applyMove);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState("");
  const [, startTransition] = useTransition();
  const current = useRef<Drag | null>(null);

  // Projet et rang visés sous le pointeur
  const target = (x: number, y: number, base: Drag): Drag => {
    const zones = [...document.querySelectorAll<HTMLElement>("[data-lab-section]")].map((el) => ({ name: el.dataset.labSection!, rect: el.getBoundingClientRect(), el }));
    if (!zones.length) return { ...base, x, y };
    const zone = zones.find((z) => y >= z.rect.top - 12 && y <= z.rect.bottom + 12) ?? zones.reduce((best, z) => (Math.abs(y - (z.rect.top + z.rect.height / 2)) < Math.abs(y - (best.rect.top + best.rect.height / 2)) ? z : best));
    const rows = [...zone.el.querySelectorAll<HTMLElement>("tr[data-lab-row]")];
    const index = rows.filter((tr) => { const r = tr.getBoundingClientRect(); return r.top + r.height / 2 < y; }).length;
    return { ...base, over: zone.name, index, x, y };
  };

  const start = (event: React.PointerEvent, row: LabRow, from: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const tr = (event.currentTarget as HTMLElement).closest("tr")!.getBoundingClientRect();
    const index = sections.find((s) => s.name === from)!.rows.findIndex((r) => r.id === row.id);
    const first: Drag = { row, from, over: from, index, x: event.clientX, y: event.clientY, offset: event.clientY - tr.top, left: tr.left, width: tr.width, height: tr.height };
    current.current = first;
    setDrag(first);
    const move = (ev: PointerEvent) => { current.current = target(ev.clientX, ev.clientY, current.current!); setDrag(current.current); };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      const done = current.current;
      current.current = null;
      setDrag(null);
      if (!done) return;
      const rows = sections.find((s) => s.name === done.over)!.rows.filter((r) => r.id !== done.row.id).map((r) => r.id);
      rows.splice(done.index, 0, done.row.id);
      const before = sections.find((s) => s.name === done.from)!.rows.map((r) => r.id);
      if (done.over === done.from && rows.join() === before.join()) return;
      const payload = { id: done.row.id, project: done.over, orderedIds: rows };
      startTransition(async () => {
        addMove(payload);
        const result = await moveLabAction(payload);
        setMessage(result.ok ? (done.over === done.from ? "Ordre enregistré." : `« ${done.row.name} » déplacée dans « ${done.over} ».`) : result.message ?? "Déplacement impossible.");
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  return (
    <div className="mt-8 space-y-10">
      <p role="status" aria-live="polite" className="sr-only">{message}</p>
      {sections.map((section) => {
        const rows = drag ? section.rows.filter((r) => r.id !== drag.row.id) : section.rows;
        const slotAt = drag && drag.over === section.name ? drag.index : -1;
        return (
          <section key={section.name} aria-label={`Projet ${section.name}`}>
            {section.header}
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[1040px] table-fixed text-left text-sm">
                {/* Mêmes largeurs de colonnes pour tous les projets */}
                <colgroup>
                  <col className="w-11" />
                  <col className="w-[22%]" />
                  <col />
                  <col className="w-40" />
                  <col className="w-36" />
                  <col className="w-36" />
                  <col className="w-48" />
                  <col className="w-12" />
                </colgroup>
                <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col"><span className="sr-only">Ordre</span></th>
                    <th scope="col" className="px-4 py-3 font-medium">Création</th>
                    <th scope="col" className="px-4 py-3 font-medium">Description</th>
                    <th scope="col" className="px-4 py-3 font-medium">Type</th>
                    <th scope="col" className="px-4 py-3 font-medium">Compatibilité</th>
                    <th scope="col" className="px-4 py-3 font-medium">Dimensions</th>
                    <th scope="col" className="px-4 py-3 font-medium">Modifiée le</th>
                    <th scope="col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody data-lab-section={section.name} className="divide-y divide-border">
                  {rows.flatMap((row, i) => [
                    ...(i === slotAt ? [<Slot key="slot" height={drag!.height} />] : []),
                    <ClickableRow key={row.id} href={`/admin/laboratoire/${row.id}`} data-lab-row>
                      <td className="pl-2">
                        <button type="button" onPointerDown={(e) => start(e, row, section.name)} aria-label={`Déplacer ${row.name}`} title="Glisser pour changer l’ordre ou le projet" style={{ touchAction: "none" }} className="inline-flex size-8 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing">
                          <MaterialIcon name="drag_indicator" className="size-5" />
                        </button>
                      </td>
                      <td className="truncate px-4 py-3 font-medium" title={row.name}>{row.name}</td>
                      <td className="whitespace-pre-line break-words px-4 py-3 text-muted">{row.description || "—"}</td>
                      <td className="px-4 py-3"><span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${row.kindTone}`}>{row.kindLabel}</span></td>
                      <td className="px-4 py-3"><Compatibility platforms={row.platforms} /></td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">{row.size}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{row.updated}</td>
                      <td className="pr-2 text-right"><RowMenu row={row} /></td>
                    </ClickableRow>,
                  ])}
                  {slotAt >= rows.length && <Slot height={drag!.height} />}
                  {!rows.length && slotAt < 0 && <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-muted">Aucune création dans ce projet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
      {/* Ligne tirée, qui suit le pointeur */}
      {drag && (
        <div style={{ top: drag.y - drag.offset, left: drag.left, width: drag.width, height: drag.height }} className="pointer-events-none fixed z-50 flex items-center gap-3 rounded-xl border border-accent bg-surface px-3 text-sm font-semibold shadow-2xl">
          <MaterialIcon name="drag_indicator" className="size-5 text-accent" />
          {drag.row.name}
          <span className={`ml-2 rounded-full border px-2.5 py-0.5 text-xs font-medium ${drag.row.kindTone}`}>{drag.row.kindLabel}</span>
        </div>
      )}
    </div>
  );
}

// Emplacement du dépôt (pointillés)
function Slot({ height }: { height: number }) {
  return (
    <tr aria-hidden>
      <td colSpan={8} className="p-1">
        <div style={{ height: Math.max(height - 8, 28) }} className="rounded-xl border-2 border-dashed border-accent bg-accent/5" />
      </td>
    </tr>
  );
}
