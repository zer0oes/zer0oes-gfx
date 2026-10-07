"use client";

import Link from "next/link";
import { useState } from "react";
import { createCheckout } from "@/app/actions";
import { href, t } from "@/lib/i18n";
import { depositAmount, formatPrice, orderPrice, type Pack, type PaymentType, type PricingSettings } from "@/lib/pricing";
import { useLocale } from "./I18nProvider";


// Choix de la formule et du mode de paiement. Les montants affichés ici sont
// indicatifs : le montant encaissé est recalculé côté serveur (createCheckout).
export function OrderForm({
  pack,
  settings,
  buttonClass,
  defaultOpen = false,
}: {
  pack: Pack;
  settings: PricingSettings;
  buttonClass: string;
  defaultOpen?: boolean;
}) {
  const [formulaOpen, setFormulaOpen] = useState(defaultOpen);
  const [paymentOpen, setPaymentOpen] = useState(defaultOpen);
  const site = settings;
  const locale = useLocale();
  const amount = (cents: number) => formatPrice(cents, locale);
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
      {/* Langue : paiement Stripe et page de remerciement dans la langue du visiteur */}
      <input type="hidden" name="lang" value={locale} />
      <div className="mt-6 relative before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border pt-5">
        <button type="button" aria-expanded={formulaOpen} aria-controls={`formula-${pack.id}`} onClick={() => setFormulaOpen((open) => !open)} className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm py-1 text-left focus-visible:outline-2 focus-visible:outline-accent">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t(locale, { fr: "Formule", en: "Package" })}</span>
            <span className="mt-1 block text-xs text-muted">{`${formulas.find((formula) => formula.id === formulaId)?.label ?? pack.name} · ${amount(price)}`}</span>
          </span>
          <span aria-hidden className="flex h-4 shrink-0 items-center text-lg leading-none text-accent">{formulaOpen ? "−" : "+"}</span>
        </button>
        <div id={`formula-${pack.id}`} hidden={!formulaOpen} className="mt-4">
        <p className="mb-3 text-xs leading-relaxed text-muted">{t(locale, { fr: "Scènes au choix : démarrage, pause, fin, discussion ou gameplay. Tu les préciseras dans ton brief après la commande.", en: "Choose starting, break, ending, chatting or gameplay scenes in your brief after ordering." })}</p>
        {formulas.length > 1 ? (
          <fieldset className="space-y-2">
            <legend className="sr-only">{t(locale, { fr: "Formule", en: "Package" })}</legend>
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
                    {formatPrice(f.price, locale)}
                  </span>
                  {i > 0 && <span className="text-xs text-muted">+{formatPrice(f.price - basePrice, locale)}</span>}
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
            {t(locale, { fr: "J'ai déjà mon logo", en: "I already have my logo" })}
          </span>
          <span className="shrink-0 font-semibold">−{amount(site.logoDiscount)}</span>
        </label>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t(locale, { fr: "Fournis un logo de qualité, idéalement vectoriel. Les retouches et refontes sont chiffrées séparément.", en: "Supply a quality logo, ideally vector artwork. Retouching and redesign are quoted separately." })}</p>
        </div>
      </div>

      <div className="mt-6 relative before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border pt-5">
        <button type="button" aria-expanded={paymentOpen} aria-controls={`payment-${pack.id}`} onClick={() => setPaymentOpen((open) => !open)} className="flex w-full cursor-pointer items-start justify-between gap-3 rounded-sm py-1 text-left focus-visible:outline-2 focus-visible:outline-accent">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t(locale, { fr: "Paiement", en: "Payment" })}</span>
            <span className="mt-1 block text-xs text-muted">{payment === "acompte" ? t(locale, { fr: `Acompte de ${site.depositPercent} % · ${amount(deposit)}`, en: `${site.depositPercent}% deposit · ${amount(deposit)}` }) : t(locale, { fr: `En une fois · ${amount(price)}`, en: `In full · ${amount(price)}` })}</span>
          </span>
          <span aria-hidden className="flex h-4 shrink-0 items-center text-lg leading-none text-accent">{paymentOpen ? "−" : "+"}</span>
        </button>
        <div id={`payment-${pack.id}`} hidden={!paymentOpen} className="mt-4">
        <fieldset className="space-y-2">
          <legend className="sr-only">{t(locale, { fr: "Paiement", en: "Payment" })}</legend>
          <label className={choiceClass}>
            <span className="flex items-center gap-2">
              <input type="radio" name="payment" value="total" checked={payment === "total"} onChange={() => setPayment("total")} className="accent-[var(--accent)]" />
              {t(locale, { fr: "En une fois", en: "In full" })}
            </span>
            <span className="shrink-0 font-semibold">{amount(price)}</span>
          </label>
          <label className={choiceClass}>
            <span className="flex items-center gap-2">
              <input type="radio" name="payment" value="acompte" checked={payment === "acompte"} onChange={() => setPayment("acompte")} className="accent-[var(--accent)]" />
              {t(locale, { fr: `Acompte de ${site.depositPercent} %`, en: `${site.depositPercent}% deposit` })}
            </span>
            <span className="shrink-0 font-semibold">{amount(deposit)}</span>
          </label>
          {payment === "acompte" && (
            <p className="text-xs text-muted">
              {t(locale, {
                fr: `Solde de ${amount(price - deposit)} à régler à la livraison, avant la remise des fichiers définitifs.`,
                en: `Balance of ${amount(price - deposit)} due on delivery, before the final files are handed over.`,
              })}
            </p>
          )}
        </fieldset>
        </div>
      </div>

      <div className="mt-6 space-y-4 relative before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border pt-5">
        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" name="cgv" required className="mt-0.5 accent-[var(--accent)]" />
          {locale === "en" ? (
            <span>
              I accept the{" "}
              <Link href={href(locale, "/cgv")} className="underline hover:text-foreground">
                terms of sale
              </Link>{" "}
              and ask for the work to start as soon as I pay, before the end of the withdrawal period.
            </span>
          ) : (
            <span>
              J&apos;accepte les <Link href="/cgv" className="underline hover:text-foreground">CGV</Link> et demande le
              démarrage de la création dès le paiement, avant la fin du délai de rétractation.
            </span>
          )}
        </label>
        <p className="text-center text-xs leading-relaxed text-muted">{t(locale, { fr: `Généralement ${site.deliveryDays} jours ouvrés après réception du brief complet, selon le projet.`, en: `Usually ${site.deliveryDays.replace(" à ", " to ")} business days after receiving the complete brief, depending on the project.` })}</p>
        <button type="submit" className={buttonClass}>
          {payment === "acompte"
            ? t(locale, { fr: `Payer l'acompte de ${amount(deposit)}`, en: `Pay the ${amount(deposit)} deposit` })
            : t(locale, { fr: `Commander — ${amount(price)}`, en: `Order — ${amount(price)}` })}
        </button>
        <p className="text-center text-[11px] text-muted">
          {t(locale, { fr: "Paiement sécurisé par Stripe.", en: "Secure payment by Stripe." })}{" "}
          <Link href={href(locale, "/confidentialite")} className="underline hover:text-foreground">
            {t(locale, { fr: "Tes données", en: "Your data" })}
          </Link>
        </p>
      </div>
    </form>
  );
}
