import { addDeliveryLinkAction, deleteDeliverableAction, sendDeliveryAction } from "@/app/admin/livraison-actions";
import { formatBytes } from "@/lib/delivery";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";
import type { Deliverable, Order } from "@/lib/store";
import { DeliveryUpload } from "./DeliveryUpload";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// Livraison de la commande : liens d'import StreamElements, fichiers (Streamlabs, visuels,
// guide), puis envoi au client d'un lien privé vers sa page de livraison.
export async function DeliverySection({ order, items, message }: { order: Order; items: Deliverable[]; message?: { ok?: string; error?: string } }) {
  const pageUrl = order.deliveryToken ? `${await siteUrl()}/livraison/${order.deliveryToken}` : null;
  return (
    <section id="livraison" className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-semibold">Livraison</h2>
      <p className="mt-1 text-sm text-muted">
        Liens d&apos;import StreamElements et fichiers (Streamlabs, visuels, guide). Le client les retrouve sur une page privée, sans compte.
      </p>
      {message?.error && (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {message.error}
        </p>
      )}
      {message?.ok && message.ok !== "1" && (
        <p role="status" className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {message.ok}
        </p>
      )}

      <ul className="mt-4 divide-y divide-border">
        {items.map((d) => (
          <li key={d.id} className="py-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs text-muted">{d.kind === "lien" ? "Lien" : "Fichier"}</span>
                <span className="font-medium">{d.label}</span>
                <span className="ml-2 text-xs text-muted">{d.kind === "lien" ? d.url : formatBytes(d.sizeBytes)}</span>
                {d.approvedAt && (
                  <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                    ✓ validé par le client le {dateFmt.format(new Date(d.approvedAt))}
                  </span>
                )}
              </span>
              <form action={deleteDeliverableAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="id" value={d.id} />
                <button className="text-xs text-muted hover:text-red-300" aria-label={`Retirer ${d.label}`}>
                  Retirer
                </button>
              </form>
            </div>
            {/* Remarques laissées par le client sur sa page de livraison */}
            {d.clientNotes?.length ? (
              <ul className="mt-2 space-y-1.5 border-l-2 border-amber-400/50 pl-3">
                {d.clientNotes.map((n, i) => (
                  <li key={i}>
                    <span className="block text-xs text-amber-300">Remarque du client — {dateFmt.format(new Date(n.at))}</span>
                    <span className="whitespace-pre-line">{n.body}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
        {items.length === 0 && <li className="py-2 text-sm text-muted">Rien à livrer pour l&apos;instant.</li>}
      </ul>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={addDeliveryLinkAction} className="space-y-2">
          <input type="hidden" name="orderId" value={order.id} />
          <p className="text-sm font-medium">Ajouter un lien d&apos;import</p>
          <input name="label" required placeholder="Ex. Overlays — import StreamElements" aria-label="Nom du lien" className={input} />
          <input name="url" type="url" required placeholder="https://streamelements.com/…" aria-label="Adresse du lien (https)" className={input} />
          <button className="rounded-full border border-border px-4 py-2 text-sm font-semibold hover:border-accent">Ajouter le lien</button>
        </form>
        <DeliveryUpload orderId={order.id} supabaseUrl={supabaseUrl()} supabaseKey={supabasePublishableKey()} />
      </div>

      <div className="mt-6 border-t border-border pt-5">
        {order.deliveredAt && (
          <p className="mb-3 text-sm text-muted">
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
        <form action={sendDeliveryAction}>
          <input type="hidden" name="orderId" value={order.id} />
          <button disabled={!items.length || !order.customerEmail} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-40">
            {order.deliveredAt ? "Renvoyer le lien au client" : "Envoyer la livraison au client"}
          </button>
          {!order.customerEmail && <p className="mt-2 text-xs text-amber-300">Pas d&apos;e-mail client sur cette commande.</p>}
        </form>
      </div>
    </section>
  );
}
