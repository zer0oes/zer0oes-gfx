"use client";

import { useRef, useState } from "react";

export type SortDrag = {
  from: number; // ligne tirée
  to: number; // place où elle sera déposée
  ids: string[]; // identifiants des lignes (data-sort-id) au début du geste, dans l'ordre affiché
  y: number; // position verticale du pointeur (écran)
  offset: number; // distance entre le haut de la ligne et le pointeur au moment de la saisir
  left: number;
  width: number;
  height: number; // hauteur de la ligne tirée (pour son emplacement)
  rects: { top: number; height: number }[]; // lignes au début du geste, en coordonnées de page
  label: string; // intitulé de la ligne tirée (aria-label)
};

// Lignes de la liste : enfants de l'élément [data-sort-list]
const rowsOf = (from: Element) => {
  const list = from.closest<HTMLElement>("[data-sort-list]");
  return list ? ([...list.children] as HTMLElement[]) : [];
};

// Réordonner une liste en tirant une poignée (souris, doigt ou stylet), sans le glisser-déposer HTML :
// fiable partout, y compris sur tactile. L'élément dont les enfants sont les lignes porte l'attribut data-sort-list.
// La ligne tirée est retrouvée dans la page au moment du geste (par son data-sort-id, sinon par sa place) :
// pas de décalage possible entre l'affichage et l'ordre connu du composant.
// Les positions des lignes sont relevées au début du geste : l'affichage peut se réorganiser pendant le geste
// (emplacement en pointillé) sans fausser le calcul.
// onMove(from, to, ids) : ids = identifiants des lignes au début du geste.
export function usePointerSort(onMove: (from: number, to: number, ids: string[]) => void) {
  const [drag, setDrag] = useState<SortDrag | null>(null);
  const current = useRef<SortDrag | null>(null);

  // index : place de la ligne ; id : son data-sort-id (prioritaire, toujours à jour)
  const handle = (index: number, id?: string) => {
    const locate = (target: Element) => {
      const items = rowsOf(target);
      const i = id ? items.findIndex((el) => el.dataset.sortId === id) : index;
      return { items, i };
    };
    return {
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        const { items, i } = locate(e.currentTarget);
        const row = items[i]?.getBoundingClientRect();
        if (!row) return;
        e.preventDefault();
        const ids = items.map((el, k) => el.dataset.sortId ?? String(k));
        // Milieux des autres lignes, en coordonnées de page
        const mids = items.filter((_, k) => k !== i).map((el) => {
          const r = el.getBoundingClientRect();
          return r.top + window.scrollY + r.height / 2;
        });
        const rects = items.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top + window.scrollY, height: r.height };
        });
        const label = items[i].getAttribute("aria-label") ?? "";
        const base = { from: i, ids, rects, label, offset: e.clientY - row.top, left: row.left, width: row.width, height: row.height };
        const update = (y: number) => {
          const to = mids.filter((mid) => mid < y + window.scrollY).length;
          current.current = { ...base, to, y };
          setDrag(current.current);
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
          if (done && done.from !== done.to) onMove(done.from, done.to, done.ids);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      },
      // Clavier : flèches haut et bas
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        const { items, i } = locate(e.currentTarget);
        const to = i + (e.key === "ArrowUp" ? -1 : 1);
        if (i >= 0 && to >= 0 && to < items.length) onMove(i, to, items.map((el, k) => el.dataset.sortId ?? String(k)));
      },
      style: { touchAction: "none" } as React.CSSProperties,
    };
  };

  return { drag, handle };
}

// Déplace un élément d'une liste
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
