import Link from "next/link";
import { balanceDue, type Order } from "@/lib/store";
import { quoteExpired, quoteLabels, type ProjectQuote } from "@/lib/quotes";
import { formatPrice } from "@/lib/pricing";
import { StatusBadge } from "./StatusBadge";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const projectName = (q: ProjectQuote) => q.title || q.request["Type de demande"] || q.request.Sujet || "Demande de projet";
const MAX = 6;

// Résumé du travail en cours en haut du tableau de bord : commandes non terminées et devis à traiter
export function WorkInProgress({ orders, quotes }: { orders: Order[]; quotes: ProjectQuote[] }) {
  const active = orders
    .filter((o) => o.status !== "terminee")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = quotes
    .filter((q) => q.status === "demande" || (q.status === "propose" && !quoteExpired(q)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const due = active.reduce((sum, o) => sum + balanceDue(o), 0);

  return (
    <section aria-labelledby="en-cours" className="mt-6 grid gap-4 lg:grid-cols-2">
      <h2 id="en-cours" className="sr-only">En cours</h2>
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">
            Commandes en cours <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">{active.length}</span>
          </h3>
          <Link href="/admin/commandes" className="text-sm text-accent hover:underline">Toutes →</Link>
        </div>
        {due > 0 && <p className="mt-1 text-xs text-muted">{formatPrice(due)} de soldes à encaisser</p>}
        {active.length ? (
          <ul className="mt-3 divide-y divide-border">
            {active.slice(0, MAX).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/commandes/${o.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-accent">
                  <span className="w-14 shrink-0 text-xs text-muted">{dateFmt.format(new Date(o.createdAt))}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{o.offerName}</span>
                    <span className="text-muted"> · {o.customerName || o.customerEmail || "client"}</span>
                    {o.demo && <span className="ml-1 text-xs text-amber-300">démo</span>}
                  </span>
                  <StatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Aucune commande en cours.</p>
        )}
        {active.length > MAX && <p className="mt-2 text-xs text-muted">et {active.length - MAX} autre{active.length - MAX > 1 ? "s" : ""}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-semibold">
            Devis à traiter <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">{open.length}</span>
          </h3>
          <Link href="/admin/devis" className="text-sm text-accent hover:underline">Tous →</Link>
        </div>
        <p className="mt-1 text-xs text-muted">
          {open.filter((q) => q.status === "demande").length} nouvelle(s) demande(s) · {open.filter((q) => q.status === "propose").length} proposé(s) en attente de réponse
        </p>
        {open.length ? (
          <ul className="mt-3 divide-y divide-border">
            {open.slice(0, MAX).map((q) => (
              <li key={q.id}>
                <Link href={`/admin/devis/${q.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-accent">
                  <span className="w-14 shrink-0 text-xs text-muted">{dateFmt.format(new Date(q.createdAt))}</span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{projectName(q)}</span>
                    <span className="text-muted"> · {q.name || q.email}</span>
                  </span>
                  <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${q.status === "demande" ? "border-amber-400/40 bg-amber-400/10 text-amber-300" : "border-violet-400/40 bg-violet-400/10 text-violet-300"}`}>
                    {quoteLabels[q.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted">Aucun devis en attente.</p>
        )}
        {open.length > MAX && <p className="mt-2 text-xs text-muted">et {open.length - MAX} autre{open.length - MAX > 1 ? "s" : ""}</p>}
      </div>
    </section>
  );
}
