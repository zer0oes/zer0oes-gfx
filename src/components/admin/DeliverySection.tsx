import {
  addDeliveryLinkAction,
  createPortalLinkAction,
  deleteDeliverableAction,
  removeDeliverablePreviewAction,
  removeFinalAssetAction,
  sendDeliveryAction,
  setDeliverableTypeAction,
} from "@/app/admin/livraison-actions";
import { correctionPending, itemRevisionLimit, deliverableTypes, formatBytes, itemType, mediaKind, pendingPreview, deliveryLocked, deliveryLockedMessage } from "@/lib/delivery";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";
import type { Deliverable, Order } from "@/lib/store";
import { DeliveryUpload } from "./DeliveryUpload";
import { ClientSpaceLinks } from "./DeliveryControls";
import { NewDeliverable } from "./NewDeliverable";
import { ConfirmDelete, Drawer, DrawerRow } from "./Drawer";
import { SaveWithUploads } from "./SaveWithUploads";
import { deliveryState } from "@/lib/delivery-plan";
import { DeliveryNotice } from "./DeliveryNotice";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

const statusStyles = {
  "À préparer": "border-slate-400/40 bg-slate-400/10 text-slate-300",
  "À valider": "border-violet-400/60 bg-violet-400/20 text-violet-200",
  "Correction demandée": "border-amber-400/60 bg-amber-400/20 text-amber-200",
  "Validé": "border-emerald-400/60 bg-emerald-400/20 text-emerald-200",
  "Téléchargé": "border-cyan-400/60 bg-cyan-400/20 text-cyan-200",
  "Prêt à télécharger": "border-emerald-400/60 bg-emerald-400/20 text-emerald-200",
};

