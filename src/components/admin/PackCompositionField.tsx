"use client";

import { useEffect, useRef, useState } from "react";
import { compositionLine, compositionValue, MAX_QTY, savingPercent, type PackComposition } from "@/lib/pack-composition";
import { formatPrice, type Option } from "@/lib/pricing";
import { MaterialIcon } from "./MaterialIcon";
import { shift, SortPreview } from "./SortableRows";
import { moveItem, usePointerSort } from "./usePointerSort";

export type CompositionOption = Option & { nameEn: string; priceLabel: string; categoryName: string };
type FormulaRef = { id: string; label: string; price: number; priceField: string };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const euro = (cents: number) => formatPrice(cents);

// Prix en centimes tapé dans un champ du formulaire de l'offre (« 690 », « 690,50 »), sinon null
function fieldPrice(form: HTMLFormElement | null, name: string) {
  const raw = (form?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
  const s = raw.replace(/\s|€/g, "").replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 100) : null;
}

// Ajoute des lignes à la fin d'une liste « une par ligne » du formulaire (sans doublon)
function appendLines(form: HTMLFormElement | null, name: string, lines: string[]) {
  const area = form?.elements.namedItem(name) as HTMLTextAreaElement | null;
  if (!area) return 0;
  const current = area.value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const added = lines.filter((l) => !current.includes(l));
  if (!added.length) return 0;
  area.value = [...current, ...added].join("\n");
  area.dispatchEvent(new Event("input", { bubbles: true }));
  return added.length;
}

// Composition d'une offre, formule par formule : produits à la carte et quantités, valeur à la carte
// comparée au prix de la formule (relu en direct dans le formulaire), et ajout des produits aux livrables.
export function PackCompositionField({ formId, formulas, options, initial }: { formId: string; formulas: FormulaRef[]; options: CompositionOption[]; initial: PackComposition }) {
  const [composition, setComposition] = useState<PackComposition>(initial);
  const [prices, setPrices] = useState<Record<string, number | null>>(() => Object.fromEntries(formulas.map((f) => [f.id, f.price])));
  const [notice, setNotice] = useState("");

  // Prix des formules relus quand on les modifie dans le formulaire
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const read = () => setPrices(Object.fromEntries(formulas.map((f) => [f.id, fieldPrice(form, f.priceField)])));
    form.addEventListener("input", read);
    return () => form.removeEventListener("input", read);
  }, [formId, formulas]);

  const setItems = (formula: string, items: PackComposition[string]) => setComposition((c) => ({ ...c, [formula]: items }));
  const categories = [...new Set(options.map((o) => o.categoryName))];

  const addToDeliverables = (formula: string) => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    const items = composition[formula] ?? [];
    const found = items.flatMap((item) => {
      const option = options.find((o) => o.id === item.option);
      return option ? [{ item, option }] : [];
    });
    const fr = appendLines(form, "deliverables", found.map(({ item, option }) => compositionLine(item, option)));
    appendLines(form, "en:deliverables", found.map(({ item, option }) => compositionLine(item, { name: option.nameEn })));
    setNotice(fr ? `${fr} ligne${fr > 1 ? "s" : ""} ajoutée${fr > 1 ? "s" : ""} aux livrables (français et anglais). Pense à enregistrer l'offre.` : "Ces produits sont déjà dans les livrables.");
  };

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Composition à partir des produits à la carte</legend>
      <p className="mb-3 text-xs text-muted">
        Ajoute les produits que contient chaque formule : la valeur à la carte (prix habituels, hors remise temporaire) s&apos;affiche à côté du prix de la formule pour t&apos;aider à fixer un prix cohérent. Visible seulement dans l&apos;admin.
      </p>
      <input type="hidden" name="composition" value={JSON.stringify(composition)} />
      <div className="space-y-4">
        {formulas.map((f) => (
          <FormulaComposition key={f.id} formula={f} price={prices[f.id] ?? null} items={composition[f.id] ?? []} options={options} categories={categories}
            onChange={(items) => setItems(f.id, items)} onDeliverables={() => addToDeliverables(f.id)} single={formulas.length === 1} />
        ))}
      </div>
      {notice && <p role="status" className="mt-2 text-xs text-emerald-300">{notice}</p>}
    </fieldset>
  );
}

