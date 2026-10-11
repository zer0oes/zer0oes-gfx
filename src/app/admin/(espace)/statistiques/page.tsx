import type { Metadata } from "next";
import Link from "next/link";
import { DatePicker } from "@/components/DatePicker";
import { ChartCard } from "@/components/admin/charts";
import { RankList, VisitsChart } from "@/components/admin/stats-charts";
import { addDays, daysBetween, formatDay, newOrdersCount, parisDay, periodKinds, resolvePeriod, type Period } from "@/lib/dashboard";
import { periodParams } from "@/lib/dashboard-data";
import { STATS_RETENTION_MONTHS, selectedStatsDay, summarize } from "@/lib/stats";
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

function Kpi({ label, value, hint, tone, change }: { label: string; value: string; hint?: React.ReactNode; tone?: "accent"; change?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums ${tone === "accent" ? "text-accent" : ""}`}>{value}</dd>
      {hint && <dd className="mt-2 text-xs text-muted sm:text-sm">{hint}</dd>}
      {change && <dd className="mt-3 border-t border-border pt-3 text-xs font-medium sm:text-sm">{change}</dd>}
    </div>
  );
}

export default async function StatsPage({ searchParams }: PageProps<"/admin/statistiques">) {
  const search = await searchParams;
  const params = periodParams(search);
  const today = parisDay(new Date());
  // Par défaut : le mois en cours
  const period = resolvePeriod(params.periode ? params : { ...params, periode: "mois" }, today);
  const end = period.end < today ? period.end : today;
  const hasElapsed = period.start <= end;
  const duration = hasElapsed ? daysBetween(period.start, end) + 1 : 0;
  const previous = { start: addDays(period.start, -duration), end: addDays(period.start, -1) };
  const retentionDate = new Date(`${today}T00:00:00Z`);
  retentionDate.setUTCMonth(retentionDate.getUTCMonth() - STATS_RETENTION_MONTHS);
  const canCompare = hasElapsed && previous.start > retentionDate.toISOString().slice(0, 10);
  const store = getStore();
  // Marge d'un jour de chaque côté (fuseau de Paris), le tri par jour est fait ensuite
  const [events, orders] = await Promise.all([
    store.listStatEvents(`${addDays(previous.start, -1)}T00:00:00.000Z`, `${addDays(hasElapsed ? end : period.end, 2)}T00:00:00.000Z`),
    store.listOrders(),
  ]);
  const s = summarize(events, period);
  const before = summarize(events, previous);
  const previousPaid = newOrdersCount(orders.filter((o) => !o.demo), previous.start, previous.end);
  const delta = (current: number, prior: number, unit: string) => canCompare
    ? `${current - prior > 0 ? "+" : ""}${nf(current - prior)} ${unit} sur ${duration} jours`
    : undefined;
  const points = s.points;
  const selectedDay = selectedStatsDay(search.jour, period, today);
  const detail = selectedDay ? summarize(events, { start: selectedDay, end: selectedDay }) : s;
  const periodQuery = query(period);
  const periodHref = `/admin/statistiques?${periodQuery}`;
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
        <form action="/admin/statistiques" className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="periode" value="perso" />
          <DatePicker key={`debut-${period.start}`} name="debut" label="Du" locale="fr" defaultValue={period.start} required compact inline />
          <DatePicker key={`fin-${period.end}`} name="fin" label="au" locale="fr" defaultValue={period.end} required compact inline />
          <button type="submit" className="min-h-11 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-background">
            Afficher
          </button>
        </form>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Visiteurs cumulés" value={nf(s.visitors)} hint="Visiteurs uniques par jour, additionnés" change={delta(s.visitors, before.visitors, "visiteurs")} />
        <Kpi label="Demandes reçues" value={nf(s.forms)} hint="Formulaires envoyés depuis le site" tone="accent" change={delta(s.forms, before.forms, "demandes")} />
        <Kpi label="Demandes / visiteurs" value={percent(s.forms, s.visitors)} hint="Ratio indicatif, sans suivi individuel" />
        <Kpi label="Commandes payées" value={nf(paid)} hint="Premier paiement reçu sur la période" tone="accent" change={delta(paid, previousPaid, "commandes")} />
      </dl>
      {canCompare && <p className="mt-3 text-sm text-muted">
        Évolution comparée au {formatDay(previous.start)} – {formatDay(previous.end)} ({duration} jours).
        {period.end > today && <> Période en cours : données jusqu’au {formatDay(today)} inclus.</>}
      </p>}

      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <div className="min-w-0 xl:col-span-2">
          <ChartCard id="visites" title="Visites" description="Visiteurs et pages vues, par jour (par mois au-delà de 35 jours).">
            <div className="mb-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <p><strong className="text-lg tabular-nums">{nf(s.views)}</strong> pages vues <span className="text-muted">· {s.visitors ? (s.views / s.visitors).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "—"} par visiteur cumulé</span></p>
              <p><strong className="text-lg tabular-nums">{nf(s.clicks)}</strong> clics sur les liens et boutons</p>
            </div>
            <VisitsChart points={points} dayHref={periodHref} selectedDay={selectedDay} today={today} />
            {points.some((p) => p.start === p.end) && <p className="mt-3 text-sm text-muted">Clique sur une journée pour afficher son détail ci-dessous, même sans visite.</p>}
          </ChartCard>
        </div>
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 xl:col-span-2" aria-label="Filtre des statistiques détaillées">
          <div aria-live="polite">
            <h2 className="font-display text-lg font-semibold">{selectedDay ? `Détail du ${formatDay(selectedDay)}` : "Détail de la période"}</h2>
            <p className="mt-1 text-sm text-muted">{nf(detail.visitors)} visiteurs cumulés · {nf(detail.views)} pages vues · {nf(detail.clicks)} clics</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasElapsed && <form action="/admin/statistiques" className="flex flex-wrap items-end gap-2">
              {Array.from(new URLSearchParams(periodQuery)).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
              <DatePicker key={`${period.start}-${selectedDay ?? end}`} name="jour" label="Choisir un jour" locale="fr" min={period.start} max={end} defaultValue={selectedDay ?? end} required compact />
              <button className="min-h-11 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-background" type="submit">Filtrer</button>
            </form>}
            {selectedDay && <Link href={periodHref} scroll={false} className="text-sm text-accent underline underline-offset-4">Toute la période</Link>}
          </div>
        </section>
        <div className="grid min-w-0 content-start gap-6">
          <ChartCard id="pages" title="Pages les plus vues" description="Part du total des pages vues pour la sélection.">
            <RankList items={detail.pages} total={detail.views} limit={5} empty="Aucune visite pour cette sélection." />
          </ChartCard>
          <ChartCard id="clics" title="Clics" description="Boutons et liens les plus cliqués (↗ : lien vers un autre site).">
            <RankList items={detail.clickTargets} total={detail.clicks} limit={5} empty="Aucun clic pour cette sélection." color="var(--accent)" />
            <p className="mt-4 text-sm text-muted">Pourcentages calculés sur les {nf(detail.clicks)} clics de la sélection.</p>
          </ChartCard>
        </div>
        <div className="grid min-w-0 content-start gap-6">
          <ChartCard id="sources" title="Provenance" description="D'où arrivent les visiteurs (réseau, moteur de recherche, lien direct…).">
            <RankList items={detail.sources} total={detail.visitors} empty="Aucune visite pour cette sélection." color="var(--accent-3)" />
            <p className="mt-4 text-sm text-muted">Accès direct : lien saisi, favori ou source non identifiée. Les liens avec utm_source permettent d’identifier tes campagnes.</p>
          </ChartCard>
          <ChartCard id="appareils" title="Appareils" description="Répartition des visiteurs cumulés dont l’appareil est connu.">
            <RankList items={detail.devices} empty="Aucune visite pour cette sélection." />
          </ChartCard>
          <ChartCard id="formulaires" title="Formulaires envoyés">
            <RankList items={detail.formsByType} empty="Aucun formulaire envoyé pour cette sélection." color="var(--accent-3)" />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
