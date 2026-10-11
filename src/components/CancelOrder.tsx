"use client";

import { useActionState, useState } from "react";
import { cancelOrderAction } from "@/app/cancel-order-action";
import { formatPrice } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

export function CancelOrder({ token, sessionId, amount, locale }: { token?: string; sessionId?: string; amount: number; locale: Locale }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(cancelOrderAction, null);
  const en = locale === "en";
  if (state?.ok) return <p role="status" className="text-sm text-foreground/80">{state.message}</p>;
  return <div className="text-sm">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="text-muted underline underline-offset-4 hover:text-foreground">{en ? "Cancel my order" : "Annuler ma commande"}</button>
    {open && <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="token" value={token ?? ""} /><input type="hidden" name="sessionId" value={sessionId ?? ""} /><input type="hidden" name="lang" value={locale} />
      <p className="leading-relaxed text-foreground/80">{en ? `Cancelling stops your project and refunds the remaining paid amount (${formatPrice(amount, locale)}) to your original payment method through Stripe.` : `L’annulation arrête ton projet et rembourse le montant payé restant (${formatPrice(amount, locale)}) sur ton moyen de paiement d’origine via Stripe.`}</p>
      <label className="flex items-start gap-2"><input type="checkbox" name="confirm" required disabled={pending} className="mt-1 accent-[var(--accent)]" /><span>{en ? "I confirm cancellation and refund of my order." : "Je confirme l’annulation et le remboursement de ma commande."}</span></label>
      {state?.message && <p role="alert" className="text-rose-300">{state.message}</p>}
      <button disabled={pending} className="rounded-full border border-border px-4 py-2 hover:border-accent disabled:opacity-60">{pending ? (en ? "Processing…" : "Traitement…") : (en ? "Confirm cancellation and refund" : "Confirmer l’annulation et le remboursement")}</button>
    </form>}
  </div>;
}
