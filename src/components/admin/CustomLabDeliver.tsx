"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { deliverLabAction, listLabDeliveryTargetsAction, type LabDeliveryTarget } from "@/app/admin/custom-lab-actions";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import type { LabContent } from "@/lib/custom-lab/types";
import { Drawer } from "./Drawer";
import { Segmented } from "./Segmented";

const DRAWER = "laboratoire-livrer";
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal";

// Livraison d'une création dans une commande : panneau latéral (commande, livrable nouveau ou existant, plateformes).
// Le fichier est généré côté serveur à partir de la version enregistrée et déposé comme fichier HD du livrable.
export function CustomLabDeliver({ id, kind, name, platform, dirty, className, renderTrigger }: { id: string; kind: LabContent["kind"]; name: string; platform: Platform; dirty: boolean; className: string; renderTrigger?: (open: () => void) => ReactNode }) {
  const [targets, setTargets] = useState<LabDeliveryTarget[] | null>(null);
  const [orderId, setOrderId] = useState("");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");
  const [platforms, setPlatforms] = useState<string>(platform);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string; orderId?: string } | null>(null);

  const order = targets?.find((t) => t.id === orderId);
  const open = async () => {
    setMessage(null);
    setLabel(name);
    setPlatforms(platform);
    (document.getElementById(DRAWER) as HTMLDialogElement | null)?.showModal();
    try {
      const list = await listLabDeliveryTargetsAction();
      setTargets(list);
      if (!list.some((t) => t.id === orderId)) { setOrderId(list[0]?.id ?? ""); setTargetId(""); }
    } catch {
      setTargets([]);
      setMessage({ ok: false, text: "Impossible de charger les commandes." });
    }
  };

  const deliver = async () => {
    setMessage(null);
    if (!orderId) return setMessage({ ok: false, text: "Choisis une commande." });
    if (mode === "existing" && !targetId) return setMessage({ ok: false, text: "Choisis le livrable à compléter." });
    if (mode === "new" && !label.trim()) return setMessage({ ok: false, text: "Donne un nom au livrable." });
    setBusy(true);
    try {
      const result = await deliverLabAction({
        id,
        orderId,
        ...(mode === "existing" ? { targetId } : { name: label.trim() }),
        platforms: (platforms === "both" ? ["streamelements", "streamlabs"] : [platforms]) as Platform[],
      });
      setMessage({ ok: result.ok, text: result.message, orderId: result.ok ? orderId : undefined });
      if (result.ok) setTargets(await listLabDeliveryTargetsAction().catch(() => targets));
    } catch {
      setMessage({ ok: false, text: "Connexion interrompue. Réessaie dans un instant." });
    }
    setBusy(false);
  };

  const what = kind === "overlay" ? "la page HTML de l’overlay (source navigateur OBS)" : kind === "alertbox" ? "le zip du pack d’alertes" : "le zip du widget";
  return (
    <>
      {renderTrigger ? renderTrigger(() => { void open(); }) : <button type="button" onClick={open} disabled={dirty} title={dirty ? "Enregistrement en cours : la livraison utilise la version enregistrée" : "Livrer dans une commande"} className={className}>
        Livrer
      </button>}
      <Drawer
        id={DRAWER}
        kicker="Laboratoire"
        title="Livrer dans une commande"
        footer={
          <>
            {message && !message.ok ? <span role="alert" className="text-xs text-red-300">{message.text}</span> : <span />}
            <button type="button" onClick={deliver} disabled={busy || !targets?.length} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60">
              {busy ? "Envoi…" : "Livrer"}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">Le serveur génère {what} à partir de la version enregistrée et l’ajoute aux fichiers HD du livrable, débloqués pour le client après validation et règlement du solde.</p>
        {targets === null ? (
          <p className="text-sm text-muted">Chargement des commandes…</p>
        ) : !targets.length ? (
          <p className="text-sm text-muted">Aucune commande en cours ne peut recevoir de livrable.</p>
        ) : (
          <>
            <label className="block text-sm font-medium">
              Commande
              <select value={orderId} onChange={(e) => { setOrderId(e.target.value); setTargetId(""); }} className={`${input} mt-1`}>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.label} — {t.status}</option>)}
              </select>
            </label>
            <Segmented name="livrer-mode" legend="Livrable" value={mode} onChange={(v) => setMode(v as "new" | "existing")} options={[["new", "Nouveau livrable"], ["existing", "Livrable existant"]]} />
            {mode === "new" ? (
              <label className="block text-sm font-medium">
                Nom affiché au client
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex. Overlay Starting" className={`${input} mt-1`} />
              </label>
            ) : order?.deliverables.length ? (
              <label className="block text-sm font-medium">
                Livrable à compléter
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className={`${input} mt-1`}>
                  <option value="">Choisir…</option>
                  {order.deliverables.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </label>
            ) : (
              <p className="text-sm text-muted">Cette commande n’a pas encore de livrable.</p>
            )}
            {kind === "overlay" ? (
              <Segmented name="livrer-plateforme" legend="Code des widgets de l’overlay" value={platforms === "streamlabs" ? "streamlabs" : "streamelements"} onChange={setPlatforms} options={[["streamelements", "StreamElements"], ["streamlabs", "Streamlabs"]]} />
            ) : (
              <Segmented name="livrer-plateforme" legend="Plateformes" value={platforms} onChange={setPlatforms} options={[["streamelements", "StreamElements"], ["streamlabs", "Streamlabs"], ["both", "Les deux"]]} />
            )}
            {mode === "existing" && <p className="text-xs text-muted">Un fichier du même nom déjà présent est remplacé, sauf si le client l’a déjà téléchargé.</p>}
          </>
        )}
        {message?.ok && (
          <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message.text}{" "}
            {message.orderId && <Link href={`/admin/commandes/${message.orderId}#livraison`} className="font-semibold underline">Voir la commande</Link>}
          </p>
        )}
      </Drawer>
    </>
  );
}
