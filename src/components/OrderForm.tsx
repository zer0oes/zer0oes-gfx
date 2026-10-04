"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckout } from "@/app/actions";
import { depositAmount, formatPrice, orderPrice, type Pack, type PaymentType, type PricingSettings } from "@/lib/pricing";
import { CardSection } from "./PackCard";

// Choix de la formule et du mode de paiement. Les montants affichés ici sont
// indicatifs : le montant encaissé est recalculé côté serveur (createCheckout).
export function OrderForm({
  pack,
  settings,
  buttonClass,
}: {
  pack: Pack;
  settings: PricingSettings;
  buttonClass: string;
}) {
  const site = settings;
  const formulas = pack.formulas ?? [];
  const [formulaId, setFormulaId] = useState(formulas[0]?.id);
  const [payment, setPayment] = useState<PaymentType>("total");
  const [hasLogo, setHasLogo] = useState(false);
  const listPrice = formulas.find((f) => f.id === formulaId)?.price ?? pack.price;
  const price = orderPrice(listPrice, hasLogo, settings);
  const deposit = depositAmount(price, settings);
  const basePrice = formulas[0]?.price ?? pack.price;

  const choiceClass =
    "flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5 text-sm transition has-[:checked]:border-accent has-[:checked]:bg-accent/10";
  // Tuile de formule : libellé, puis prix dominant
  const tileClass =
    "relative block cursor-pointer rounded-xl border border-border bg-background/40 px-4 py-3 transition hover:border-accent/60 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:checked]:shadow-[0_0_24px_-12px_var(--accent)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent";

  return (
    <form action={createCheckout} className="flex flex-col">
      <input type="hidden" name="packId" value={pack.id} />
      <CardSection title="Formule">
        {formulas.length > 1 ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">Formule</legend>
            {formulas.map((f, i) => (
              <label key={f.id} className={tileClass}>
                <input
                  type="radio"
                  name="formulaId"
                  value={f.id}
                  checked={formulaId === f.id}
                  onChange={() => setFormulaId(f.id)}
                  className="peer sr-only"
                />
                <span className="block pr-7 text-sm font-medium">{f.label}</span>
                <span className="mt-0.5 flex items-baseline justify-between gap-3">
                  <span className="font-display text-2xl font-bold">
                    {formatPrice(f.price)} <span className="text-sm font-normal text-muted">HT</span>
                  </span>
                  {i > 0 && <span className="text-xs text-muted">+{formatPrice(f.price - basePrice)}</span>}
                </span>
                <span aria-hidden className="absolute right-3 top-3 hidden size-5 items-center justify-center rounded-full bg-accent text-xs text-background peer-checked:flex">
                  ✓
                </span>
              </label>
            ))}
          </fieldset>
        ) : (
          <input type="hidden" name="formulaId" value={formulas[0]?.id ?? ""} />
        )}
        <label className={`${choiceClass} mt-3`}>
          <span className="flex items-center gap-2">
            <input
              type="checkbox"
              name="logo"
              value="1"
              checked={hasLogo}
              onChange={(e) => setHasLogo(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            J&apos;ai déjà mon logo
          </span>
          <span className="shrink-0 font-semibold">−{formatPrice(site.logoDiscount)} HT</span>
        </label>
      </CardSection>

      <CardSection title="Paiement">
        <fieldset className="space-y-2">
          <legend className="sr-only">Paiement</legend>
          <label className={choiceClass}>
            <span className="flex items-center gap-2">
              <input type="radio" name="payment" value="total" checked={payment === "total"} onChange={() => setPayment("total")} className="accent-[var(--accent)]" />
              En une fois
            </span>
            <span className="shrink-0 font-semibold">{formatPrice(price)} HT</span>
          </label>
          <label className={choiceClass}>
            <span className="flex items-center gap-2">
              <input type="radio" name="payment" value="acompte" checked={payment === "acompte"} onChange={() => setPayment("acompte")} className="accent-[var(--accent)]" />
              Acompte de {site.depositPercent} %
            </span>
            <span className="shrink-0 font-semibold">{formatPrice(deposit)} HT</span>
          </label>
          {payment === "acompte" && (
            <p className="text-xs text-muted">
              Solde de {formatPrice(price - deposit)} HT à régler à la livraison, avant la remise des fichiers définitifs.
            </p>
          )}
        </fieldset>
      </CardSection>

      <div className="mt-6 space-y-4 border-t border-border pt-5">
        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" name="cgv" required className="mt-0.5 accent-[var(--accent)]" />
          <span>
            J&apos;accepte les <Link href="/cgv" className="underline hover:text-foreground">CGV</Link> et demande le
            démarrage de la création dès le paiement, avant la fin du délai de rétractation.
          </span>
        </label>
        <button type="submit" className={buttonClass}>
          {payment === "acompte" ? `Payer l'acompte de ${formatPrice(deposit)} HT` : `Commander — ${formatPrice(price)} HT`}
        </button>
        <p className="text-center text-[11px] text-muted">
          Paiement sécurisé par Stripe.{" "}
          <Link href="/confidentialite" className="underline hover:text-foreground">
            Tes données
          </Link>
        </p>
      </div>
    </form>
  );
}
