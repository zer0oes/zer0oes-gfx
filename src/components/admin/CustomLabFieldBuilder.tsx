"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldDefinition } from "@/lib/custom-lab/types";
import { MaterialIcon } from "./MaterialIcon";
import { shift, SortPreview } from "./SortableRows";
import { moveItem, usePointerSort } from "./usePointerSort";

// Types de champs reconnus par StreamElements et Streamlabs (les autres restent modifiables en JSON)
export const fieldTypes = [
  ["text", "Texte"],
  ["textfield", "Texte long"],
  ["number", "Nombre"],
  ["slider", "Curseur"],
  ["colorpicker", "Couleur"],
  ["checkbox", "Case à cocher"],
  ["dropdown", "Liste déroulante"],
  ["image-input", "Image"],
  ["video-input", "Vidéo"],
  ["sound-input", "Son"],
  ["googleFont", "Police Google"],
  ["fontpicker", "Police (Streamlabs)"],
  ["button", "Bouton"],
  ["hidden", "Caché"],
] as const;

type Row = { key: string; field: FieldDefinition };
const input = "w-full rounded-md border border-[var(--cl-line)] bg-[#0d0f13] px-2 py-1.5 text-xs";
const keyPattern = /^[A-Za-z_][\w-]{0,63}$/;

function toRows(source: string): Row[] | null {
  try {
    const parsed: unknown = JSON.parse(source || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return Object.entries(parsed as Record<string, FieldDefinition>).map(([key, field]) => ({ key, field: field && typeof field === "object" ? field : { type: "text" } }));
  } catch {
    return null;
  }
}
const toJson = (rows: Row[]) => JSON.stringify(Object.fromEntries(rows.map((r) => [r.key, r.field])), null, 2);
// Valeur par défaut adaptée au nouveau type
function coerce(type: string, value: unknown) {
  if (type === "number" || type === "slider") return numberOrUndefined(String(value ?? ""));
  if (type === "checkbox") return Boolean(value);
  if (type === "button") return undefined;
  return value === undefined || value === null || typeof value === "boolean" ? "" : String(value);
}
const numberOrUndefined = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? undefined : Number(v));

