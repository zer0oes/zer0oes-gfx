"use client";

import { useEffect, useState } from "react";
import type { PackComposition } from "@/lib/pack-composition";
import type { Formula } from "@/lib/pricing";
import { MaterialIcon } from "./MaterialIcon";
import { PackCompositionField, type CompositionOption } from "./PackCompositionField";
import { TranslationInput } from "./TranslationTabs";

// Nombre de lignes lues par l'enregistrement de l'offre (formula_*_0 à formula_*_9)
const MAX_ROWS = 10;
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const euros = (cents: number) => (cents / 100).toString().replace(".", ",");

// Une ligne garde son numéro (slot) même quand une autre est retirée : les champs formula_*_<slot> restent liés
// à la bonne formule ; une option ajoutée prend le numéro suivant. La composition d'une option pas encore
// enregistrée est rangée sous « new-<slot> », remplacé par son identifiant à l'enregistrement.
type Row = { slot: number; formula?: Formula };

export function PackFormulasField({ formId, packId, packPrice, formulas, options, initial }: {
  formId: string; packId: string; packPrice: number; formulas: Formula[]; options: CompositionOption[]; initial: PackComposition;
}) {
  const [rows, setRows] = useState<Row[]>(() => (formulas.length ? formulas : [undefined]).map((formula, slot) => ({ slot, formula })));
  const [labels, setLabels] = useState<Record<number, string>>(() => Object.fromEntries(formulas.map((f, slot) => [slot, f.label])));

  // Noms des options relus pendant la saisie (pour les blocs de composition), en différé comme les prix
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const read = (event: Event) => {
      const match = /^formula_label_(\d+)$/.exec((event.target as HTMLInputElement).name ?? "");
      if (!match) return;
      const value = (event.target as HTMLInputElement).value;
      setTimeout(() => setLabels((current) => ({ ...current, [Number(match[1])]: value })));
    };
    form.addEventListener("input", read);
    return () => form.removeEventListener("input", read);
  }, [formId]);

  const nextSlot = Math.max(...rows.map((r) => r.slot)) + 1;
  const add = () => setRows((current) => [...current, { slot: nextSlot }]);
  const remove = (slot: number) => {
    if (window.confirm("Es-tu sûre de vouloir supprimer ?")) setRows((current) => current.filter((r) => r.slot !== slot));
  };
  const options_ = rows.filter((r) => r.slot > 0);

  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Formules commandables</legend>
        <p className="mb-3 text-xs text-muted">
          Ce que le client peut commander en ligne : le pack de base, puis ses options (pack de base + produits en plus, à choisir
          dans la composition juste en dessous), affichées sur le site avec leur supplément.
        </p>
        <div className="space-y-2">
          <div className="grid grid-cols-[8.5rem_1fr_7rem_2rem] gap-2 text-xs uppercase tracking-wider text-muted"><span /><span>Nom affiché</span><span>Prix (€)</span><span /></div>
          {rows.map(({ slot, formula }) => (
            <div key={slot} className="grid grid-cols-[8.5rem_1fr_7rem_2rem] items-center gap-2">
              <span className={`justify-self-start whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${slot === 0 ? "border-accent/50 text-accent" : "border-border text-foreground"}`}>
                {slot === 0 ? "Pack de base" : "Option"}
              </span>
              <TranslationInput translationKey={`translation:pack:${packId}:formula:${formula?.id ?? `new-${slot}`}:label`} name={`formula_label_${slot}`} defaultValue={formula?.label}
                required={slot > 0} placeholder={slot === 0 ? "Nom du pack de base" : "Nom de l'option"} aria-label={slot === 0 ? "Nom du pack de base" : "Nom de l'option"} className={input} />
              <input name={`formula_price_${slot}`} defaultValue={formula ? euros(formula.price) : ""} required={slot > 0} placeholder="Prix" inputMode="decimal" aria-label="Prix" className={input} />
              {slot > 0 ? (
                <button type="button" onClick={() => remove(slot)} aria-label={`Supprimer l'option ${labels[slot] ?? ""}`.trim()} title="Supprimer l'option"
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-red-400/10 hover:text-red-300">
                  <MaterialIcon name="delete" className="size-4" />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
        {nextSlot < MAX_ROWS && (
          <button type="button" onClick={add} className="mt-3 rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-accent hover:border-accent">+ Ajouter une option</button>
        )}
        <details className="mt-3 rounded-xl border border-border">
          <summary className="cursor-pointer px-4 py-2.5 text-xs text-muted hover:text-foreground">Réglages techniques : identifiants et prix Stripe</summary>
          <div className="space-y-2 border-t border-border p-4">
            <p className="text-xs text-muted">
              Identifiant : repris par les commandes, à ne pas changer une fois l&apos;option en vente (laissé vide, il est créé à partir du nom).
              Prix Stripe : facultatif, seulement si ce prix a été créé dans Stripe.
            </p>
            {rows.map(({ slot, formula }) => (
              <div key={slot} className="grid grid-cols-[8.5rem_1fr_1fr] items-center gap-2">
                <span className="truncate text-xs text-muted">{labels[slot] || (slot === 0 ? "Pack de base" : "Nouvelle option")}</span>
                <input name={`formula_id_${slot}`} defaultValue={formula?.id} placeholder="identifiant" aria-label="Identifiant" className={input} />
                <input name={`formula_stripe_${slot}`} defaultValue={formula?.stripePriceId} placeholder="price_…" aria-label="Prix Stripe" className={input} />
              </div>
            ))}
          </div>
        </details>
      </fieldset>
      <PackCompositionField formId={formId} options={options} initial={initial}
        base={{ price: formulas[0]?.price ?? packPrice, priceField: formulas.length ? "formula_price_0" : "price" }}
        formulas={options_.map(({ slot, formula }) => ({ id: formula?.id ?? `new-${slot}`, label: labels[slot] || "Nouvelle option", price: formula?.price ?? 0, priceField: `formula_price_${slot}` }))} />
    </>
  );
}
