"use client";

import { useState } from "react";

export function ArchiveDownload({ url, label, en }: { url: string; label: string; en: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  return <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
    <button type="button" disabled={loading} aria-busy={loading} className={`relative isolate inline-flex overflow-hidden items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:brightness-110 ${loading ? "archive-download-loading" : ""}`} onClick={async () => {
      const startedAt = performance.now();
      setLoading(true); setError("");
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("Archive unavailable");
        const blob = await response.blob();
        const disposition = response.headers.get("Content-Disposition") ?? "";
        const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
        const filename = encoded ? decodeURIComponent(encoded) : disposition.match(/filename="([^"]+)"/i)?.[1] ?? "commande.zip";
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl; link.download = filename;
        document.body.appendChild(link); link.click(); link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } catch { setError(en ? "Download failed. Please try again." : "Le téléchargement a échoué. Réessaie."); }
      finally {
        // Le fichier est proposé immédiatement ; seul l'indicateur reste visible
        // un court instant pour que les archives rapides aient aussi un retour clair.
        const remaining = 900 - (performance.now() - startedAt);
        if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
        setLoading(false);
      }
    }}>
      {loading ? <svg aria-hidden="true" viewBox="0 0 24 24" className="relative z-10 size-5 shrink-0 animate-spin motion-reduce:animate-none" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg> : <svg aria-hidden="true" data-icon="download" viewBox="0 0 24 24" className="relative z-10 size-5 shrink-0" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>}
      <span className="relative z-10">{loading ? (en ? "Preparing download…" : "Préparation du téléchargement…") : label}</span>
    </button>

    <span role="status" className={error ? "max-w-xs text-sm text-red-300" : "sr-only"}>{error || (loading ? (en ? "Downloading ZIP archive" : "Téléchargement de l’archive ZIP en cours") : "")}</span>
  </div>;
}
