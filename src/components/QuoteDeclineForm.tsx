"use client";

import { useRef } from "react";
import { respondProjectQuote } from "@/app/(livraison)/devis/actions";

export function QuoteDeclineForm({ token, en }: { token: string; en: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} className="rounded-full border border-border px-3 py-2.5 text-sm font-semibold text-muted hover:border-accent hover:text-foreground sm:px-5">{en ? "Decline this quote" : "Refuser ce devis"}</button>
    <dialog ref={dialog} aria-labelledby="decline-title" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/70">
      <h2 id="decline-title" className="font-display text-xl font-bold">{en ? "Decline this quote" : "Refuser ce devis"}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{en ? "Could you share why this proposal doesn’t suit you? Your feedback will help me understand your needs and suggest a better fit." : "Qu’est-ce qui ne te convient pas dans cette proposition ? Quelques mots m’aideront à comprendre tes attentes et à te proposer une solution plus adaptée."}</p>
      <form action={respondProjectQuote} className="mt-4 space-y-4">
        <input type="hidden" name="token" value={token} /><input type="hidden" name="decision" value="decline" />
        <label className="block text-sm font-medium">{en ? "Reason for declining (optional)" : "Raison du refus (facultatif)"}
          <textarea name="declineReason" maxLength={2000} rows={4} autoFocus placeholder={en ? "Budget, timing, project changes…" : "Budget, délais, évolution du projet…"} className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm" />
        </label>
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold">{en ? "Cancel" : "Annuler"}</button>
          <button className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background">{en ? "Confirm decline" : "Confirmer le refus"}</button>
        </div>
      </form>
    </dialog>
  </>;
}
