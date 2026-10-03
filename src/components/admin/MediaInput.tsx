"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";
import { finalizeUpload, prepareUpload, uploadDirect } from "@/app/admin/portfolio-actions";
import type { MediaKind } from "@/lib/uploads";

// Champ média : URL existante, ou envoi d'un fichier (directement vers Supabase
// Storage via une URL signée, ou via le serveur en développement).
export function MediaInput({
  name,
  kind,
  folder,
  label,
  defaultValue,
  supabaseUrl,
  supabaseKey,
}: {
  name: string;
  kind: MediaKind;
  folder: string;
  label: string;
  defaultValue?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File) {
    setBusy(true);
    setStatus("Envoi…");
    try {
      const ticket = await prepareUpload({ kind, folder, filename: file.name, type: file.type, size: file.size });
      if (ticket.mode === "error") throw new Error(ticket.message);
      if (ticket.mode === "signed") {
        if (!supabaseUrl || !supabaseKey) throw new Error("Configuration Supabase manquante.");
        const { error } = await createClient(supabaseUrl, supabaseKey)
          .storage.from("portfolio")
          .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type });
        if (error) throw new Error(error.message);
        // Filigrane incrusté côté serveur (images)
        const done = await finalizeUpload({ path: ticket.path, kind, publicUrl: ticket.publicUrl });
        if (done.error) throw new Error(done.error);
        setUrl(done.url);
      } else {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("kind", kind);
        fd.set("folder", folder);
        const res = await uploadDirect(fd);
        if (res.error || !res.url) throw new Error(res.error ?? "Échec de l'envoi.");
        setUrl(res.url);
      }
      setStatus("Fichier envoyé. Pense à enregistrer.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  const isVideo = kind === "video";
  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium">{label}</span>
      {url &&
        (isVideo ? (
          <video src={url} muted loop playsInline controls className="max-h-48 rounded-lg border border-border bg-black" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-48 rounded-lg border border-border bg-background object-contain" />
        ))}
      <input
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL du fichier, ou envoie un fichier ci-dessous"
        aria-label={`${label} (URL)`}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-sm hover:border-accent">
          {busy ? "Envoi en cours…" : "Envoyer un fichier"}
          <input
            type="file"
            accept={isVideo ? "video/mp4,video/webm" : "image/webp,image/png,image/jpeg,image/gif"}
            className="sr-only"
            disabled={busy}
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
        </label>
        {url && (
          <button type="button" onClick={() => setUrl("")} className="text-xs text-muted hover:text-foreground">
            Retirer
          </button>
        )}
        {status && (
          <span role="status" className="text-xs text-muted">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
