"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { approveAllDeliverablesAction } from "@/app/(livraison)/commande/actions";

function ConfirmButton({ en }: { en: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-40">{pending ? (en ? "Approving…" : "Validation…") : (en ? "Confirm approval" : "Confirmer la validation")}</button>;
}

export function ApproveAllButton({ token, disabled, en }: { token: string; disabled: boolean; en: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" disabled={disabled} onClick={() => dialog.current?.showModal()} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-40">{en ? "Approve all" : "Tout valider"}</button>
    <dialog ref={dialog} aria-labelledby="approve-all-title" aria-describedby="approve-all-description" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-border bg-surface p-6 text-foreground backdrop:bg-black/70">
      <h2 id="approve-all-title" className="font-display text-xl font-bold">{en ? "Approve all deliverables?" : "Valider tous les éléments ?"}</h2>
      <p id="approve-all-description" className="mt-3 text-sm leading-relaxed text-muted">{en ? "You confirm that you have reviewed all previews and approve these versions. Approval can be cancelled until the first download of a final file." : "Tu confirmes avoir vérifié tous les aperçus et accepter ces versions. Tu pourras annuler la validation jusqu’au premier téléchargement d’un fichier définitif."}</p>
      <form action={approveAllDeliverablesAction} className="mt-6 flex flex-wrap justify-end gap-3">
        <input type="hidden" name="token" value={token} />
        <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold">{en ? "Cancel" : "Annuler"}</button>
        <ConfirmButton en={en} />
      </form>
    </dialog>
  </>;
}
