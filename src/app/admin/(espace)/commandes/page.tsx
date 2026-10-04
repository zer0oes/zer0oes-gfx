import type { Metadata } from "next";
import Link from "next/link";
import { OrdersBulkBar, SelectAllOrders } from "@/components/admin/OrdersBulk";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { parseSort, sortOrders, type SortKey } from "@/lib/order-sort";
import { formatPrice } from "@/lib/pricing";
import { balanceDue, getStore, isOrderStatus, orderStatuses } from "@/lib/store";
import { bulkUpdateStatus } from "../../actions";

export const metadata: Metadata = { title: "Commandes" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

const columns: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "client", label: "Client" },
  { key: "offre", label: "Offre" },
  { key: "montant", label: "Payé / total HT" },
  { key: "solde", label: "Solde dû" },
  { key: "statut", label: "Statut" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/admin/commandes">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const status = isOrderStatus(one(sp.statut)) ? (one(sp.statut) as (typeof orderStatuses)[number]["id"]) : undefined;
  const { key, dir } = parseSort(one(sp.tri), one(sp.ordre));
  const updated = Number(one(sp.maj) ?? NaN);
  const error = one(sp.erreur)?.slice(0, 200);

  const store = getStore();
  const [all, invoices] = await Promise.all([store.listOrders(), store.listInvoices()]);
  const orders = sortOrders(status ? all.filter((o) => o.status === status) : all, key, dir);
  const pendingInvoice = new Set(invoices.filter((i) => i.status !== "emise").map((i) => i.orderId));
  const counts = Object.fromEntries(orderStatuses.map((s) => [s.id, all.filter((o) => o.status === s.id).length]));

  // Adresse de la liste avec le filtre et le tri donnés
  const href = (p: { statut?: string; tri?: SortKey; ordre?: string }) => {
    const q = new URLSearchParams();
    if (p.statut) q.set("statut", p.statut);
    if (p.tri && p.tri !== "date") q.set("tri", p.tri);
    if (p.ordre) q.set("ordre", p.ordre);
    const s = q.toString();
    return `/admin/commandes${s ? `?${s}` : ""}`;
  };
  const current = href({ statut: status, tri: key, ordre: dir });

  const chip = (statut: string | undefined, label: string, active: boolean, n: number) => (
    <Link
      key={statut ?? "toutes"}
      href={href({ statut, tri: key, ordre: dir })}
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
        {chip(undefined, "Toutes", !status, all.length)}
        {orderStatuses.map((s) => chip(s.id, s.label, status === s.id, counts[s.id]))}
      </nav>

      {Number.isFinite(updated) && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Statut mis à jour pour {updated} commande{updated > 1 ? "s" : ""}.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p className="mt-10 text-muted">Aucune commande{status ? " avec ce statut" : ""}.</p>
      ) : (
        <form action={bulkUpdateStatus} className="mt-6 space-y-3">
          <input type="hidden" name="back" value={current} />
          <OrdersBulkBar />
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <SelectAllOrders />
                  </th>
                  {columns.map((c) => {
                    const active = c.key === key;
                    // Premier clic : sens naturel de la colonne ; clic suivant : sens inverse
                    const nextDir = active ? (dir === "asc" ? "desc" : "asc") : c.key === "date" ? "desc" : "asc";
                    return (
                      <th key={c.key} scope="col" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined} className="px-4 py-3 font-medium">
                        <Link href={href({ statut: status, tri: c.key, ordre: nextDir })} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
                          {c.label}
                          <span aria-hidden className={active ? "" : "opacity-30"}>
                            {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
                          </span>
                        </Link>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => {
                  const due = balanceDue(o);
                  return (
                    <tr key={o.id} className="relative hover:bg-surface/60">
                      <td className="relative z-10 px-4 py-3">
                        <input type="checkbox" name="ids" value={o.id} aria-label={`Sélectionner la commande de ${o.customerEmail || "client inconnu"} du ${dateFmt.format(new Date(o.createdAt))}`} className="size-4 accent-[var(--accent)]" />
                      </td>
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
        </form>
      )}
    </>
  );
}
