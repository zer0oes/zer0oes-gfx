"use client";

import { Children, cloneElement, createContext, isValidElement, useContext, useState, useTransition } from "react";
import { moveItem, usePointerSort } from "./usePointerSort";

type Sort = ReturnType<typeof usePointerSort> & { order: string[] };
const SortContext = createContext<Sort | null>(null);

// Corps de tableau réordonnable : chaque ligne (clé = identifiant) contient une SortHandle à tirer
// (souris, doigt ou flèches haut / bas au clavier). onReorder reçoit le nouvel ordre des identifiants.
export function SortableRows({ onReorder, children }: { onReorder: (ids: string[]) => Promise<void>; children: React.ReactNode }) {
  const rows = Children.toArray(children).filter(isValidElement);
  const keyOf = (row: React.ReactElement) => String(row.key).replace(/^\.\$/, "");
  const [order, setOrder] = useState(() => rows.map(keyOf));
  const [pending, start] = useTransition();
  const byKey = new Map(rows.map((r) => [keyOf(r), r]));
  // Lignes ajoutées ou retirées depuis le serveur : on suit l'ordre reçu
  const current = order.filter((k) => byKey.has(k)).concat(rows.map(keyOf).filter((k) => !order.includes(k)));
  const sort = usePointerSort((from, to) => {
    const next = moveItem(current, from, to);
    setOrder(next);
    start(() => onReorder(next));
  });

  return (
    <SortContext.Provider value={{ ...sort, order: current }}>
      <tbody data-sort-list className={`divide-y divide-border ${pending ? "opacity-70" : ""}`}>
        {current.map((k, i) => {
          const row = byKey.get(k) as React.ReactElement<{ className?: string }>;
          return cloneElement(row, { key: k, className: `${row.props.className ?? ""} ${sort.rowClass(i)}` });
        })}
      </tbody>
    </SortContext.Provider>
  );
}

// Poignée de déplacement d'une ligne (id : celui de la ligne)
export function SortHandle({ id, label }: { id: string; label: string }) {
  const sort = useContext(SortContext);
  const index = sort?.order.indexOf(id) ?? -1;
  const props = sort && index >= 0 ? sort.handle(index) : {};
  return (
    <span
      {...props}
      data-sort-handle="1"
      role="button"
      tabIndex={0}
      aria-label={`Déplacer ${label} (flèches haut et bas)`}
      title="Glisser pour déplacer · ↑/↓ au clavier"
      className="inline-flex size-8 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
    </span>
  );
}
