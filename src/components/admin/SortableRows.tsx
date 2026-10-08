"use client";

import { Children, cloneElement, isValidElement, useState, useTransition } from "react";

// Corps de tableau réordonnable par glisser-déposer (poignée de chaque ligne, ou flèches ↑ ↓ au clavier).
// Chaque ligne enfant porte la clé de son élément ; onReorder reçoit le nouvel ordre des clés.
export function SortableRows({ onReorder, children }: { onReorder: (ids: string[]) => Promise<void>; children: React.ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  const keyOf = (row: React.ReactElement) => String(row.key).replace(/^\.\$/, "");
  const [order, setOrder] = useState(() => rows.map(keyOf));
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const byKey = new Map(rows.map((r) => [keyOf(r), r]));
  // Lignes ajoutées ou retirées depuis le serveur : on suit l'ordre reçu
  const current = order.filter((k) => byKey.has(k)).concat(rows.map(keyOf).filter((k) => !order.includes(k)));

  const move = (from: string, to: string) => {
    if (from === to) return;
    const next = current.filter((k) => k !== from);
    next.splice(next.indexOf(to) + (current.indexOf(from) < current.indexOf(to) ? 1 : 0), 0, from);
    setOrder(next);
    start(() => onReorder(next));
  };
  const rowOf = (e: React.SyntheticEvent) => (e.target as HTMLElement).closest<HTMLElement>("tr[data-sort-id]")?.dataset.sortId;

  return (
    <tbody
      className={`divide-y divide-border ${pending ? "opacity-70" : ""}`}
      onDragStart={(e) => {
        const id = rowOf(e);
        if (!id) return;
        setDragging(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        const row = (e.target as HTMLElement).closest("tr");
        if (row) e.dataTransfer.setDragImage(row, 20, 20);
      }}
      onDragOver={(e) => {
        const id = rowOf(e);
        if (!dragging || !id) return;
        e.preventDefault();
        setOver(id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = rowOf(e);
        if (dragging && id) move(dragging, id);
        setDragging(null);
        setOver(null);
      }}
      onDragEnd={() => {
        setDragging(null);
        setOver(null);
      }}
      onKeyDown={(e) => {
        if ((e.key !== "ArrowUp" && e.key !== "ArrowDown") || !(e.target as HTMLElement).dataset.sortHandle) return;
        const id = rowOf(e);
        if (!id) return;
        e.preventDefault();
        const i = current.indexOf(id);
        const target = current[i + (e.key === "ArrowUp" ? -1 : 1)];
        if (target) move(id, target);
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`tr[data-sort-id="${CSS.escape(id)}"] [data-sort-handle]`)?.focus());
      }}
    >
      {current.map((k) => (
        <SortableContext key={k} id={k} dragging={dragging === k} over={over === k && dragging !== k}>
          {byKey.get(k)}
        </SortableContext>
      ))}
    </tbody>
  );
}

function SortableContext({ dragging, over, children }: { id: string; dragging: boolean; over: boolean; children: React.ReactNode }) {
  if (!isValidElement<{ className?: string }>(children)) return <>{children}</>;
  return cloneElement(children, { className: `${children.props.className ?? ""} ${dragging ? "opacity-40" : ""} ${over ? "outline-2 -outline-offset-2 outline-accent" : ""}` });
}

// Poignée de déplacement (dans une cellule de la ligne)
export function SortHandle({ label }: { label: string }) {
  return (
    <span
      data-sort-handle="1"
      role="button"
      tabIndex={0}
      draggable
      aria-label={`Déplacer ${label} (flèches haut et bas)`}
      title="Glisser pour déplacer · ↑/↓ au clavier"
      className="inline-flex size-8 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
    </span>
  );
}
