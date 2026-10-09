"use client";

import { createContext, useContext, useEffect, useRef, useTransition } from "react";
import { moveItem, usePointerSort, type SortDrag } from "./usePointerSort";

type Sort = ReturnType<typeof usePointerSort>;
const SortContext = createContext<Sort | null>(null);

// Glissement affiché sans réordonner les lignes côté React (les lignes venues du serveur ne sont pas
// toutes identifiables avant leur affichage) : la ligne tirée est masquée, celles qu'elle survole glissent
// d'une hauteur pour lui faire de la place, et un emplacement en pointillé marque l'endroit du dépôt.
export function shift(list: HTMLElement | null, drag: SortDrag | null) {
  if (!list) return;
  const items = [...list.children] as HTMLElement[];
  items.forEach((el, k) => {
    el.style.transition = "transform 150ms ease";
    el.style.visibility = drag && k === drag.from ? "hidden" : "";
    let y = 0;
    if (drag && drag.to > drag.from && k > drag.from && k <= drag.to) y = -drag.height;
    if (drag && drag.to < drag.from && k >= drag.to && k < drag.from) y = drag.height;
    el.style.transform = y ? `translateY(${y}px)` : "";
  });
}

// Haut (en coordonnées de page) de l'emplacement où la ligne tirée sera déposée
function slotTop(d: SortDrag) {
  if (d.to < d.from) return d.rects[d.to].top;
  if (d.to > d.from) return d.rects[d.to].top + d.rects[d.to].height - d.height;
  return d.rects[d.from].top;
}

// Corps de tableau réordonnable : chaque ligne porte data-sort-id (identifiant) et contient une SortHandle
// à tirer (souris, doigt ou flèches haut / bas au clavier). onReorder reçoit le nouvel ordre des identifiants.
export function SortableRows({ onReorder, children }: { onReorder: (ids: string[]) => Promise<void>; children: React.ReactNode }) {
  const [pending, start] = useTransition();
  const list = useRef<HTMLTableSectionElement>(null);
  const last = useRef<SortDrag | null>(null);
  const sort = usePointerSort((from, to, ids) => {
    start(() => onReorder(moveItem(ids, from, to)));
  });
  const drag = sort.drag;

  useEffect(() => {
    if (drag) last.current = drag;
    // Après le dépôt, les lignes restent à leur nouvelle place le temps que le serveur renvoie la liste
    shift(list.current, drag ?? (pending ? last.current : null));
    if (!drag && !pending) last.current = null;
  }, [drag, pending]);

  return (
    <SortContext.Provider value={sort}>
      <tbody ref={list} data-sort-list className={`divide-y divide-border ${pending ? "opacity-70" : ""}`}>
        {children}
      </tbody>
      {drag && (
        <tbody aria-hidden>
          <tr>
            <td className="p-0">
              <SortPreview drag={drag} />
            </td>
          </tr>
        </tbody>
      )}
    </SortContext.Provider>
  );
}

// Pendant un glissement : emplacement du dépôt (pointillés) et ligne tirée qui suit le pointeur
export function SortPreview({ drag }: { drag: SortDrag }) {
  return (
    <>
      {/* Emplacement du dépôt */}
      <div
        style={{ top: slotTop(drag) - window.scrollY + 4, left: drag.left + 4, width: drag.width - 8, height: Math.max(drag.height - 8, 24) }}
        className="pointer-events-none fixed z-40 rounded-xl border-2 border-dashed border-accent bg-accent/5"
      />
      {/* Ligne tirée, qui suit le pointeur */}
      <div
        style={{ top: drag.y - drag.offset, left: drag.left, width: drag.width, height: drag.height }}
        className="pointer-events-none fixed z-50 flex items-center gap-3 rounded-xl border border-accent bg-surface px-3 text-sm font-semibold shadow-2xl"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 text-accent" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
        {drag.label.replace(/^Modifier\s+/, "")}
      </div>
    </>
  );
}

// Poignée de déplacement d'une ligne (id : celui de la ligne)
export function SortHandle({ id, label }: { id: string; label: string }) {
  const sort = useContext(SortContext);
  // La ligne est retrouvée dans la page par son identifiant au moment du geste
  const props = sort ? sort.handle(-1, id) : {};
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
