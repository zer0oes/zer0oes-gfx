import Link from "next/link";
import { ClickableRow } from "@/components/admin/ClickableRow";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { quoteExpired, quoteLabels, type ProjectQuote } from "@/lib/quotes";
import { formatPrice } from "@/lib/pricing";

export const metadata = { title: "Devis" };
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
const columns = [
  { key: "date", label: "Date" }, { key: "client", label: "Client" },
  { key: "offre", label: "Projet / Offre" }, { key: "montant", label: "Total HT" },
  { key: "validite", label: "Validité" }, { key: "statut", label: "Statut" },
] as const;
type SortKey = (typeof columns)[number]["key"];
const tones: Record<ProjectQuote["status"], string> = {
  demande: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  propose: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  accepte: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  refuse: "border-border bg-surface-2 text-muted",
};
const projectName = (q: ProjectQuote) => q.title || q.request["Type de demande"] || q.request.Sujet || "Demande de projet";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const all = await getStore().listQuotes();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const status = Object.keys(quoteLabels).find((s) => s === one(sp.statut)) as ProjectQuote["status"] | undefined;
  const key: SortKey = columns.find((c) => c.key === one(sp.tri))?.key ?? "date";
  const dir = one(sp.ordre) === "asc" ? "asc" : one(sp.ordre) === "desc" ? "desc" : key === "date" ? "desc" : "asc";
  const value = (q: ProjectQuote): string | number => {
    switch (key) {
      case "date": return q.createdAt;
      case "client": return q.email;
      case "offre": return projectName(q);
      case "montant": return q.totalPrice;
      case "validite": return q.validUntil;
      case "statut": return quoteLabels[q.status];
    }
  };
  const quotes = all.filter((q) => !status || q.status === status).sort((a, b) => {
    const av = value(a), bv = value(b);
    const result = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "fr", { numeric: true });
    return (dir === "asc" ? result : -result) || a.id.localeCompare(b.id);
  });
  const href = (statut: string | undefined, tri: SortKey = key, ordre = dir) => {
    const query = new URLSearchParams({ tri, ordre });
    if (statut) query.set("statut", statut);
    return `/admin/devis?${query}`;
  };
  const chip = (s: ProjectQuote["status"] | undefined, label: string, count: number) => <Link key={s ?? "toutes"} href={href(s)} aria-current={status === s ? "page" : undefined}
    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${status === s ? "border-accent bg-accent font-semibold text-background" : "border-border text-muted hover:text-foreground"}`}>
    {label} <span className="opacity-70">({count})</span>
  </Link>;

  return <>
    <h1 className="font-display text-3xl font-bold">Devis</h1>
    <nav aria-label="Filtrer par statut" className="mt-6 flex flex-wrap gap-2">
      {chip(undefined, "Toutes", all.length)}
      {(Object.keys(quoteLabels) as ProjectQuote["status"][]).map((s) => chip(s, quoteLabels[s], all.filter((q) => q.status === s).length))}
    </nav>
    {one(sp.supprime) === "1" && <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">La demande de devis a été supprimée.</p>}
    {quotes.length === 0 ? <p className="mt-10 text-muted">Aucun devis{status ? " avec ce statut" : " pour le moment"}.</p> :
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted"><tr>
            {columns.map((c) => {
              const active = key === c.key;
              const nextDir = active ? dir === "asc" ? "desc" : "asc" : c.key === "date" ? "desc" : "asc";
              return <th key={c.key} scope="col" aria-sort={active ? dir === "asc" ? "ascending" : "descending" : undefined} className="px-4 py-3 font-medium">
                <Link href={href(status, c.key, nextDir)} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}>
                  {c.label}<span aria-hidden className={active ? "" : "opacity-30"}>{active ? dir === "asc" ? "↑" : "↓" : "↕"}</span>
                </Link>
              </th>;
            })}
            <th scope="col" className="px-4 py-3 font-medium">Voir</th>
          </tr></thead>
          <tbody className="divide-y divide-border">{quotes.map((q) => <ClickableRow key={q.id} href={`/admin/devis/${q.id}`}>
            <td className="whitespace-nowrap px-4 py-3 text-muted">{dateFmt.format(new Date(q.createdAt))}</td>
            <td className="px-4 py-3"><Link href={`/admin/devis/${q.id}`} className="font-medium hover:text-accent">{q.email}</Link><p className="mt-1 text-xs text-muted">{q.name}</p></td>
            <td className="px-4 py-3">{projectName(q)}</td>
            <td className="whitespace-nowrap px-4 py-3">{q.totalPrice > 0 ? formatPrice(q.totalPrice) : <span className="text-muted">À chiffrer</span>}</td>
            <td className="whitespace-nowrap px-4 py-3">{q.validUntil ? <><span>{new Date(`${q.validUntil}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })}</span>{q.status === "propose" && quoteExpired(q) && <span className="ml-2 text-xs text-amber-300">Expiré</span>}</> : <span className="text-muted">—</span>}</td>
            <td className="px-4 py-3"><span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[q.status]}`}>{quoteLabels[q.status]}</span></td>
            <td className="px-4 py-3"><Link href={`/admin/devis/${q.id}`} title="Ouvrir le devis" aria-label={`Voir le devis ${projectName(q)} de ${q.email}`} className="inline-flex size-9 items-center justify-center rounded-full border border-border text-accent transition hover:border-accent hover:bg-accent/10"><MaterialIcon name="open_in_new" /></Link></td>
          </ClickableRow>)}</tbody>
        </table>
      </div>}
  </>;
}
