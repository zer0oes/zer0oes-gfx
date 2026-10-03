"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckout } from "@/app/actions";
import { depositAmount, formatOfferPrice, formatPrice, type Pack, type PaymentType } from "@/data/packs";
import { site } from "@/data/site";

// Choix de la formule et du mode de paiement. Les montants affichés ici sont
// indicatifs : le montant encaissé est recalculé côté serveur (createCheckout).
export function OrderForm({ pack, buttonClass }: { pack: Pack; buttonClass: string }) {
  const formulas = pack.formulas ?? [];
  const [formulaId, setFormulaId] = useState(formulas[0]?.id);
  const [payment, setPayment] = useState<PaymentType>("total");
  const price = formulas.find((f) => f.id === formulaId)?.price ?? pack.price;
  const deposit = depositAmount(price);

  const choiceClass =
    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm has-[:checked]:border-accent";

  return (
    <form action={createCheckout} className="mt-8 space-y-4">
      <input type="hidden" name="packId" value={pack.id} />
      {formulas.length > 1 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Formule</legend>
          {formulas.map((f) => (
            <label key={f.id} className={choiceClass}>
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="formulaId"
                  value={f.id}
                  checked={formulaId === f.id}
                  onChange={() => setFormulaId(f.id)}
                  className="accent-[var(--accent)]"
                />
                {f.label}
              </span>
              <span className="shrink-0 font-semibold">{formatOfferPrice(f)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Paiement</legend>
        <label className={choiceClass}>
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="total"
              checked={payment === "total"}
              onChange={() => setPayment("total")}
              className="accent-[var(--accent)]"
            />
            Payer en une fois
          </span>
          <span className="shrink-0 font-semibold">{formatPrice(price)} HT</span>
        </label>
        <label className={choiceClass}>
          <span className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="acompte"
              checked={payment === "acompte"}
              onChange={() => setPayment("acompte")}
              className="accent-[var(--accent)]"
            />
            Payer un acompte de {site.depositPercent} %
          </span>
          <span className="shrink-0 font-semibold">{formatPrice(deposit)} HT</span>
        </label>
        {payment === "acompte" && (
          <p className="text-xs text-muted">
            Solde de {formatPrice(price - deposit)} HT à régler à la livraison, avant la remise des fichiers définitifs.
          </p>
        )}
      </fieldset>
      <label className="flex items-start gap-2 text-xs text-muted">
        <input type="checkbox" name="cgv" required className="mt-0.5 accent-[var(--accent)]" />
        <span>
          J&apos;accepte les <Link href="/cgv" className="underline hover:text-foreground">CGV</Link> et demande le
          démarrage de la création dès le paiement, avant la fin du délai de rétractation.
        </span>
      </label>
      <button type="submit" className={buttonClass}>
        {payment === "acompte" ? `Payer l'acompte de ${formatPrice(deposit)} HT` : "Commander"}
      </button>
    </form>
  );
}
