"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatPrice, optionCategories, optionCategory, type Option } from "@/lib/pricing";
import { TranslationInput } from "./TranslationTabs";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

export function OptionRows({ options }: { options: Option[] }) {
  const [rows, setRows] = useState<(Option | undefined)[]>(options);
  const [order, setOrder] = useState(() => options.map((_, i) => i));
  const [dragging, setDragging] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const dialogs = useRef<(HTMLDialogElement | null)[]>([]);
  const selectAll = useRef<HTMLInputElement | null>(null);
  const id = useId();
  const visible = order.map((i) => ({ o: rows[i], i })).filter(({ o }) => !o || (
    (!category || optionCategory(o) === category)
    && (!minPrice || o.price >= Number(minPrice.replace(",", ".")) * 100)
    && (!maxPrice || o.price <= Number(maxPrice.replace(",", ".")) * 100)
  ));
  if (sort) visible.sort((a, b) => ((a.o?.price ?? 0) - (b.o?.price ?? 0)) * (sort === "asc" ? 1 : -1));
  const allVisibleChecked = visible.length > 0 && visible.every(({ i }) => checked.has(i));
  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = !allVisibleChecked && visible.some(({ i }) => checked.has(i));
  }, [allVisibleChecked, visible, checked]);
  useEffect(() => {
    dialogs.current.forEach((dialog, i) => {
      if (!dialog) return;
      if (i === selected && !dialog.open) dialog.showModal();
      else if (i !== selected && dialog.open) dialog.close();
    });
  }, [selected]);
  const toggle = (index: number) => setChecked((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index); else next.add(index);
    return next;
  });
  const move = (from: number, to: number) => {
    if (from === to) return;
    setOrder((current) => {
      const next = [...current];
      const destination = next.indexOf(to);
      next.splice(next.indexOf(from), 1);
      next.splice(destination, 0, from);
      return next;
    });
  };
  return (
    <>
      <p role="status" className="text-xs text-muted">{visible.length} option{visible.length > 1 ? "s" : ""} affichée{visible.length > 1 ? "s" : ""}</p>
      <p className="text-xs text-muted">Déplace les lignes avec la poignée, puis enregistre les options.{sort && " Réinitialise le tri par prix pour modifier l’ordre du catalogue."}</p>
      {checked.size > 0 && <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-muted">{checked.size} sélectionnée{checked.size > 1 ? "s" : ""}</span>
        <button type="submit" name="bulkDelete" value="1" aria-label="Supprimer la sélection" title="Supprimer la sélection" className="inline-flex size-10 items-center justify-center rounded-full border border-red-400/50 text-red-300 hover:bg-red-400/10">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
        </button>
        <button type="button" onClick={() => setChecked(new Set())} className="text-sm text-muted hover:text-foreground">Désélectionner</button>
      </div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-2 py-3"><span className="sr-only">Ordre</span></th>
              <th scope="col" className="px-4 py-3 align-top"><input ref={selectAll} type="checkbox" checked={allVisibleChecked} aria-label="Sélectionner toutes les options affichées" onChange={() => setChecked((current) => { const next = new Set(current); visible.forEach(({ i }) => { if (allVisibleChecked) next.delete(i); else next.add(i); }); return next; })} className="accent-[var(--accent)]" /></th>
              <th scope="col" className="px-4 py-3 align-top">Option</th>
              <th scope="col" className="px-4 py-3 align-top">
                <span className="block mb-2">Catégorie</span>
                <select aria-label="Filtrer par catégorie" value={category} onChange={(e) => setCategory(e.target.value)} className={`${input} min-w-40 font-normal normal-case tracking-normal`}><option value="">Toutes</option>{optionCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
              </th>
              <th scope="col" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : "none"} className="px-4 py-3 align-top">
                <button type="button" onClick={() => setSort(sort === "asc" ? "desc" : "asc")} aria-label={sort === "asc" ? "Trier les prix par ordre décroissant" : "Trier les prix par ordre croissant"} className="mb-2 inline-flex cursor-pointer items-center gap-2 uppercase tracking-wider hover:text-accent">Prix <span aria-hidden className={sort ? "text-accent" : "text-muted"}>{sort === "asc" ? "↑" : sort === "desc" ? "↓" : "↕"}</span></button>
                <div className="flex gap-2 font-normal normal-case tracking-normal">
                  <input aria-label="Prix minimum en euros" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} inputMode="decimal" placeholder="Min €" className={`${input} w-24`} />
                  <input aria-label="Prix maximum en euros" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} inputMode="decimal" placeholder="Max €" className={`${input} w-24`} />
                </div>
              </th>
              <th scope="col" className="px-4 py-3 align-top"><span className="sr-only">Actions</span>{(category || minPrice || maxPrice || sort) && <button type="button" onClick={() => { setCategory(""); setMinPrice(""); setMaxPrice(""); setSort(""); }} className="text-accent normal-case tracking-normal font-normal">Réinitialiser</button>}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map(({ o, i }, index) => <tr key={i}
              onDragOver={(event) => { if (dragging !== null && !sort) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(i); } }}
              onDrop={(event) => { event.preventDefault(); if (dragging !== null && !sort) move(dragging, i); setDragging(null); setDropTarget(null); }}
              className={`${selected === i ? "bg-accent/10" : "hover:bg-background/50"} ${dragging === i ? "opacity-40" : ""} ${dropTarget === i && dragging !== i ? "outline-2 outline-accent -outline-offset-2" : ""}`}>
              <td className="px-2 py-3">
                <button type="button" draggable={!sort} disabled={!!sort} aria-label={`Déplacer ${o?.name ?? "la nouvelle option"}`} title="Glisser pour déplacer · ↑/↓ au clavier"
                  onDragStart={(event) => { setDragging(i); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", String(i)); const row = event.currentTarget.closest("tr"); if (row) event.dataTransfer.setDragImage(row, 20, 20); }}
                  onDragEnd={() => { setDragging(null); setDropTarget(null); }}
                  onKeyDown={(event) => { if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return; event.preventDefault(); const target = visible[index + (event.key === "ArrowUp" ? -1 : 1)]; if (target) move(i, target.i); }}
                  className="inline-flex size-8 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing disabled:cursor-default disabled:opacity-30">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
                </button>
              </td>
              <td className="px-4 py-3"><input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} aria-label={`Sélectionner ${o?.name ?? "la nouvelle option"}`} className="accent-[var(--accent)]" /></td>
              <td className="px-4 py-3"><button type="button" onClick={() => setSelected(selected === i ? null : i)} className="cursor-pointer text-left font-semibold hover:text-accent">{o?.name ?? "Nouvelle option"}</button></td>
              <td className="px-4 py-3 text-muted">{o ? optionCategories.find((c) => c.id === optionCategory(o))?.label : "—"}</td>
              <td className="whitespace-nowrap px-4 py-3">{o ? `${o.priceFrom ? "À partir de " : ""}${formatPrice(o.price)}` : "—"}</td>
              <td className="px-4 py-3"><button type="button" onClick={() => setSelected(i)} aria-label={`Modifier ${o?.name ?? "la nouvelle option"}`} title="Modifier" className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-accent hover:bg-accent/10">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>
              </button></td>
            </tr>)}
            {!visible.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted">Aucune option ne correspond aux filtres.</td></tr>}
          </tbody>
        </table>
      </div>
      {[...checked].map((i) => <input key={i} type="hidden" name={`delete_${i}`} value="on" />)}
      {order.map((i, position) => <input key={i} type="hidden" name={`position_${i}`} value={position} />)}
      {rows.map((o, i) => (
        <dialog key={i} ref={(node) => { dialogs.current[i] = node; }} aria-labelledby={`${id}-title-${i}`} onClose={() => setSelected((current) => current === i ? null : current)} onCancel={() => setSelected(null)} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 id={`${id}-title-${i}`} className="font-display text-xl font-bold">{o ? "Modifier l’option" : "Nouvelle option"}</h2><button type="button" onClick={() => setSelected(null)} aria-label="Fermer la modale" className="text-xl text-muted hover:text-foreground">×</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name={`id_${i}`} defaultValue={o?.id} />
          <label className="text-xs text-muted">Nom<TranslationInput translationKey={`translation:option:${o?.id ?? `new-${i}`}:name`} name={`name_${i}`} defaultValue={o?.name} placeholder="Nouvelle option" className={input} /></label>
          <label className="text-xs text-muted">Catégorie<select name={`category_${i}`} defaultValue={o ? optionCategory(o) : "overlays"} className={input}>{optionCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
          <label className="text-xs text-muted">Prix (€)<input name={`price_${i}`} defaultValue={o ? (o.price / 100).toString().replace(".", ",") : ""} inputMode="decimal" className={input} /></label>
          <label className="text-xs text-muted">Unité (facultative)<TranslationInput translationKey={`translation:option:${o?.id ?? `new-${i}`}:unit`} name={`unit_${i}`} defaultValue={o?.unit} className={input} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`from_${i}`} defaultChecked={o?.priceFrom} />À partir de</label>
        </div>
        <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="rounded-full border border-border px-5 py-2 text-sm">Fermer</button><button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background">Enregistrer</button></div>
        </dialog>
      ))}
      <button type="button" onClick={() => { setSelected(rows.length); setOrder((current) => [...current, rows.length]); setRows((current) => [...current, undefined]); }} className="rounded-full border border-accent px-5 py-2 text-sm text-accent hover:bg-accent/10">+ Ajouter une option</button>
    </>
  );
}
