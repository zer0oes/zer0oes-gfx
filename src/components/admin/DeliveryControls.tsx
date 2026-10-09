"use client";

import { useState } from "react";

export function ClientSpaceLinks({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  return <div className="relative flex w-full flex-wrap items-center justify-between gap-3 text-sm">
    <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">Voir l’espace client ↗</a>
    <button type="button" title="Copier le lien client" aria-label="Copier le lien client" onClick={async () => {
      try { await navigator.clipboard.writeText(url); setMessage("Lien copié."); }
      catch { setMessage("Copie impossible. Ouvre l’espace client pour copier son adresse."); }
    }} className={`inline-flex size-9 items-center justify-center rounded-full border ${message === "Lien copié." ? "border-emerald-400/50 text-emerald-300" : "border-border text-accent hover:border-accent"}`}>
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">{message === "Lien copié." ? <path d="m5 12 4 4L19 6" /> : <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>}</svg>
    </button>
    <span role="status" className="sr-only">{message}</span>
  </div>;
}
