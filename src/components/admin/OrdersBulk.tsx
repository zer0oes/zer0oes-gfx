"use client";

import { useEffect, useRef, useState } from "react";
import { orderStatuses } from "@/lib/store/types";

const boxes = (form: HTMLFormElement | null) => [...(form?.querySelectorAll<HTMLInputElement>('input[name="ids"]') ?? [])];

// Case « tout sélectionner » de l'en-tête du tableau
export function SelectAllOrders() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    const form = el?.form ?? null;
    if (!el || !form) return;
    const sync = () => {
      const all = boxes(form);
      const checked = all.filter((b) => b.checked).length;
      el.checked = checked > 0 && checked === all.length;
      el.indeterminate = checked > 0 && checked < all.length;
    };
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, []);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label="Sélectionner toutes les commandes affichées"
      className="size-4 accent-[var(--accent)]"
      onChange={(e) => {
        for (const b of boxes(e.currentTarget.form)) b.checked = e.currentTarget.checked;
        e.currentTarget.form?.dispatchEvent(new Event("change", { bubbles: true }));
      }}
    />
  );
}

// Barre d'action : nombre de commandes sélectionnées, nouveau statut, Appliquer
export function OrdersBulkBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const sync = () => setCount(boxes(form).filter((b) => b.checked).length);
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, []);
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
      <span aria-live="polite" className={count ? "font-semibold" : "text-muted"}>
        {count ? `${count} commande${count > 1 ? "s" : ""} sélectionnée${count > 1 ? "s" : ""}` : "Coche des commandes pour changer leur statut"}
      </span>
      <label className="flex items-center gap-2">
        <span className="text-muted">Nouveau statut</span>
        <select name="status" defaultValue="" disabled={!count} className="rounded-lg border border-border bg-background px-3 py-1.5 disabled:opacity-40">
          <option value="" disabled>
            Choisir…
          </option>
          {orderStatuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={!count} className="rounded-full bg-accent px-4 py-1.5 font-semibold text-background disabled:opacity-40">
        Appliquer
      </button>
    </div>
  );
}
