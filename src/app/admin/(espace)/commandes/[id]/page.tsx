import { OrderBriefPanel } from "@/components/admin/OrderBriefPanel";
import { previewPublished } from "@/lib/delivery";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BalanceLinkForm } from "@/components/admin/BalanceLinkForm";
import { DeliverySection } from "@/components/admin/DeliverySection";
import { BriefSummary } from "@/components/admin/BriefSummary";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatRate, netBreakdown } from "@/lib/finance";
import { paymentSummary, ensureDeliveryPlan } from "@/lib/orders";
import { depositAmount, formatPrice } from "@/lib/pricing";
import { balanceDue, getStore } from "@/lib/store";
import { retryInvoiceAction, reviewBriefRevisionAction } from "../../../actions";

export const metadata: Metadata = { title: "Commande" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function OrderPage({ params, searchParams }: PageProps<"/admin/commandes/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.slice(0, 300);
  const store = getStore();
  const [order, finance, invoices] = await Promise.all([store.getOrder(id), store.getFinance(), store.listInvoices(id)]);
  if (!order) notFound();
  await ensureDeliveryPlan(order);
  const deliverables = await store.listDeliverables(id);
  const due = balanceDue(order);

  // Paiements réellement encaissés (acompte puis solde, ou paiement unique)
  const deposit = depositAmount(order.totalPrice, { depositPercent: order.depositPercent, logoDiscount: 0, deliveryDays: "" });
  const payments =
    order.paymentType === "acompte" && order.balancePaidAt ? [deposit, order.amountPaid - deposit] : [order.amountPaid];
  const realFees = order.demo ? undefined : order.feesPaid;
  const net = netBreakdown(payments, finance, realFees);
  const expected = due > 0 ? netBreakdown([...payments, due], finance) : null;
  const money = (n: number) => `${formatPrice(n)}`;

  return (
    <>
      <Link href="/admin/commandes" className="text-sm text-muted hover:text-foreground">← Commandes</Link>
      <header className="mt-4 flex flex-wrap items-start justify-between gap-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{order.offerName}</h1>

            {order.demo && <span className="text-xs text-amber-300">commande de démo</span>}
          </div>
          <p className="mt-2 text-sm">{order.customerName && <>{order.customerName} · </>}{order.customerEmail ? <a href={`mailto:${order.customerEmail}`} className="text-accent hover:underline">{order.customerEmail}</a> : "Client inconnu"}</p>
          <p className="mt-1 text-xs text-muted">Passée le {dateFmt.format(new Date(order.createdAt))}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <OrderStatusSelect key={order.status} orderId={order.id} status={order.status} />
          {order.deliveryToken && <a href={`/commande/${order.deliveryToken}`} target="_blank" rel="noopener noreferrer" className="block text-right text-sm font-semibold text-accent hover:underline">Voir l’espace client ↗</a>}
        </div>
      </header>
      <div className="mt-6 space-y-6">
        <OrderBriefPanel unread={Boolean(order.briefRevisions?.some((revision) => !revision.consultedAt && !revision.acknowledgedAt))} defaultOpen={!order.deliveredAt && !deliverables.some(previewPublished)} summary={["Brief", order.brief?.Pseudo || order.customerName, order.brief?.Plateforme, order.briefReceivedAt ? `Reçu le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(new Date(order.briefReceivedAt))}` : "À compléter"].filter(Boolean).join(" · ")}>
            {!!order.briefRevisions?.length && <div className="mt-3 space-y-3">

              {order.briefRevisions.map((revision, i) => <details key={revision.at}>
                <summary className="cursor-pointer text-sm">Modification {i + 1} — {dateFmt.format(new Date(revision.at))} · <span className={revision.acknowledgedAt ? "text-emerald-300" : revision.consultedAt ? "text-accent" : "text-amber-300"}>{revision.acknowledgedAt ? "Prise en compte" : revision.consultedAt ? "Consultée" : "Non consultée"}</span></summary>
                <p className={`mt-3 text-sm font-semibold ${revision.acknowledgedAt ? "text-emerald-300" : revision.consultedAt ? "text-accent" : "text-amber-300"}`}>{revision.acknowledgedAt ? "Prise en compte" : revision.consultedAt ? "Consultée" : "Non consultée"}</p>
                {revision.consultedAt && <p className="mt-1 text-xs text-muted">Consultée le {dateFmt.format(new Date(revision.consultedAt))}</p>}
                {revision.acknowledgedAt && <p className="mt-1 text-xs text-muted">Prise en compte le {dateFmt.format(new Date(revision.acknowledgedAt))}</p>}
                {!revision.acknowledgedAt && <form action={reviewBriefRevisionAction} className="mt-3">
                  <input type="hidden" name="id" value={order.id} />
                  <input type="hidden" name="at" value={revision.at} />
                  <input type="hidden" name="state" value={revision.consultedAt ? "acknowledged" : "consulted"} />
                  <button className="rounded-full border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10">{revision.consultedAt ? "Marquer comme prise en compte" : "Marquer comme consultée"}</button>
                </form>}
                <dl className="mt-2 space-y-3 text-sm">{Object.entries(revision.changes).map(([key, change]) => <div key={key}><dt className="font-semibold">{key}</dt><dd className="whitespace-pre-wrap text-muted">Avant : {change.before || "—"}</dd><dd className="whitespace-pre-wrap">Après : {change.after || "—"}</dd></div>)}</dl>
              </details>)}
            </div>}
            {order.brief ? (
              <>
                <p className="mt-1 text-xs text-muted">
                  Reçu le {order.briefReceivedAt ? dateFmt.format(new Date(order.briefReceivedAt)) : "?"}
                </p>
                <BriefSummary brief={order.brief} orderId={order.id} logoPreview={order.briefLogoPreview} />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Pas encore reçu.</p>
            )}
          </OrderBriefPanel>
        <DeliverySection order={order} items={deliverables} message={{ ok: one(sp.enregistre), error: one(sp.erreur) }} />
        {order.testimonial && (<section className={card}>
              <h2 className="font-semibold">Avis du client</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm">{order.testimonial.quote}</p>
              <p className="mt-2 text-sm text-muted">— {order.testimonial.author}</p>
              <p className="mt-3 text-sm">{order.testimonial.consent ? "Diffusion autorisée sur le site (accueil et portfolio)." : "Avis privé : aucune autorisation de diffusion."}</p>
              <p className="mt-1 text-xs text-muted">Mis à jour le {dateFmt.format(new Date(order.testimonial.submittedAt))}</p>
              {order.testimonial.consentAt && <p className="mt-1 text-xs text-muted">Accord donné le {dateFmt.format(new Date(order.testimonial.consentAt))}</p>}
              {order.testimonial.consent && <p className="mt-3 text-xs text-muted">Après relecture, reporte cet avis dans le témoignage du projet correspondant dans Portfolio. Vérifie ce choix avant toute publication et répercute toute modification ou tout retrait d’accord.</p>}
            </section>)}
        <details className={`group ${card}`}>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="flex flex-wrap items-center justify-between gap-3">
              <span className="font-semibold">Paiement et facturation</span>
              <span className="text-sm"><span className="text-emerald-300">{money(order.amountPaid)} {due > 0 ? "encaissés" : "réglés"}</span> · Net : {money(net.net)} <span className="ml-3 text-accent">Détails <svg aria-hidden="true" data-icon="expand_more" viewBox="0 0 24 24" className="inline-block size-5 transition-transform group-open:rotate-180" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg></span></span>
            </span>
            {due > 0 && <span className="mt-2 block text-sm text-amber-300">Solde restant : {money(due)}</span>}
          </summary>
          <div className="mt-5 grid items-start gap-5 border-t border-border pt-5 lg:grid-cols-2">
            <div className="space-y-5"><section className={card}>
            <h2 className="font-semibold">Commande</h2>
            <dl className="mt-3 divide-y divide-border">
              <Row label="Client">
                {order.customerName && <>{order.customerName} — </>}
                {order.customerEmail ? (
                  <a href={`mailto:${order.customerEmail}`} className="text-accent hover:underline">
                    {order.customerEmail}
                  </a>
                ) : (
                  <span className="text-muted">inconnu</span>
                )}
              </Row>
              <Row label="Formule">{order.offerName}</Row>
              <Row label="Remise logo">
                {order.hasLogo ? `oui (−${formatPrice(order.logoDiscount)} HT, prix catalogue ${formatPrice(order.listPrice)})` : "non"}
              </Row>
              <Row label="Paiement">{paymentSummary(order)}</Row>
              {order.promoCode && <Row label="Remise promotionnelle">{order.promoCode} · −{formatPrice(order.promoDiscount ?? 0)}</Row>}
              <Row label="Encaissé">{formatPrice(order.amountPaid)} HT</Row>
              <Row label="Solde dû">{due > 0 ? `${formatPrice(due)} HT` : "aucun"}</Row>
              <Row label="Session Stripe">
                <code className="text-xs text-muted">{order.stripeSessionId}</code>
              </Row>
            </dl>
          </section> <section className={card}>
            <h2 className="font-semibold">Solde</h2>
            {due > 0 ? (
              <>
                <p className="mt-2 text-sm text-muted">
                  Reste à régler : <strong className="text-foreground">{formatPrice(due)} HT</strong>. Le montant est
                  recalculé côté serveur au moment de créer le lien.
                </p>
                <BalanceLinkForm orderId={order.id} existingUrl={order.balanceUrl} />
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">
                {order.balancePaidAt
                  ? `Solde payé le ${dateFmt.format(new Date(order.balancePaidAt))}.`
                  : "Commande réglée en totalité."}
              </p>
            )}
          </section></div>
            <div className="space-y-5"><section className={card}>
            <h2 className="font-semibold">Revenu net</h2>
            <dl className="mt-3 divide-y divide-border">
              <Row label="Encaissé">{money(net.gross)} ({net.transactions} paiement{net.transactions > 1 ? "s" : ""})</Row>
              <Row label="Frais Stripe">
                −{money(net.fees)} <span className="text-xs text-muted">{realFees !== undefined ? "réels" : "estimés"}</span>
              </Row>
              <Row label={`URSSAF (${formatRate(finance.urssafRate)})`}>−{money(net.urssaf)}</Row>
              <Row label={`CFP (${formatRate(finance.cfpRate)})`}>−{money(net.cfp)}</Row>
              {finance.vlEnabled && <Row label={`Vers. libératoire (${formatRate(finance.vlRate)})`}>−{money(net.vl)}</Row>}
              <Row label="Net pour toi">
                <strong>{money(net.net)}</strong>
              </Row>
              {expected && (
                <Row label="Net prévu">
                  {money(expected.net)} <span className="text-xs text-muted">une fois le solde payé (frais estimés)</span>
                </Row>
              )}
            </dl>
          </section> <section className={card}>
            <h2 className="font-semibold">Facturation</h2>
            {(order.billingName || order.billingAddress || order.companyName) && (
              <dl className="mt-3 divide-y divide-border">
                {order.billingName && <Row label="Nom">{order.billingName}</Row>}
                {order.billingAddress && (
                  <Row label="Adresse">
                    {[order.billingAddress.line1, order.billingAddress.line2, [order.billingAddress.postalCode, order.billingAddress.city].filter(Boolean).join(" "), order.billingAddress.country]
                      .filter(Boolean)
                      .join(", ")}
                  </Row>
                )}
                {order.companyName && <Row label="Société">{order.companyName}</Row>}
                {order.companySiret && <Row label="SIRET">{order.companySiret}</Row>}
                {order.companyVat && <Row label="N° TVA">{order.companyVat}</Row>}
              </dl>
            )}
            <ul className="mt-3 space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-background/60 p-3 text-sm">
                  <span className="font-medium">
                    {inv.kind === "acompte" ? "Facture d'acompte" : inv.kind === "solde" ? "Facture de solde" : "Facture"}
                  </span>
                  <span>{formatPrice(inv.amount)} HT</span>
                  {inv.number && <span className="text-muted">n° {inv.number}</span>}
                  {inv.status === "emise" ? (
                    <span className="text-emerald-300">{inv.demo ? "simulée (démo)" : "émise et payée"}</span>
                  ) : (
                    <span className="text-amber-300">{inv.status === "echec" ? "en attente (échec)" : "en attente"}</span>
                  )}
                  {inv.sentToCustomer && <span className="text-xs text-muted">envoyée au client</span>}
                  {inv.abbyInvoiceId && !inv.demo && inv.finalized && (
                    <a href={`/admin/factures/${inv.id}`} target="_blank" className="text-accent hover:underline">
                      PDF
                    </a>
                  )}
                  {inv.status !== "emise" && (
                    <form action={retryInvoiceAction} className="ml-auto">
                      <input type="hidden" name="id" value={inv.id} />
                      <input type="hidden" name="orderId" value={order.id} />
                      <button type="submit" className="rounded-full border border-amber-500/50 px-3 py-1 text-xs text-amber-200 hover:bg-amber-500/10">
                        Réessayer
                      </button>
                    </form>
                  )}
                  {inv.error && <p className="w-full text-xs text-red-300">{inv.error}</p>}
                </li>
              ))}
              {invoices.length === 0 && <li className="text-sm text-muted">Aucune facture.</li>}
            </ul>
          </section></div>
          </div>
        </details>
      </div>
    </>
  );
}
