"use client";

import { useEffect, useRef, useState } from "react";
import { BASE, compositionValue, MAX_QTY, optionValue, savingPercent, type CompositionItem, type PackComposition } from "@/lib/pack-composition";
import { formatPrice, type Option } from "@/lib/pricing";
import { MaterialIcon } from "./MaterialIcon";
import { shift, SortPreview } from "./SortableRows";
import { moveItem, usePointerSort } from "./usePointerSort";

export type CompositionOption = Option & { priceLabel: string; categoryName: string };
type PriceRef = { price: number; priceField: string };
type FormulaRef = PriceRef & { id: string; label: string };

const euro = (cents: number) => formatPrice(cents);
// Menus déroulants : même largeur et même hauteur que les autres champs
const field = "h-[38px] w-64 max-w-full rounded-lg border bg-background px-3 text-sm";

// Prix en centimes tapé dans un champ du formulaire de l'offre (« 690 », « 690,50 »), sinon null
function fieldPrice(form: HTMLFormElement | null, name: string) {
  const raw = (form?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";
  const s = raw.replace(/\s|€/g, "").replace(",", ".");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 100) : null;
}

// Composition d'une offre : le pack de base (ses produits deviennent les livrables du site), puis pour chaque
// autre formule les produits ajoutés au pack de base. Valeur à la carte comparée au prix, relu en direct dans le formulaire.
export function PackCompositionField({ formId, base, formulas, options, initial }: { formId: string; base: PriceRef; formulas: FormulaRef[]; options: CompositionOption[]; initial: PackComposition }) {
  const [composition, setComposition] = useState<PackComposition>(initial);
  const [prices, setPrices] = useState<Record<string, number | null>>(() => ({ [BASE]: base.price, ...Object.fromEntries(formulas.map((f) => [f.id, f.price])) }));

  // Prix relus quand on les modifie dans le formulaire. Lecture différée : un changement d'état pendant
  // l'événement natif empêcherait React de traiter la saisie (quantités).
  const fields = JSON.stringify([[BASE, base.priceField], ...formulas.map((f) => [f.id, f.priceField])]);
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const refs = JSON.parse(fields) as [string, string][];
    const read = (event: Event) => {
      if (!refs.some(([, name]) => name === (event.target as HTMLInputElement).name)) return;
      setTimeout(() => setPrices(Object.fromEntries(refs.map(([id, name]) => [id, fieldPrice(form, name)]))));
    };
    form.addEventListener("input", read);
    return () => form.removeEventListener("input", read);
  }, [formId, fields]);

  const setItems = (key: string, items: CompositionItem[]) => setComposition((c) => ({ ...c, [key]: items }));
  const categories = [...new Set(options.map((o) => o.categoryName))];
  const baseItems = composition[BASE] ?? [];
  const baseValue = compositionValue(baseItems, options);

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Composition à partir des produits à la carte</legend>
      <p className="mb-3 text-xs text-muted">
        Les produits du pack de base s&apos;affichent automatiquement en tête des livrables sur le site. La valeur à la carte (prix habituels, hors remise temporaire) s&apos;affiche à côté du prix pour t&apos;aider à fixer un prix cohérent.
      </p>
      <input type="hidden" name="composition" value={JSON.stringify(composition)} />
      <div className="space-y-4">
        <ItemsBlock title="Pack de base" price={prices[BASE] ?? null} value={baseValue} items={baseItems} options={options} categories={categories} onChange={(items) => setItems(BASE, items)} />
        {formulas.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Options <span className="text-xs font-normal text-muted">· pack de base + produits ajoutés, ou à la place d&apos;un produit du pack de base (menu ⇄ à côté du produit)</span></p>
            {formulas.map((f) => {
              const items = composition[f.id] ?? [];
              return (
                <ItemsBlock key={f.id} title={f.label} subtitle="Pack de base +" price={prices[f.id] ?? null}
                  value={optionValue(baseItems, items, options)} base={baseItems}
                  items={items} options={options} categories={categories} onChange={(next) => setItems(f.id, next)} />
              );
            })}
          </div>
        )}
      </div>
    </fieldset>
  );
}

