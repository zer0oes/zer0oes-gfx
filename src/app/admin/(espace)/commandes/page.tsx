import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatPrice } from "@/lib/pricing";
import { balanceDue, getStore, isOrderStatus, orderStatuses } from "@/lib/store";

export const metadata: Metadata = { title: "Commandes" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

export default async function OrdersPage({ searchParams }: PageProps<"/admin/commandes">) {
  const { statut } = await searchParams;
  const status = isOrderStatus(statut) ? statut : undefined;
  const store = getStore();
  const [orders, all, invoices] = await Promise.all([store.listOrders(status), store.listOrders(), store.listInvoices()]);
  const pendingInvoice = new Set(invoices.filter((i) => i.status !== "emise").map((i) => i.orderId));
  const counts = Object.fromEntries(orderStatuses.map((s) => [s.id, all.filter((o) => o.status === s.id).length]));

  const chip = (href: string, label: string, active: boolean, n: number) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
        active ? "border-accent bg-accent font-semibold text-background" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label} <span className="opacity-70">({n})</span>
    </Link>
  );

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Commandes</h1>
      <nav aria-label="Filtrer par statut" className="mt-6 flex flex-wrap gap-2">
        {chip("/admin/commandes", "Toutes", !status, all.length)}
        {orderStatuses.map((s) => chip(`/admin/commandes?statut=${s.id}`, s.label, status === s.id, counts[s.id]))}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-10 text-muted">Aucune commande{status ? " avec ce statut" : ""}.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Offre</th>
                <th className="px-4 py-3 font-medium">Payé / total HT</th>
                <th className="px-4 py-3 font-medium">Solde dû</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => {
                const due = balanceDue(o);
                return (
                  <tr key={o.id} className="relative hover:bg-surface/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{dateFmt.format(new Date(o.createdAt))}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/commandes/${o.id}`} className="font-medium after:absolute after:inset-0">
                        {o.customerEmail || <span className="text-muted">e-mail inconnu</span>}
                      </Link>
                      {o.demo && <span className="ml-2 text-xs text-amber-300">démo</span>}
                    </td>
                    <td className="px-4 py-3">
                      {o.offerName}
                      {o.hasLogo && <span className="ml-1 text-xs text-muted">(logo fourni)</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatPrice(o.amountPaid)} / {formatPrice(o.totalPrice)}
                      {o.paymentType === "acompte" && <span className="ml-1 text-xs text-muted">acompte</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{due > 0 ? formatPrice(due) : "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                      {pendingInvoice.has(o.id) && <span className="ml-2 text-xs text-amber-300">facture en attente</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
