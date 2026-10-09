"use client";

import { useRef, useState } from "react";

// Réordonner une liste en tirant une poignée (souris, doigt ou stylet), sans le glisser-déposer HTML :
// fiable partout, y compris sur tactile. L'élément dont les enfants sont les lignes porte l'attribut data-sort-list.
// Pendant le geste, `drag` donne la ligne tirée et la place où elle sera déposée (pour l'affichage).
export function usePointerSort(onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<{ from: number; to: number } | null>(null);
  const current = useRef<{ from: number; to: number } | null>(null);

  const handle = (index: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const list = (e.currentTarget as HTMLElement).closest<HTMLElement>("[data-sort-list]");
      if (!list) return;
      e.preventDefault();
      const items = [...list.children] as HTMLElement[];
      const update = (y: number) => {
        // Nombre de lignes (hors celle tirée) dont le milieu est au-dessus du pointeur = nouvelle place
        const to = items.filter((el, i) => i !== index && el.getBoundingClientRect().top + el.offsetHeight / 2 < y).length;
        current.current = { from: index, to };
        setDrag({ from: index, to });
      };
      update(e.clientY);
      const move = (ev: PointerEvent) => update(ev.clientY);
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        const done = current.current;
        current.current = null;
        setDrag(null);
        if (done && done.from !== done.to) onMove(done.from, done.to);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },
    // Clavier : flèches haut et bas
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const count = (e.currentTarget as HTMLElement).closest("[data-sort-list]")?.children.length ?? 0;
      const to = index + (e.key === "ArrowUp" ? -1 : 1);
      if (to >= 0 && to < count) onMove(index, to);
    },
    style: { touchAction: "none" } as React.CSSProperties,
  });

  // Classes d'une ligne pendant le geste : ligne tirée estompée, trait à l'endroit du dépôt
  const rowClass = (index: number) => {
    if (!drag) return "";
    if (index === drag.from) return "opacity-40";
    const above = drag.to > drag.from ? index === drag.to : index === drag.to;
    if (!above) return "";
    return drag.to > drag.from ? "shadow-[inset_0_-3px_0_var(--accent)]" : "shadow-[inset_0_3px_0_var(--accent)]";
  };

  return { drag, handle, rowClass };
}

// Déplace un élément d'une liste
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