// Éditeur visuel des champs (Fields) : ajout, nom, type, libellé, valeur par défaut, options, ordre et suppression
export function CustomLabFieldBuilder({ value, onChange }: { value: string; onChange: (json: string) => void }) {
  const rows = toRows(value);
  const [open, setOpen] = useState<string | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const sort = usePointerSort((from, to) => { if (rows) onChange(toJson(moveItem(rows, from, to))); });
  useEffect(() => shift(list.current, sort.drag), [sort.drag]);
  if (!rows) return <p className="cl-field-hint p-4">Le JSON de Fields est invalide : corrige-le dans la vue JSON pour retrouver l’éditeur visuel.</p>;

  const commit = (next: Row[]) => onChange(toJson(next));
  const update = (i: number, patch: Partial<FieldDefinition>) => commit(rows.map((r, k) => (k === i ? { ...r, field: { ...r.field, ...patch } } : r)));
  const rename = (i: number, key: string) => {
    if (!keyPattern.test(key) || rows.some((r, k) => k !== i && r.key === key)) return;
    if (open === rows[i].key) setOpen(key);
    commit(rows.map((r, k) => (k === i ? { ...r, key } : r)));
  };
  const add = () => {
    let n = rows.length + 1;
    while (rows.some((r) => r.key === `champ${n}`)) n++;
    const key = `champ${n}`;
    commit([...rows, { key, field: { type: "text", label: "Nouveau champ", value: "" } }]);
    setOpen(key);
  };

  return (
    <div className="p-3 text-xs">
      {!rows.length && <p className="cl-field-hint">Aucun champ pour l’instant.</p>}
      <div ref={list} data-sort-list>
      {rows.map(({ key, field }, i) => {
        const isOpen = open === key;
        const typeLabel = fieldTypes.find(([t]) => t === field.type)?.[1] ?? field.type;
        const numeric = field.type === "number" || field.type === "slider";
        return (
          <div key={key} aria-label={field.label || key} className="py-1">
          <div className="rounded-md border border-[var(--cl-line)] bg-[#11131a]">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <span {...sort.handle(i)} role="button" tabIndex={0} aria-label={`Déplacer ${field.label || key} (flèches haut et bas)`} title="Glisser pour changer l’ordre · ↑/↓ au clavier" className="inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded text-[var(--cl-muted)] hover:bg-[#ac8bfa1f] hover:text-[var(--cl-accent)] active:cursor-grabbing"><MaterialIcon name="drag_indicator" className="size-5" /></span>
              <button type="button" onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className={`inline-flex text-[var(--cl-muted)] transition-transform ${isOpen ? "" : "-rotate-90"}`}><MaterialIcon name="expand_more" className="size-4" /></span>
                <span className="truncate font-semibold">{field.label || key}</span>
                <code className="text-[10px] text-[var(--cl-muted)]">{key}</code>
                <span className="ml-auto shrink-0 rounded-full border border-[var(--cl-line)] px-2 py-0.5 text-[10px] text-[var(--cl-muted)]">{typeLabel}</span>
              </button>
              <button type="button" onClick={() => window.confirm(`Supprimer le champ « ${field.label || key} » ?`) && commit(rows.filter((_, k) => k !== i))} aria-label={`Supprimer ${key}`} title="Supprimer" className="cl-icon-button hover:text-red-300">
                <MaterialIcon name="delete" className="size-4" />
              </button>
            </div>
            {isOpen && (
              <div className="grid gap-2 border-t border-[var(--cl-line)] p-2 sm:grid-cols-2">
                <label className="grid gap-1">Identifiant (dans le code)<input className={input} defaultValue={key} onBlur={(e) => rename(i, e.target.value.trim())} /></label>
                <label className="grid gap-1">Type<select className={input} value={field.type} onChange={(e) => update(i, { type: e.target.value, value: coerce(e.target.value, field.value) })}>{fieldTypes.map(([t, l]) => <option key={t} value={t}>{l}</option>)}{!fieldTypes.some(([t]) => t === field.type) && <option value={field.type}>{field.type}</option>}</select></label>
                <label className="grid gap-1 sm:col-span-2">Libellé<input className={input} value={field.label ?? ""} onChange={(e) => update(i, { label: e.target.value })} /></label>
                {field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" checked={Boolean(field.value)} onChange={(e) => update(i, { value: e.target.checked })} /> Coché par défaut</label>
                ) : field.type === "colorpicker" ? (
                  <label className="grid gap-1 sm:col-span-2">Couleur par défaut<input type="color" className="h-8 w-full" value={typeof field.value === "string" && /^#[0-9a-f]{6}$/i.test(field.value) ? field.value : "#ffffff"} onChange={(e) => update(i, { value: e.target.value })} /></label>
                ) : field.type !== "button" ? (
                  <label className="grid gap-1 sm:col-span-2">Valeur par défaut<input className={input} type={numeric ? "number" : "text"} value={field.value === undefined || field.value === null ? "" : String(field.value)} onChange={(e) => update(i, { value: numeric ? numberOrUndefined(e.target.value) : e.target.value })} /></label>
                ) : null}
                {numeric && (
                  <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                    <label className="grid gap-1">Min<input className={input} type="number" value={field.min ?? ""} onChange={(e) => update(i, { min: numberOrUndefined(e.target.value) })} /></label>
                    <label className="grid gap-1">Max<input className={input} type="number" value={field.max ?? ""} onChange={(e) => update(i, { max: numberOrUndefined(e.target.value) })} /></label>
                    <label className="grid gap-1">Pas<input className={input} type="number" value={field.step ?? ""} onChange={(e) => update(i, { step: numberOrUndefined(e.target.value) })} /></label>
                  </div>
                )}
                {field.type === "dropdown" && (
                  <label className="grid gap-1 sm:col-span-2">
                    Options (une par ligne : valeur = libellé)
                    <textarea
                      className={`${input} min-h-20 font-mono`}
                      defaultValue={Object.entries(field.options ?? {}).map(([v, l]) => `${v} = ${l}`).join("\n")}
                      onBlur={(e) => update(i, { options: Object.fromEntries(e.target.value.split("\n").map((line) => line.split("=").map((p) => p.trim())).filter(([v]) => v).map(([v, l]) => [v, l || v])) })}
                    />
                  </label>
                )}
                {field.type === "button" && <p className="cl-field-hint sm:col-span-2">Un bouton envoie un événement au widget quand on clique dessus dans la plateforme.</p>}
              </div>
            )}
          </div>
          </div>
        );
      })}
      </div>
      {sort.drag && <SortPreview drag={sort.drag} />}
      <button type="button" onClick={add} className="mt-2 rounded-full border border-dashed border-[var(--cl-line)] px-3 py-1.5 text-[var(--cl-accent)] hover:border-[var(--cl-accent)]">+ Ajouter un champ</button>
    </div>
  );
}
