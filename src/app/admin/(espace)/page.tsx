import type { Metadata } from "next";
import Link from "next/link";
import { ChartCard, CumulativeChart, DeclarationsChart, OffersChart, PaymentsChart } from "@/components/admin/charts";
import {
  declarations,
  formatDay,
  newOrdersCount,
  nextDeclaration,
  outstandingBalances,
  periodKinds,
  revenueByOffer,
  series,
  totals,
  type Period,
} from "@/lib/dashboard";
import { loadDashboard, periodParams } from "@/lib/dashboard-data";
import { formatPrice } from "@/lib/pricing";

export const metadata: Metadata = { title: "Tableau de bord" };

function query(p: Partial<Period> & { kind: Period["kind"] }) {
  const q = new URLSearchParams({ periode: p.kind });
  if (p.kind === "perso") {
    if (p.start) q.set("debut", p.start);
    if (p.end) q.set("fin", p.end);
  } else if (p.ref) q.set("ref", p.ref);
  return q.toString();
}

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: React.ReactNode; tone?: "accent" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "accent" ? "text-accent" : ""}`}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const { today, sample, finance, period, orders, movs, inPeriod } = await loadDashboard(periodParams(await searchParams));
  const t = totals(inPeriod, finance);
  const points = series(movs, period, finance, today);
  const decls = declarations(movs, finance, period, today);
  const next = nextDeclaration(movs, finance, today);
  const outstanding = outstandingBalances(orders);
  const newOrders = newOrdersCount(orders, period.start, period.end);
  const offers = revenueByOffer(inPeriod);

  const chip = (kind: Period["kind"], label: string) => (
    <Link
      key={kind}
      href={`/admin?periode=${kind}`}
      aria-current={period.kind === kind ? "page" : undefined}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
        period.kind === kind ? "border-accent bg-accent font-semibold text-background" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
  const arrow = "rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground";
  const input = "rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>
        <a href={`/admin/export?${query(period)}`} download className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2">
          Exporter la période en CSV
        </a>
      </div>

      {sample && (
        <p className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
          Exemple : aucune vente réelle pour l&apos;instant, les chiffres ci-dessous sont fictifs. Ils seront remplacés par tes vraies ventes
          dès le premier paiement.
        </p>
      )}

      <nav aria-label="Période" className="mt-6 flex flex-wrap items-center gap-2">
        {periodKinds.map((k) => chip(k.id, k.label))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {period.prevRef && (
          <Link href={`/admin?${query({ kind: period.kind, ref: period.prevRef })}`} className={arrow} aria-label="Période précédente">
            ←
          </Link>
        )}
        <p className="font-display text-xl font-semibold first-letter:uppercase" aria-live="polite">
          {period.label}
        </p>
        {period.nextRef && (
          <Link href={`/admin?${query({ kind: period.kind, ref: period.nextRef })}`} className={arrow} aria-label="Période suivante">
            →
          </Link>
        )}
        {period.kind !== "perso" && (
          <Link href={`/admin?periode=${period.kind}`} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            Aujourd&apos;hui
          </Link>
        )}
      </div>

      {period.kind === "perso" && (
        <form action="/admin" className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="periode" value="perso" />
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Du</span>
            <input type="date" name="debut" defaultValue={period.start} required className={input} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted">Au</span>
            <input type="date" name="fin" defaultValue={period.end} required className={input} />
          </label>
          <button type="submit" className="rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-background">
            Afficher
          </button>
        </form>
      )}

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          label="Chiffre d'affaires encaissé"
          value={formatPrice(t.revenue)}
          hint={
            <>
              {t.payments} paiement{t.payments > 1 ? "s" : ""}
              {t.refunds > 0 && <> · {formatPrice(t.refunds)} remboursés déduits</>}
            </>
          }
        />
        <Kpi
          label="Cotisations URSSAF estimées"
          value={formatPrice(t.contributions)}
          hint={`URSSAF ${formatPrice(t.urssaf)} · CFP ${formatPrice(t.cfp)}${finance.vlEnabled ? ` · impôt ${formatPrice(t.vl)}` : ""}`}
        />
        <Kpi label="Frais Stripe" value={formatPrice(t.fees)} hint={t.feesEstimated ? "En partie estimés (frais réels inconnus)" : "Frais réels"} />
        <Kpi label="Net réel" value={formatPrice(t.net)} tone="accent" hint="CA − frais − cotisations" />
        <Kpi label="Nouvelles commandes" value={String(newOrders)} hint="Premier paiement sur la période" />
        <Kpi
          label="Soldes restant à encaisser"
          value={formatPrice(outstanding.amount)}
          hint={`${outstanding.count} commande${outstanding.count > 1 ? "s" : ""} en attente du solde (à ce jour)`}
        />
      </dl>

      <section aria-labelledby="echeance" className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:p-6">
        <h2 id="echeance" className="text-xs uppercase tracking-wider text-muted">
          Prochaine échéance URSSAF ({finance.urssafPeriodicity === "mensuelle" ? "déclaration mensuelle" : "déclaration trimestrielle"})
        </h2>
        <p className="mt-2 text-lg">
          <strong className="font-display">{next.label}</strong> : déclarer <strong className="tabular-nums">{formatPrice(next.revenue)}</strong> de
          chiffre d&apos;affaires, soit environ <strong className="tabular-nums">{formatPrice(next.contributions)}</strong> de cotisations,{" "}
          {next.state === "en_cours" ? "période en cours, " : ""}avant le <strong>{formatDay(next.deadline)}</strong>.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <ChartCard id="encaissements" title="Encaissements" description="Par date d'encaissement, selon le type de paiement.">
          <PaymentsChart points={points} />
        </ChartCard>
        <ChartCard id="cumul" title="Chiffre d'affaires et net cumulés" description="Ce qu'il te reste après frais Stripe et cotisations.">
          <CumulativeChart points={points} />
        </ChartCard>
        <ChartCard
          id="urssaf"
          title="Cotisations par déclaration URSSAF"
          description="Chiffre d'affaires à déclarer (remboursements déduits) et cotisations estimées, par période de déclaration."
        >
          <DeclarationsChart items={decls} />
        </ChartCard>
        <ChartCard id="offres" title="Chiffre d'affaires par offre" description="Sur la période, remboursements déduits.">
          <OffersChart items={offers} />
        </ChartCard>
      </div>

      <p className="mt-6 text-sm text-muted">
        Estimation, à vérifier avec ta déclaration URSSAF. Taux et rythme de déclaration modifiables dans{" "}
        <Link href="/admin/offres" className="underline underline-offset-4 hover:text-foreground">
          Offres et réglages
        </Link>
        .
      </p>
    </>
  );
}