// Livraison de la commande : liens d'import StreamElements, fichiers (Streamlabs, visuels,
// guide), puis envoi au client d'un lien privé vers sa page de livraison.
export async function DeliverySection({ order, items, message }: { order: Order; items: Deliverable[]; message?: { ok?: string; error?: string } }) {
  const pageUrl = order.deliveryToken ? `${await siteUrl()}/commande/${order.deliveryToken}` : null;
  const newCount = items.filter((item) => pendingPreview(item)).length;
  // Commande entièrement validée : plus de retrait possible (sauf en repassant la commande « En cours »)
  const locked = deliveryLocked(order, items);
  return (
    <section id="livraison" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-semibold">Livraison</h2>
      <p className="mt-1 text-sm text-muted">
        Ajoute les éléments du projet : le client les valide dans son espace privé avant d’accéder aux fichiers définitifs.
      </p>
      <details className="mt-2 text-sm text-muted">
        <summary className="cursor-pointer text-accent">Comment fonctionne la livraison ?</summary>
        <p className="mt-2 leading-relaxed">Les liens d’import StreamElements et les fichiers (Streamlabs, visuels, guide) sont réunis dans l’espace client, sans compte. Le client voit d’abord un aperçu protégé. Le fichier final ou le lien d’import est accessible après validation de l’élément et règlement du solde.</p>
      </details>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
        {pageUrl ? (
          <ClientSpaceLinks url={pageUrl} />
        ) : (
          <form action={createPortalLinkAction}>
            <input type="hidden" name="orderId" value={order.id} />
            <button className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Créer le lien</button>
          </form>
        )}
      </div>
      {message?.error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {message.error}
        </p>
      )}
      {message?.ok && message.ok !== "1" && <DeliveryNotice message={message.ok} />}

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-background/50 text-xs text-muted"><tr>{["Livrable", "Aperçu", "Fichiers finaux", "Statut"].map((label) => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {items.map((d) => {
              const ready = Boolean(d.previewPath || (!d.plannedKey && mediaKind(d.storagePath) === "image"));
              const finals = (d.finalAssets?.length ?? 0) + (d.storagePath || d.url ? 1 : 0);
              const status = deliveryState(order, d);
              return <DrawerRow key={d.id} drawer={`livrable-${d.id}`} label={`Modifier ${d.label}`}>
                <td className="px-3 py-3 font-medium">{status === "Téléchargé" ? <details><summary className="cursor-pointer">{d.label}</summary><ul className="mt-2 space-y-1 text-xs font-normal text-muted">{(d.finalAssets ?? []).map((asset, index) => <li key={index}>{asset.label} · Téléchargé</li>)}{(d.storagePath || d.url) && <li>{d.label} · Téléchargé</li>}</ul></details> : d.label}{correctionPending(d) && <span className="mt-1 block text-xs text-amber-300">Retour client à traiter</span>}<span className="mt-1 block text-xs font-normal text-muted">{d.clientNotes?.length ?? 0}/{itemRevisionLimit(order)} corrections utilisées</span></td>
                <td className={`px-3 py-3 ${ready ? "text-emerald-300" : "text-muted"}`}>{ready ? "Prêt" : "À ajouter"}</td>
                <td className="px-3 py-3">{finals ? `${finals} fichier(s) / lien(s)` : "Aucun"}</td>
                <td className="px-3 py-3"><span className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles[status]}`}><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span></td>
              </DrawerRow>;
            })}
            {!items.length && <tr><td colSpan={4} className="px-3 py-4 text-muted">Aucun livrable prévu.</td></tr>}
          </tbody>
        </table>
      </div>
      {items.map((d) => {
        const ready = Boolean(d.previewPath || (!d.plannedKey && mediaKind(d.storagePath) === "image"));
        return <Drawer key={d.id} id={`livrable-${d.id}`} kicker="Livrable" title={d.label} footer={<>{locked ? <span className="max-w-xs text-xs text-muted">{deliveryLockedMessage}</span> : <ConfirmDelete action={deleteDeliverableAction} id={d.id} fields={{ orderId: order.id }} label="Retirer ce livrable" question="Es-tu sûre de vouloir retirer ce livrable ?" />}<SaveWithUploads scope={`livrable-${d.id}`} form={`livrable-form-${d.id}`} /></>}>

            <section className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
              <h4 className="font-semibold">Aperçu client</h4>
              {ready && order.deliveryToken && <div className="rounded-lg border border-border bg-background p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/commande/${order.deliveryToken}/${d.id}/apercu`} alt={`Aperçu protégé de ${d.label}`} className="max-h-56 w-full object-contain" />
              </div>}
              {!ready && <p className="text-sm text-muted">Ajoute une image de présentation. Elle sera réduite et filigranée côté serveur.</p>}
              {d.finalAccessedAt || d.accessedFinalAssets?.length ? <p className="text-xs text-muted">Déjà téléchargé par le client : l’aperçu ne peut plus être remplacé.</p> : <DeliveryUpload orderId={order.id} supabaseUrl={supabaseUrl()} supabaseKey={supabasePublishableKey()} previewFor={d.id} saveScope={`livrable-${d.id}`} />}
              {d.previewPath && !locked && !(d.finalAccessedAt || d.accessedFinalAssets?.length) && <form action={removeDeliverablePreviewAction}><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="id" value={d.id} /><button className="text-xs text-muted hover:text-red-300">Retirer l’aperçu</button></form>}
            </section>
            <section className="space-y-4 rounded-xl border border-border bg-background/40 p-4">
              <h4 className="font-semibold">Fichiers définitifs</h4>
              <p className="text-xs text-muted">Privés jusqu’à validation du livrable et paiement intégral.</p>
              <ul className="space-y-2 text-sm">{d.storagePath && <li>✓ {d.label} — {formatBytes(d.sizeBytes)}</li>}{d.url && <li>✓ Lien d’import existant</li>}{(d.finalAssets ?? []).map((asset, i) => {
                const downloaded = Boolean(asset.path && d.accessedFinalAssets?.includes(asset.path));
                return <li key={i} className="flex items-center justify-between gap-3"><span>✓ {asset.label} ({asset.url ? "lien d’import" : "fichier"}){downloaded && <span className="ml-1 text-xs text-muted">· téléchargé</span>}</span>{!locked && !downloaded && <ConfirmDelete action={removeFinalAssetAction} id={d.id} fields={{ orderId: order.id, index: String(i) }} label="" question={`Retirer « ${asset.label} » des fichiers définitifs ?`} icon />}</li>;
              })}</ul>
              <DeliveryUpload orderId={order.id} targetId={d.id} supabaseUrl={supabaseUrl()} supabaseKey={supabasePublishableKey()} saveScope={`livrable-${d.id}`} />
              <form action={addDeliveryLinkAction} className="space-y-3"><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="targetId" value={d.id} /><input name="label" required placeholder="Nom du lien d’import" aria-label="Nom du lien d’import" className={input} /><input name="url" type="url" required placeholder="https://…" aria-label="Adresse du lien d’import" className={input} /><button className="rounded-full border border-border px-4 py-2 text-sm">Ajouter le lien d’import</button></form>
            </section>
            {!!d.clientNotes?.length && <section className="space-y-3"><h4 className="font-semibold">Retours du client</h4>{d.clientNotes.map((note, i) => <div key={i} className="rounded-lg border border-amber-400/30 p-3"><p className="text-xs text-muted">{dateFmt.format(new Date(note.at))}</p><p className="mt-1 whitespace-pre-wrap text-sm">{note.body}</p></div>)}</section>}
            <section className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
              <h4 className="font-semibold">Nom et type</h4>
              <form id={`livrable-form-${d.id}`} action={setDeliverableTypeAction} className="grid gap-3 sm:grid-cols-2"><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="id" value={d.id} /><label className="text-xs text-muted">Nom affiché au client<input name="label" defaultValue={d.label} required className={`${input} mt-1`} /></label><label className="text-xs text-muted">Type<select name="type" defaultValue={itemType(d)} className={`${input} mt-1`}>{deliverableTypes.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label></form>
            </section>
        </Drawer>;
      })}
      <NewDeliverable orderId={order.id} supabaseUrl={supabaseUrl()} supabaseKey={supabasePublishableKey()} linkAction={addDeliveryLinkAction} />

      <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
        <p className="text-sm text-muted">{newCount ? `${newCount} nouvel aperçu / nouvelle version à envoyer` : "Aucun nouvel aperçu à notifier."}</p>
        {order.deliveredAt && (
          <p className="text-sm text-muted">
            Envoyée le {dateFmt.format(new Date(order.deliveredAt))}
            {pageUrl && (
              <>
                {" — "}
                <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  voir la page client ↗
                </a>
              </>
            )}
          </p>
        )}
        </div>
        <form action={sendDeliveryAction} className="flex shrink-0 flex-col items-start sm:items-end">
          <input type="hidden" name="orderId" value={order.id} />
          <button disabled={!newCount || !order.customerEmail} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-40">
            Prévenir le client
          </button>
          {!order.customerEmail && <p className="mt-2 text-xs text-amber-300">Pas d&apos;e-mail client sur cette commande.</p>}
        </form>
      </div>
    </section>
  );
}
