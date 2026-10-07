"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { attachDeliverablePreview, finalizeDeliverable, prepareDeliverableUpload, uploadDeliverableDirect } from "@/app/admin/livraison-actions";
import { formatBytes } from "@/lib/delivery";

// Envoi d'un fichier livré (zip Streamlabs, visuels, guide…) : directement du navigateur
// vers le stockage privé « livrables » via une URL signée (jusqu'à 500 Mo).
// previewFor : envoi de l'aperçu protégé (image ou vidéo basse résolution) d'un élément existant.
export function DeliveryUpload({
  orderId,
  supabaseUrl,
  supabaseKey,
  previewFor,
  targetId,
}: {
  orderId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  previewFor?: string;
  targetId?: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!file) return;
    setBusy(true);
    setStatus(`Envoi de ${file.name} (${formatBytes(file.size)})…`);
    try {
      const ticket = await prepareDeliverableUpload({ orderId, filename: file.name, size: file.size, type: file.type });
      if (ticket.mode === "error") throw new Error(ticket.message);
      if (ticket.mode === "s3") {
        const put = await fetch(ticket.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": ticket.contentType } });
        if (!put.ok) throw new Error(`Envoi vers S3 refusé (${put.status}).`);
        const done = previewFor
          ? await attachDeliverablePreview({ orderId, id: previewFor, path: ticket.path })
          : await finalizeDeliverable({ orderId, label: label || file.name, path: ticket.path, size: file.size, targetId });
        if ("error" in done && done.error) throw new Error(done.error);
      } else if (ticket.mode === "signed") {
        if (!supabaseUrl || !supabaseKey) throw new Error("Configuration Supabase manquante.");
        const { error } = await createClient(supabaseUrl, supabaseKey)
          .storage.from("livrables")
          .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw new Error(error.message);
        const done = previewFor
          ? await attachDeliverablePreview({ orderId, id: previewFor, path: ticket.path })
          : await finalizeDeliverable({ orderId, label: label || file.name, path: ticket.path, size: file.size, targetId });
        if ("error" in done && done.error) throw new Error(done.error);
      } else {
        const fd = new FormData();
        fd.set("orderId", orderId);
        fd.set("label", label || file.name);
        if (previewFor) fd.set("previewFor", previewFor);
        if (targetId) fd.set("targetId", targetId);
        fd.set("file", file);
        const res = await uploadDeliverableDirect(fd);
        if ("error" in res && res.error) throw new Error(res.error);
      }
      setFile(null);
      setLabel("");
      setStatus(previewFor ? "Aperçu ajouté." : "Fichier ajouté.");
      router.refresh();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const fileInput =
    "block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:text-foreground";

  if (previewFor) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Aperçu (image ou vidéo basse résolution)"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className={`${fileInput} max-w-xs text-xs`}
        />
        <button type="button" onClick={send} disabled={!file || busy} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:border-accent disabled:opacity-40">
          {busy ? "Envoi…" : "Envoyer l'aperçu"}
        </button>
        {status && (
          <span role="status" className="text-xs text-muted">
            {status}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Ajouter un fichier</p>
      <input
        type="file"
        aria-label="Fichier à livrer"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setFile(f);
          if (f && !label) setLabel(f.name.replace(/\.[^.]+$/, ""));
        }}
        className={fileInput}
      />
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nom affiché au client (ex. Pack Streamlabs)" aria-label="Nom du fichier affiché au client" className={input} />
      <button type="button" onClick={send} disabled={!file || busy} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background disabled:opacity-40">
        {busy ? "Envoi…" : "Envoyer le fichier"}
      </button>
      {status && (
        <p role="status" className="text-xs text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
