"use client";

import { useId, useState } from "react";

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

export function AddDeliveryElement({ linkForm, fileForm }: { linkForm: React.ReactNode; fileForm: React.ReactNode }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"link" | "file" | null>(null);
  return <div className="mt-6">
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="rounded-full border border-accent px-5 py-2.5 text-sm font-semibold text-accent hover:bg-accent/10">{open ? "Fermer l’ajout" : "+ Ajouter un livrable supplémentaire"}</button>
    {open && <div id={id} className="mt-4 space-y-4 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Type d’élément à ajouter">
        {(["link", "file"] as const).map((type) => <button key={type} type="button" aria-pressed={kind === type} onClick={() => setKind(type)} className={`rounded-lg border px-4 py-2 text-sm font-medium ${kind === type ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent"}`}>{type === "link" ? "Lien d’import" : "Fichier"}</button>)}
      </div>
      <div hidden={kind !== "link"}>{linkForm}</div>
      <div hidden={kind !== "file"}>{fileForm}</div>
    </div>}
  </div>;
}
