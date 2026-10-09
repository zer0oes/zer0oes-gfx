"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteLabMediaAction, finalizeLabMediaAction, listLabMediaAction, prepareLabMediaAction } from "@/app/admin/custom-lab-actions";
import type { LabMedia } from "@/lib/custom-lab/media";
import { formatBytes } from "@/lib/delivery";
import { Drawer } from "./Drawer";
import { FileDrop } from "./FileDrop";

const DRAWER = "laboratoire-medias";
type Kind = "image" | "audio" | "video";
const kindOf = (type: string): Kind => (type.startsWith("audio/") ? "audio" : type.startsWith("video/") ? "video" : "image");
const accepts: Record<Kind | "all", string> = {
  image: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml",
  audio: "audio/mpeg,audio/ogg,audio/wav,audio/x-wav",
  video: "video/webm,video/mp4",
  all: "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,audio/mpeg,audio/ogg,audio/wav,audio/x-wav,video/webm,video/mp4",
};

// Sélection en cours (ouverte depuis un champ) : type attendu et retour de l'adresse choisie
const pending: { current: { kind: Kind; pick: (url: string) => void } | null } = { current: null };
const OPEN = "laboratoire-medias:open";
function takePending() {
  const p = pending.current;
  pending.current = null;
  return p;
}

// Ouvre la médiathèque pour choisir un fichier d'un type donné (sans argument : simple consultation)
export function openLabMedia(kind?: Kind, pick?: (url: string) => void) {
  pending.current = kind && pick ? { kind, pick } : null;
  window.dispatchEvent(new Event(OPEN));
  (document.getElementById(DRAWER) as HTMLDialogElement | null)?.showModal();
}

// Médiathèque du Laboratoire : envoi (glisser-déposer), aperçu, adresse à copier, suppression,
// et choix d'un fichier pour un champ (image, son, vidéo)
export function CustomLabMedia() {
  const [media, setMedia] = useState<LabMedia[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [picking, setPicking] = useState<Kind | null>(null);

  const load = useCallback(async () => {
    const res = await listLabMediaAction();
    if (res.ok) setMedia(res.media);
    else setMessage(res.message);
  }, []);

  useEffect(() => {
    const open = () => {
      setPicking(pending.current?.kind ?? null);
      setMessage("");
      void load();
    };
    window.addEventListener(OPEN, open);
    return () => window.removeEventListener(OPEN, open);
  }, [load]);

  async function upload(f: File) {
    setBusy(true);
    setMessage(`Envoi de ${f.name}…`);
    try {
      const ticket = await prepareLabMediaAction({ filename: f.name, type: f.type, size: f.size });
      if (!ticket.ok) throw new Error(ticket.message);
      const put = await fetch(ticket.uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
      if (!put.ok) throw new Error(`Envoi vers le stockage refusé (${put.status}).`);
      const done = await finalizeLabMediaAction({ name: f.name, path: ticket.path, type: f.type, size: f.size });
      if (!done.ok) throw new Error(done.message);
      setMedia((list) => [done.media, ...list]);
      setMessage(`${f.name} ajouté.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
      setFile(null);
    }
  }

  async function remove(m: LabMedia) {
    if (!window.confirm(`Supprimer « ${m.name} » ? Les créations qui l'utilisent ne l'afficheront plus.`)) return;
    const res = await deleteLabMediaAction(m.id);
    if (res.ok) setMedia((list) => list.filter((x) => x.id !== m.id));
    else setMessage(res.message);
  }

  function choose(m: LabMedia) {
    takePending()?.pick(m.url);
    (document.getElementById(DRAWER) as HTMLDialogElement | null)?.close();
  }

  const shown = picking ? media.filter((m) => kindOf(m.contentType) === picking) : media;

  return (
    <Drawer id={DRAWER} kicker="Laboratoire" title={picking ? `Choisir ${picking === "image" ? "une image" : picking === "audio" ? "un son" : "une vidéo"}` : "Médias"}>
      <FileDrop file={busy ? file : null} disabled={busy} accept={accepts[picking ?? "all"]} label="Ajouter un média" hint="images, sons, vidéos · 30 Mo max" onFile={(f) => { setFile(f); if (f) void upload(f); }} />
      {message && <p role="status" className="text-xs text-muted">{message}</p>}
      <p className="text-xs text-muted">Les médias sont publics (adresse https) : StreamElements et Streamlabs peuvent les charger.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((m) => {
          const kind = kindOf(m.contentType);
          return (
            <li key={m.id} className="overflow-hidden rounded-xl border border-border bg-background/40">
              <div className="flex aspect-video items-center justify-center bg-[repeating-conic-gradient(#1b1d26_0_25%,#14161d_0_50%)] bg-[length:16px_16px]">
                {kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="max-h-full max-w-full object-contain" />
                ) : kind === "video" ? (
                  <video src={m.url} muted loop playsInline controls className="max-h-full max-w-full" />
                ) : (
                  <audio src={m.url} controls className="w-11/12" />
                )}
              </div>
              <div className="space-y-2 p-2 text-xs">
                <p className="truncate font-medium" title={m.name}>{m.name}</p>
                <p className="text-muted">{formatBytes(m.sizeBytes)}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {picking && <button type="button" onClick={() => choose(m)} className="rounded-full bg-accent px-3 py-1 font-semibold text-background">Utiliser</button>}
                  <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(m.url); setMessage("Adresse copiée."); } catch { setMessage(m.url); } }} className="rounded-full border border-border px-3 py-1 hover:border-accent">Copier l’adresse</button>
                  <button type="button" onClick={() => remove(m)} aria-label={`Supprimer ${m.name}`} title="Supprimer" className="ml-auto inline-flex size-7 items-center justify-center rounded-lg text-muted hover:bg-red-500/10 hover:text-red-300">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {!shown.length && <p className="text-sm text-muted">Aucun média pour l’instant.</p>}
    </Drawer>
  );
}