// base : produits du pack de base qu'un produit d'une option peut remplacer (absent pour le pack de base lui-même)
function ItemsBlock({ title, subtitle, price, value, base, items, options, categories, onChange }: {
  title: string; subtitle?: string; price: number | null; value: { total: number; priceFrom: boolean }; base?: CompositionItem[]; items: CompositionItem[];
  options: CompositionOption[]; categories: string[]; onChange: (items: CompositionItem[]) => void;
}) {
  const list = useRef<HTMLUListElement>(null);
  const sort = usePointerSort((from, to) => onChange(moveItem(items, from, to)));
  useEffect(() => shift(list.current, sort.drag), [sort.drag]);
  const saving = price === null ? null : savingPercent(price, value.total);
  const optionName = (id: string) => options.find((o) => o.id === id)?.name ?? id;
  // Colonnes alignées d'un bloc à l'autre : nom, menu « remplace » (options), quantité, prix unitaire, total
  const replaceable = Boolean(base?.length);
  const columns = "grid-cols-[auto_minmax(6rem,14rem)_16rem_minmax(0,1fr)_4rem_8rem_4.5rem_auto]";

  const add = (id: string) => {
    if (!id) return;
    const i = items.findIndex((item) => item.option === id);
    onChange(i < 0 ? [...items, { option: id, qty: 1 }] : items.map((item, k) => (k === i ? { ...item, qty: Math.min(item.qty + 1, MAX_QTY) } : item)));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border bg-surface px-4 py-2.5">
        <span className="text-sm font-semibold">{subtitle && <span className="mr-1.5 font-normal text-muted">{subtitle}</span>}{title}</span>
        <span className="text-sm text-muted">
          {value.total > 0 ? <>Valeur à la carte : <strong className="text-foreground">{value.priceFrom ? "à partir de " : ""}{euro(value.total)}</strong></> : "Aucun produit"}
          {value.total > 0 && price !== null && <> · Prix : <strong className="text-foreground">{euro(price)}</strong>
            {saving !== null && <span className={`ml-2 rounded-full px-2 py-0.5 font-medium ${saving > 0 ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-300"}`}>
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
              <li key={item.option} data-sort-id={item.option} aria-label={name} className={`grid ${columns} items-center gap-3 bg-background px-2 py-1.5 text-sm`}>
                <span {...sort.handle(i, item.option)} role="button" tabIndex={0} aria-label={`Déplacer ${name} (flèches haut et bas)`} title="Glisser pour changer l’ordre · ↑/↓ au clavier"
                  className="inline-flex size-7 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing"><MaterialIcon name="drag_indicator" className="size-5" /></span>
                <span className={`truncate ${option ? "" : "text-amber-300"}`} title={name}>{name}</span>
                {replaceable ? (
                  <select value={item.replaces ?? ""} title={item.replaces ? `Remplace ${optionName(item.replaces)} du pack de base` : "En plus du pack de base"} aria-label={`Produit du pack de base remplacé par ${name}`}
                    onChange={(e) => onChange(items.map((x, k) => (k === i ? { option: x.option, qty: x.qty, ...(e.target.value ? { replaces: e.target.value } : {}) } : x)))}
                    className={`${field} truncate ${item.replaces ? "border-accent/50 text-accent" : "border-border text-muted"}`}>
                    <option value="">En plus du pack de base</option>
                    {base!.map((b) => <option key={b.option} value={b.option}>⇄ {b.qty > 1 ? `${b.qty} × ` : ""}{optionName(b.option)}</option>)}
                  </select>
                ) : <span />}
                <span />
                <QuantityInput value={item.qty} label={`Quantité de ${name}`} onChange={(qty) => onChange(items.map((x, k) => (k === i ? { ...x, qty } : x)))} />
                <span className="text-right text-muted" title="Prix unitaire à la carte">{option ? option.priceLabel : "—"}</span>
                <span className="text-right">{option ? euro((option.normalPrice ?? option.price) * item.qty) : "—"}</span>
                <button type="button" onClick={() => window.confirm("Es-tu sûre de vouloir supprimer ?") && onChange(items.filter((_, k) => k !== i))}
                  aria-label={`Retirer ${name}`} title="Retirer" className="inline-flex size-7 items-center justify-center rounded text-muted hover:bg-red-400/10 hover:text-red-300">
                  <MaterialIcon name="delete" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {sort.drag && <SortPreview drag={sort.drag} />}
      <div className="border-t border-border px-4 py-2.5">
        <select defaultValue="" onChange={(e) => { add(e.target.value); e.target.value = ""; }} aria-label={`Ajouter un produit à ${title}`} className={`${field} border-border`}>
          <option value="">+ Ajouter un produit…</option>
          {categories.map((category) => (
            <optgroup key={category} label={category}>
              {options.filter((o) => o.categoryName === category).map((o) => <option key={o.id} value={o.id}>{o.name} · {o.priceLabel}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}

// Quantité : le champ peut être vidé le temps de taper un nouveau nombre ; revient à la dernière valeur valide en sortant
function QuantityInput({ value, label, onChange }: { value: number; label: string; onChange: (qty: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input type="number" min={1} max={MAX_QTY} value={draft ?? String(value)} aria-label={label}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Math.floor(Number(e.target.value));
        if (e.target.value !== "" && n >= 1) onChange(Math.min(n, MAX_QTY));
      }}
      onBlur={() => setDraft(null)}
      className="h-[38px] w-full rounded-lg border border-border bg-background px-2 text-right text-sm" />
  );
}
