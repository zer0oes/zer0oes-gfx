"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useQuotePayment } from "./QuotePayment";
import { QuoteDeclineForm } from "./QuoteDeclineForm";
import { acceptQuoteCheckout, savePaidQuoteBrief } from "@/app/(livraison)/devis/actions";
import { formatPrice } from "@/lib/pricing";
import { BRIEF_PLATFORM_KEY, briefDeliveryNeeds } from "@/lib/brief-delivery";
import { BriefDeliveryQuestions } from "./BriefDeliveryQuestions";

export function QuoteAcceptForm({ token, en, request, deliverables, updatedAt, totalPrice, depositPercent, briefMode = false }: { token: string; en: boolean; request: Record<string, string>; deliverables: string[]; updatedAt: string; totalPrice: number; depositPercent: number; briefMode?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { payment, setPayment } = useQuotePayment();
  const [state, action, pending] = useActionState(briefMode ? savePaidQuoteBrief : acceptQuoteCheckout, null);
  useEffect(() => { if (briefMode && !dialog.current?.open) dialog.current?.showModal(); }, [briefMode]);
  const input = "mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm";
  const deposit = Math.round(totalPrice * depositPercent / 100);
  const depositAllowed = deposit >= 50 && totalPrice - deposit >= 50;
  const fields = [
    ["pseudo", en ? "Nickname" : "Pseudo", request.Pseudo || request.Nom],
    ["channel", en ? "Channel / website" : "Chaîne / site web", request.Chaîne],
    ["colors", en ? "Colours" : "Couleurs", request.Couleurs],
    ["logoLink", en ? "Existing logo link" : "Lien du logo existant", request["Logo existant"]],
    ["deadline", en ? "Preferred date" : "Date souhaitée", request["Date souhaitée"]],
  ];
  return <>
    {briefMode && <button type="button" onClick={() => dialog.current?.showModal()} className="mb-4 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background">{en ? "Complete my brief" : "Compléter mon brief"}</button>}
    {!briefMode && <><fieldset className="space-y-3 rounded-xl border border-border p-4">
      <legend className="px-2 text-sm font-semibold">{en ? "Choose your payment" : "Choisis ton paiement"}</legend>
      <div role="group" aria-label={en ? "Payment method" : "Mode de paiement"} className="relative flex rounded-full border border-border bg-background p-1">
        {depositAllowed && <span aria-hidden className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent transition-transform duration-200 motion-reduce:transition-none" style={{ transform: payment === "total" ? "translateX(100%)" : "translateX(0)" }} />}
        {depositAllowed && <button type="button" aria-pressed={payment === "acompte"} onClick={() => setPayment("acompte")} className={`relative flex-1 rounded-full px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${payment === "acompte" ? "text-background" : "text-muted hover:text-foreground"}`}>{en ? "Deposit" : "Acompte"} {depositPercent} %</button>}
        <button type="button" aria-pressed={payment === "total"} onClick={() => setPayment("total")} className={`relative flex-1 rounded-full px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent ${payment === "total" ? depositAllowed ? "text-background" : "bg-accent text-background" : "text-muted hover:text-foreground"}`}>{en ? "Pay in full" : "Règlement intégral"}</button>
      </div>
      <div className="pt-3">
        <p className="text-xs text-muted">{en ? "Due now on Stripe" : "À payer maintenant sur Stripe"}</p>
        <p className="mt-1 font-display text-2xl font-bold">{formatPrice(payment === "acompte" ? deposit : totalPrice, en ? "en" : "fr")}</p>
      </div>
      {payment === "acompte" && <>
        <p className="text-sm text-muted">{en ? "Balance before final delivery" : "Solde avant livraison définitive"} : {formatPrice(totalPrice - deposit, en ? "en" : "fr")}</p>
        <p className="text-xs leading-relaxed text-muted">{en ? "HD files will only be available to download after your deliverables are approved and the balance payment is received." : "Les fichiers HD ne seront téléchargeables qu’après validation des livrables et réception du paiement du solde."}</p>
      </>}
      <p className="text-xs leading-relaxed text-muted">{en ? "Accept and pay securely on Stripe. Complete your brief after payment." : "Accepte le devis, complète ton brief, puis confirme pour ouvrir le paiement sécurisé Stripe."}</p>
    </fieldset>
    <form id="quote-checkout" action={action} className="mt-4 space-y-3">
      <input type="hidden" name="token" value={token} /><input type="hidden" name="updatedAt" value={updatedAt} /><input type="hidden" name="decision" value="accept" /><input type="hidden" name="payment" value={payment} /><input type="hidden" name="lang" value={en ? "en" : "fr"} />
      <label className="flex gap-3 text-sm"><input type="checkbox" name="consent" required /><span>{en ? "I accept the quote and terms of sale." : "J?accepte le devis et les conditions g?n?rales de vente."}</span></label>
      {state && <p role="alert" className="text-sm text-amber-300">{state.error}</p>}
    </form>
    <div className="mt-4 flex items-center justify-between gap-3"><QuoteDeclineForm token={token} en={en} /><button form="quote-checkout" type="submit" disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background">{en ? "Accept and pay" : "Accepter et payer"}</button></div></>}
    {briefMode &&     <dialog ref={dialog} aria-labelledby="accept-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/70 sm:p-6">
      <h2 id="accept-title" className="font-display text-xl font-bold">{en ? "Complete your brief" : "Complète ton brief"}</h2>
      <p className="mt-2 text-sm text-muted">{en ? "Tell me about your ideas for each creation before confirming your order." : "Précise tes idées pour chaque création avant de confirmer ta commande."}</p>
      <form action={action} className="mt-5 space-y-5">
        <input type="hidden" name="token" value={token} /><input type="hidden" name="decision" value="accept" /><input type="hidden" name="updatedAt" value={updatedAt} /><input type="hidden" name="lang" value={en ? "en" : "fr"} />
        {state && <p role="alert" className="text-sm text-amber-300">{state.error}</p>}
        <input type="hidden" name="payment" value={payment} />
        <div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, label, value]) => <label key={name} className="block text-sm font-medium">{label}<input name={name} defaultValue={value || ""} maxLength={name === "logoLink" ? 1000 : 500} className={input} /></label>)}</div>
        <label className="block text-sm font-medium">{en ? "Your universe / mood *" : "Ton univers / ambiance *"}<textarea name="universe" required autoFocus maxLength={5000} defaultValue={request["Univers / ambiance"] || request.Projet || request.Message || ""} rows={4} className={input} /></label>
        <BriefDeliveryQuestions mode="quote-brief" needs={briefDeliveryNeeds(deliverables)} en={en} streamTool={request[BRIEF_PLATFORM_KEY]} />
        {deliverables.map((label, i) => <label key={i} className="block text-sm font-medium">{label} *<textarea name={`creation_${i}`} required maxLength={5000} rows={3} placeholder={en ? "Content, style, texts, dimensions…" : "Contenu, style, textes, dimensions…"} className={input} /></label>)}
        <label className="block text-sm font-medium">{en ? "References / inspiration" : "Références / inspirations"}<textarea name="references" maxLength={5000} defaultValue={request.Inspirations || ""} rows={3} className={input} /></label>
        <label className="block text-sm font-medium">{en ? "Additional notes" : "Remarques complémentaires"}<textarea name="notes" maxLength={5000} rows={3} className={input} /></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" name="consent" required className="mt-1 accent-[var(--accent)]" /><span>{en ? "I accept this quote and the " : "J’accepte ce devis et les "}<Link href={en ? "/en/cgv" : "/cgv"} target="_blank" rel="noopener noreferrer" className="text-accent underline">{en ? "terms of sale" : "conditions générales de vente"}</Link>.</span></label>
        <p hidden className="text-sm text-muted">{en ? "Next: secure Stripe payment" : "Étape suivante : paiement sécurisé Stripe"} · {formatPrice(payment === "acompte" ? deposit : totalPrice, en ? "en" : "fr")}</p>
        <div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2.5 text-sm">{en ? "Cancel" : "Annuler"}</button><button disabled={pending} className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-50">{pending ? (en ? "Opening checkout…" : "Ouverture du paiement…") : (en ? "Submit my brief" : "Envoyer mon brief")}</button></div>
      </form>
    </dialog>}
  </>;
}
