"use client";

import { useState } from "react";
import { flushUploads } from "./pending-uploads";

// « Enregistrer » d'un panneau : envoie d'abord les fichiers choisis dans le panneau, puis le formulaire
export function SaveWithUploads({ scope, form, label = "Enregistrer" }: { scope: string; form: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  return (
    <span className="flex items-center gap-3">
      {failed.length > 0 && <span role="alert" className="text-xs text-red-300">Envoi impossible : voir « {failed.join(" » et « ")} » ci-dessus.</span>}
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailed([]);
          const errors = await flushUploads(scope);
          setBusy(false);
          if (errors.length) return setFailed(errors);
          (document.getElementById(form) as HTMLFormElement | null)?.requestSubmit();
        }}
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Envoi des fichiers…" : label}
      </button>
    </span>
  );
}
