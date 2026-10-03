import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BalanceLinkForm } from "@/components/admin/BalanceLinkForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatRate, netBreakdown } from "@/lib/finance";
import { paymentSummary } from "@/lib/orders";
import { depositAmount, formatPrice } from "@/lib/pricing";
import { balanceDue, getStore, orderStatuses } from "@/lib/store";
import { addNote, updateStatus } from "../../../actions";

export const metadata: Metadata = { title: "Commande" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-3 py-2 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function OrderPage({ params }: PageProps<"/admin/commandes/[id]">) {
  const { id } = await params;
  const store = getStore();
  const [order, finance] = await Promise.all([store.getOrder(id), store.getFinance()]);
  if (!order) notFound();
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
      <Link href="/admin/commandes" className="text-sm text-muted hover:text-foreground">
        ← Commandes
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{order.offerName}</h1>
        <StatusBadge status={order.status} />
        {order.demo && <span className="text-xs text-amber-300">commande de démo</span>}
      </div>
      <p className="mt-1 text-sm text-muted">Passée le {dateFmt.format(new Date(order.createdAt))}</p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className={card}>
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
              <Row label="Encaissé">{formatPrice(order.amountPaid)} HT</Row>
              <Row label="Solde dû">{due > 0 ? `${formatPrice(due)} HT` : "aucun"}</Row>
              <Row label="Session Stripe">
                <code className="text-xs text-muted">{order.stripeSessionId}</code>
              </Row>
            </dl>
          </section>

          <section className={card}>
            <h2 className="font-semibold">Brief</h2>
            {order.brief ? (
              <>
                <p className="mt-1 text-xs text-muted">
                  Reçu le {order.briefReceivedAt ? dateFmt.format(new Date(order.briefReceivedAt)) : "?"}
                </p>
                <dl className="mt-3 divide-y divide-border">
                  {Object.entries(order.brief)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <Row key={k} label={k}>
                        <span className="whitespace-pre-wrap">{v}</span>
                      </Row>
                    ))}
                </dl>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">Pas encore reçu.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className={card}>
            <h2 className="font-semibold">Statut</h2>
            <form action={updateStatus} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="sr-only" htmlFor="status">
                Statut
              </label>
              <select
                id="status"
                name="status"
                defaultValue={order.status}
                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {orderStatuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
                Enregistrer
              </button>
            </form>
          </section>

          <section className={card}>
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
          </section>

          <section className={card}>
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
          </section>

          <section className={card}>
            <h2 className="font-semibold">Notes internes</h2>
            <ul className="mt-3 space-y-3">
              {order.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-background/60 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{dateFmt.format(new Date(n.createdAt))}</p>
                </li>
              ))}
              {order.notes.length === 0 && <li className="text-sm text-muted">Aucune note.</li>}
            </ul>
            <form action={addNote} className="mt-4 space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <label className="sr-only" htmlFor="note">
                Nouvelle note
              </label>
              <textarea
                id="note"
                name="body"
                rows={3}
                required
                placeholder="Note visible uniquement dans l'admin"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">
                Ajouter la note
              </button>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
