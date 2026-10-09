"use client";

import { useState } from "react";
import { flushUploads } from "./pending-uploads";

// « Enregistrer » d'un panneau : envoie d'abord les fichiers choisis dans le panneau, puis le formulaire
export function SaveWithUploads({ scope, form, label = "Enregistrer" }: { scope: string; form: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  return (
    <span className="flex items-center gap-3">
      {error && <span role="alert" className="text-xs text-red-300">Un envoi a échoué, voir le panneau.</span>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(false);
          const ok = await flushUploads(scope);
          setBusy(false);
          if (!ok) return setError(true);
          (document.getElementById(form) as HTMLFormElement | null)?.requestSubmit();
        }}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Envoi des fichiers…" : label}
      </button>
    </span>
  );
}
