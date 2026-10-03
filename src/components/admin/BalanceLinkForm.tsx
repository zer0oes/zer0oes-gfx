"use client";

import { useActionState, useState } from "react";
import { sendBalanceLink } from "@/app/admin/actions";
import { FormStatus } from "@/components/ui";

export function BalanceLinkForm({ orderId, existingUrl }: { orderId: string; existingUrl?: string }) {
  const [state, action, pending] = useActionState(sendBalanceLink, null);
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      <form action={action}>
        <input type="hidden" name="id" value={orderId} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Création…" : existingUrl ? "Renvoyer un lien de paiement du solde" : "Envoyer le lien de paiement du solde"}
        </button>
      </form>
      <FormStatus state={state} />
      {existingUrl && (
        <div className="flex gap-2">
          <input
            readOnly
            value={existingUrl}
            aria-label="Lien de paiement du solde"
            className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted"
          />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(existingUrl).then(() => setCopied(true))}
            className="rounded-lg border border-border px-3 text-xs hover:border-accent"
          >
            {copied ? "Copié" : "Copier"}
          </button>
        </div>
      )}
    </div>
  );
}
