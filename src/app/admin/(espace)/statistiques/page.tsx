import type { Metadata } from "next";
import Link from "next/link";
import { ChartCard } from "@/components/admin/charts";
import { RankList, VisitsChart } from "@/components/admin/stats-charts";
import { addDays, newOrdersCount, parisDay, periodKinds, resolvePeriod, type Period } from "@/lib/dashboard";
import { periodParams } from "@/lib/dashboard-data";
import { STATS_RETENTION_MONTHS, summarize } from "@/lib/stats";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Statistiques" };

function query(p: Partial<Period> & { kind: Period["kind"] }) {
  const q = new URLSearchParams({ periode: p.kind });
  if (p.kind === "perso") {
    if (p.start) q.set("debut", p.start);
    if (p.end) q.set("fin", p.end);
  } else if (p.ref) q.set("ref", p.ref);
  return q.toString();
}

const nf = (n: number) => n.toLocaleString("fr-FR");
const percent = (part: number, whole: number) => (whole ? `${(Math.round((part / whole) * 1000) / 10).toLocaleString("fr-FR")} %` : "—");

function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: React.ReactNode; tone?: "accent" }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "accent" ? "text-accent" : ""}`}>{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted">{hint}</dd>}
    </div>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/admin/statistiques">) {
  const params = periodParams(await searchParams);
  const today = parisDay(new Date());
  // Par défaut : le mois en cours
  const period = resolvePeriod(params.periode ? params : { ...params, periode: "mois" }, today);
  const store = getStore();
  // Marge d'un jour de chaque côté (fuseau de Paris), le tri par jour est fait ensuite
  const [events, orders] = await Promise.all([
    store.listStatEvents(`${addDays(period.start, -1)}T00:00:00.000Z`, `${addDays(period.end, 2)}T00:00:00.000Z`),
    store.listOrders(),
  ]);
  const s = summarize(events, period);
  const paid = newOrdersCount(
    orders.filter((o) => !o.demo),
    period.start,
    period.end,
  );

  const chip = (kind: Period["kind"], label: string) => (
    <Link
      key={kind}
      href={`/admin/statistiques?periode=${kind}`}
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
      <h1 className="font-display text-3xl font-bold">Statistiques</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Visites du site public, sans cookie ni adresse IP. Tes propres visites (admin connecté) et les robots ne sont pas comptés.
        Données conservées {STATS_RETENTION_MONTHS} mois.
      </p>

      <nav aria-label="Période" className="mt-6 flex flex-wrap items-center gap-2">
        {periodKinds.map((k) => chip(k.id, k.label))}
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {period.prevRef && (
          <Link href={`/admin/statistiques?${query({ kind: period.kind, ref: period.prevRef })}`} className={arrow} aria-label="Période précédente">
            ←
          </Link>
        )}
        <p className="font-display text-xl font-semibold first-letter:uppercase" aria-live="polite">
          {period.label}
        </p>
        {period.nextRef && (
          <Link href={`/admin/statistiques?${query({ kind: period.kind, ref: period.nextRef })}`} className={arrow} aria-label="Période suivante">
            →
          </Link>
        )}
        {period.kind !== "perso" && (
          <Link href={`/admin/statistiques?periode=${period.kind}`} className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
            Aujourd&apos;hui
          </Link>
        )}
      </div>

      {period.kind === "perso" && (
        <form action="/admin/statistiques" className="mt-4 flex flex-wrap items-end gap-3">
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

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Visiteurs" value={nf(s.visitors)} hint="Visiteurs uniques de chaque jour, additionnés" />
        <Kpi label="Pages vues" value={nf(s.views)} hint={s.visitors ? `${(s.views / s.visitors).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} pages par visiteur` : undefined} />
        <Kpi label="Clics" value={nf(s.clicks)} hint="Liens et boutons du site" />
        <Kpi label="Formulaires envoyés" value={nf(s.forms)} hint={`${percent(s.forms, s.visitors)} des visiteurs`} />
        <Kpi label="Commandes payées" value={nf(paid)} hint={`${percent(paid, s.visitors)} des visiteurs`} tone="accent" />
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="xl:col-span-2">
          <ChartCard id="visites" title="Visites" description="Visiteurs et pages vues, par jour (par mois au-delà de 35 jours).">
            <VisitsChart points={s.points} />
          </ChartCard>
        </div>
        <ChartCard id="pages" title="Pages les plus vues">
          <RankList items={s.pages} empty="Aucune visite sur la période." />
        </ChartCard>
        <ChartCard id="sources" title="Provenance" description="D'où arrivent les visiteurs (réseau, moteur de recherche, lien direct…).">
          <RankList items={s.sources} empty="Aucune visite sur la période." color="var(--accent-3)" />
        </ChartCard>
        <ChartCard id="clics" title="Clics" description="Boutons et liens les plus cliqués (↗ : lien vers un autre site).">
          <RankList items={s.clickTargets} empty="Aucun clic sur la période." color="var(--accent)" />
        </ChartCard>
        <div className="grid content-start gap-6">
          <ChartCard id="appareils" title="Appareils">
            <RankList items={s.devices} empty="Aucune visite sur la période." />
          </ChartCard>
          <ChartCard id="formulaires" title="Formulaires envoyés">
            <RankList items={s.formsByType} empty="Aucun formulaire envoyé sur la période." color="var(--accent-3)" />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
