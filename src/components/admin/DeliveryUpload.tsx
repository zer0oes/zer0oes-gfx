"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { attachDeliverablePreview, finalizeDeliverable, prepareDeliverableUpload, uploadDeliverableDirect } from "@/app/admin/livraison-actions";
import { formatBytes } from "@/lib/delivery";
import { FileDrop } from "./FileDrop";
import { registerUpload } from "./pending-uploads";

// Envoi d'un fichier livré (zip Streamlabs, visuels, guide…) : directement du navigateur
// vers le stockage privé « livrables » via une URL signée (jusqu'à 500 Mo).
// previewFor : envoi de l'aperçu protégé (image ou vidéo basse résolution) d'un élément existant.
// saveScope : le fichier choisi part au clic sur « Enregistrer » du panneau (sinon dès le dépôt).
export function DeliveryUpload({
  orderId,
  supabaseUrl,
  supabaseKey,
  previewFor,
  targetId,
  saveScope,
  fixedLabel,
}: {
  orderId: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  previewFor?: string;
  targetId?: string;
  saveScope?: string;
  // Nom imposé par le formulaire parent (le champ de nom n'est alors pas affiché)
  fixedLabel?: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [ownLabel, setLabel] = useState("");
  const label = fixedLabel ?? ownLabel;
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [alsoHd, setAlsoHd] = useState(false);
  const key = useId();
  const deferred = Boolean(saveScope);

  // Fichier en attente : inscrit auprès du panneau, envoyé à l'enregistrement
  useEffect(() => {
    if (!saveScope) return;
    registerUpload(saveScope, key, file ? () => send(file) : null, previewFor ? "Aperçu client" : "Fichiers définitifs");
    return () => registerUpload(saveScope, key, null);
    // send lit alsoHd et label : réinscrit quand ils changent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveScope, key, file, alsoHd, label]);

  // Envoi d'un fichier (dès le dépôt, ou à l'enregistrement du panneau) ; false en cas d'échec
  async function send(file: File): Promise<boolean> {
    setBusy(true);
    setStatus(`Envoi de ${file.name} (${formatBytes(file.size)})…`);
    try {
      const ticket = await prepareDeliverableUpload({ orderId, filename: file.name, size: file.size, type: file.type });
      if (ticket.mode === "error") throw new Error(ticket.message);
      if (ticket.mode === "s3") {
        const put = await fetch(ticket.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": ticket.contentType } });
        if (!put.ok) throw new Error(`Envoi vers S3 refusé (${put.status}).`);
        const done = previewFor
          ? await attachDeliverablePreview({ orderId, id: previewFor, path: ticket.path, alsoHd, hdLabel: file.name })
          : await finalizeDeliverable({ orderId, label: label || file.name.replace(/\.[^.]+$/, ""), path: ticket.path, size: file.size, targetId });
        if ("error" in done && done.error) throw new Error(done.error);
      } else if (ticket.mode === "signed") {
        if (!supabaseUrl || !supabaseKey) throw new Error("Configuration Supabase manquante.");
        const { error } = await createClient(supabaseUrl, supabaseKey)
          .storage.from("livrables")
          .uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw new Error(error.message);
        const done = previewFor
          ? await attachDeliverablePreview({ orderId, id: previewFor, path: ticket.path, alsoHd, hdLabel: file.name })
          : await finalizeDeliverable({ orderId, label: label || file.name.replace(/\.[^.]+$/, ""), path: ticket.path, size: file.size, targetId });
        if ("error" in done && done.error) throw new Error(done.error);
      } else {
        const fd = new FormData();
        fd.set("orderId", orderId);
        fd.set("label", label || file.name.replace(/\.[^.]+$/, ""));
        if (previewFor) fd.set("previewFor", previewFor);
        if (previewFor && alsoHd) fd.set("alsoHd", "1");
        if (targetId) fd.set("targetId", targetId);
        fd.set("file", file);
        const res = await uploadDeliverableDirect(fd);
        if ("error" in res && res.error) throw new Error(res.error);
      }
      setFile(null);
      setLabel("");
      setStatus(previewFor ? alsoHd ? "Aperçu publié et original ajouté aux fichiers HD." : "Aperçu publié dans l’espace client." : "Fichier ajouté.");
      if (!deferred) router.refresh();
      return true;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Échec de l'envoi.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

  if (previewFor) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {/* Sans panneau, l'envoi part dès le dépôt : à cocher avant */}
        <label className="flex w-full items-start gap-2 text-xs"><input type="checkbox" checked={alsoHd} disabled={busy} onChange={(event) => setAlsoHd(event.target.checked)} className="mt-0.5 accent-[var(--accent)]" /><span>Utiliser aussi l’original comme fichier HD<span className="mt-1 block text-muted">L’aperçu reste protégé. L’original sera téléchargeable après validation et paiement intégral.</span></span></label>
        <div className="w-full">
          <FileDrop compact file={deferred || busy ? file : null} onFile={(f) => { setFile(f); if (f && !deferred) send(f); }} disabled={busy} accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" label="Image d’aperçu" hint={`${deferred ? "envoyée à l’enregistrement" : "envoyée dès le dépôt"} · PNG, JPG, WebP ou SVG`} />
        </div>
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
      {fixedLabel === undefined && <p className="text-sm font-medium">Ajouter un fichier</p>}
      {fixedLabel === undefined && <input value={label} onChange={(e) => setLabel(e.target.value)} disabled={busy} placeholder="Nom affiché au client (facultatif, sinon le nom du fichier)" aria-label="Nom du fichier affiché au client" className={input} />}
      <FileDrop
        file={deferred || busy ? file : null}
        disabled={busy}
        label="Fichier à livrer"
        hint={`${deferred ? "envoyé à l’enregistrement" : "envoyé dès le dépôt"} · jusqu’à 500 Mo`}
        onFile={(f) => {
          setFile(f);
          if (f && !deferred) send(f);
        }}
      />
      {status && (
        <p role="status" className="text-xs text-muted">
          {status}
        </p>
      )}
    </div>
  );
}