function FormulaComposition({ formula, price, items, options, categories, onChange, onDeliverables, single }: {
  formula: FormulaRef; price: number | null; items: PackComposition[string]; options: CompositionOption[]; categories: string[];
  onChange: (items: PackComposition[string]) => void; onDeliverables: () => void; single: boolean;
}) {
  const list = useRef<HTMLUListElement>(null);
  const sort = usePointerSort((from, to) => onChange(moveItem(items, from, to)));
  useEffect(() => shift(list.current, sort.drag), [sort.drag]);
  const value = compositionValue(items, options);
  const saving = price === null ? null : savingPercent(price, value.total);

  const add = (id: string) => {
    if (!id) return;
    const i = items.findIndex((item) => item.option === id);
    onChange(i < 0 ? [...items, { option: id, qty: 1 }] : items.map((item, k) => (k === i ? { ...item, qty: Math.min(item.qty + 1, MAX_QTY) } : item)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border bg-surface px-4 py-2.5">
        <span className="text-sm font-semibold">{single ? "Contenu de l'offre" : formula.label}</span>
        <span className="text-xs text-muted">
          {items.length ? <>Valeur à la carte : <strong className="text-foreground">{value.priceFrom ? "à partir de " : ""}{euro(value.total)}</strong></> : "Aucun produit"}
          {items.length > 0 && price !== null && <> · Prix : <strong className="text-foreground">{euro(price)}</strong>
            {saving !== null && value.total > 0 && <span className={`ml-2 rounded-full px-2 py-0.5 font-medium ${saving > 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
              {saving > 0 ? `−${saving} %` : saving === 0 ? "même prix" : `+${-saving} % (plus cher qu'à la carte)`}
            </span>}
          </>}
        </span>
      </div>
      {items.length > 0 && (
        <ul ref={list} data-sort-list className="divide-y divide-border">
          {items.map((item, i) => {
            const option = options.find((o) => o.id === item.option);
            const name = option?.name ?? `Produit supprimé (${item.option})`;
            return (
              <li key={item.option} data-sort-id={item.option} aria-label={name} className="grid grid-cols-[auto_1fr_4.5rem_auto_auto] items-center gap-2 bg-background px-2 py-1.5 text-sm">
                <span {...sort.handle(i, item.option)} role="button" tabIndex={0} aria-label={`Déplacer ${name} (flèches haut et bas)`} title="Glisser pour changer l’ordre · ↑/↓ au clavier"
                  className="inline-flex size-7 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing"><MaterialIcon name="drag_indicator" className="size-5" /></span>
                <span className={option ? "" : "text-amber-300"}>{name}{option && <span className="ml-2 text-xs text-muted">{option.priceLabel}</span>}</span>
                <input type="number" min={1} max={MAX_QTY} value={item.qty} aria-label={`Quantité de ${name}`}
                  onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, qty: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(e.target.value)) || 1)) } : x)))}
                  className="w-full rounded-lg border border-border bg-background px-2 py-1 text-right text-sm" />
                <span className="w-20 text-right text-xs text-muted">{option ? euro((option.normalPrice ?? option.price) * item.qty) : "—"}</span>
                <button type="button" onClick={() => window.confirm("Es-tu sûre de vouloir supprimer ?") && onChange(items.filter((_, k) => k !== i))}
                  aria-label={`Retirer ${name}`} title="Retirer de la formule" className="inline-flex size-7 items-center justify-center rounded text-muted hover:bg-red-400/10 hover:text-red-300">
                  <MaterialIcon name="delete" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {sort.drag && <SortPreview drag={sort.drag} />}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">
        <select defaultValue="" onChange={(e) => { add(e.target.value); e.target.value = ""; }} aria-label={`Ajouter un produit à ${formula.label}`} className={`${input} max-w-xs py-1.5`}>
          <option value="">+ Ajouter un produit…</option>
          {categories.map((category) => (
            <optgroup key={category} label={category}>
              {options.filter((o) => o.categoryName === category).map((o) => <option key={o.id} value={o.id}>{o.name} · {o.priceLabel}</option>)}
            </optgroup>
          ))}
        </select>
        {items.length > 0 && (
          <button type="button" onClick={onDeliverables} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-accent hover:text-accent">
            Ajouter ces produits aux livrables
          </button>
        )}
      </div>
    </div>
  );
}
