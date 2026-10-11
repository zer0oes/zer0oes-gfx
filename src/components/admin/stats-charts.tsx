"use client";

// Graphiques de la page Statistiques, avec description et tableau des données.
import { useChartSize } from "./use-chart-size";
import { ChartTooltip } from "./ChartTooltip";
import Link from "next/link";
import type { Ranked, StatsPoint } from "@/lib/stats";

const PAD = { top: 14, right: 14, bottom: 36, left: 48 };

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const nf = (n: number) => n.toLocaleString("fr-FR");

// Deux barres distinctes par date : aucune série ne masque l'autre à valeurs égales.
export function VisitsChart({ points, dayHref, selectedDay, today }: { points: StatsPoint[]; dayHref?: string; selectedDay?: string; today?: string }) {
  const { svgRef, width: W, height: H } = useChartSize();
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = niceMax(Math.max(0, ...points.flatMap((p) => [p.views, p.visitors])));
  const y = (v: number) => PAD.top + ((max - v) / max) * innerH;
  const step = innerW / Math.max(1, points.length);
  const x = (i: number) => PAD.left + step * i + step / 2;
  const bw = Math.min(18, step * 0.3);
  const gap = Math.min(4, step * 0.08);
  const every = Math.ceil(points.length / 12);
  const views = points.reduce((s, p) => s + p.views, 0);
  const visitors = points.reduce((s, p) => s + p.visitors, 0);

  return (
    <>
      <div className="overflow-x-auto overscroll-x-contain rounded-lg" tabIndex={0} role="region" aria-label="Graphique des visites, défilement horizontal sur petit écran">
      <div className="min-w-[640px]">
      <ChartTooltip><svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-[240px] w-full sm:h-[280px]" role="group" aria-label={`${nf(visitors)} visiteurs et ${nf(views)} pages vues sur la période. Détail dans le tableau des données.`}>
        <g fontSize="13" fill="var(--foreground)">
          {[max, max / 2, 0].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={PAD.left - 10} y={y(t) + 5} textAnchor="end">
                {nf(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            if (i % every !== 0 && i !== points.length - 1) return null;
            const future = !!today && p.start > today;
            const label = <text x={x(i)} y={H - 10} textAnchor="middle" opacity={future ? 0.4 : 1}>{p.axis}</text>;
            return dayHref && p.start === p.end && !future
              ? <Link key={p.key} href={`${dayHref}&jour=${p.start}`} prefetch={false} scroll={false} aria-label={`Afficher le détail du ${p.label}`} className="hover:fill-accent focus-visible:fill-accent">{label}</Link>
              : <g key={p.key}>{label}</g>;
          })}
        </g>
        {points.map((p, i) => {
          const future = !!today && p.start > today;
          const selectable = dayHref && p.start === p.end && !future;
          const value = future ? "À venir" : `${nf(p.visitors)} visiteurs · ${nf(p.views)} pages vues`;
          if (future) return <g key={p.key} aria-label={`${p.label} : à venir`}><rect x={x(i) - step / 2} y={PAD.top} width={step} height={innerH} fill="var(--muted)" opacity="0.06" /></g>;
          const bars = <g data-chart-label={p.label} data-chart-value={value} data-chart-color="var(--accent)" aria-label={`${p.label} : ${value}`}>
            <rect x={x(i) - step / 2} y={PAD.top} width={step} height={innerH} fill="var(--accent)" opacity={selectedDay === p.start ? 0.15 : 0} className="hover:opacity-10" />
            {p.views > 0 && (
              <rect x={x(i) + gap / 2} width={bw} y={y(p.views)} height={y(0) - y(p.views)} rx="2" fill="var(--accent-2)" aria-label={`${p.label} : ${nf(p.views)} pages vues`} />
            )}
            {p.visitors > 0 && (
              <rect x={x(i) - gap / 2 - bw} width={bw} y={y(p.visitors)} height={y(0) - y(p.visitors)} rx="2" fill="var(--accent)" aria-label={`${p.label} : ${nf(p.visitors)} visiteurs`} />
            )}
          </g>;
          return selectable ? <Link key={p.key} href={`${dayHref}&jour=${p.start}`} prefetch={false} scroll={false} data-chart-label={p.label} data-chart-value={value} data-chart-color="var(--accent)" aria-label={`Afficher le détail du ${p.label}`} aria-current={selectedDay === p.start ? "date" : undefined} className="cursor-pointer outline-none focus-visible:stroke-accent focus-visible:stroke-2">{bars}</Link> : <g key={p.key} tabIndex={0} data-chart-label={p.label} data-chart-value={value} data-chart-color="var(--accent)" className="outline-none focus-visible:stroke-accent focus-visible:stroke-2">{bars}</g>;
        })}
      </svg></ChartTooltip>
      </div>
      </div>
      <p className="mt-2 text-xs text-muted sm:hidden">Fais défiler le graphique horizontalement pour voir toutes les dates.</p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: "var(--accent)" }} />
          Visiteurs
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: "var(--accent-2)" }} />
          Pages vues
        </li>
        {today && points.some((p) => p.start > today) && <li className="flex items-center gap-2"><span className="size-3 rounded-sm bg-muted/20" />À venir</li>}
      </ul>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">Voir les données</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-xs sm:text-sm">
            <caption className="sr-only">Visiteurs et pages vues</caption>
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-2 py-1.5 font-medium">Période</th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">Visiteurs</th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">Pages vues</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {points.map((p) => (
                <tr key={p.key}>
                <th scope="row" className="whitespace-nowrap px-2 py-1.5 font-normal">{dayHref && p.start === p.end && (!today || p.start <= today) ? <Link href={`${dayHref}&jour=${p.start}`} prefetch={false} scroll={false} className="text-accent underline underline-offset-4">{p.label}</Link> : <>{p.label}{today && p.start > today && <span className="ml-2 text-muted">À venir</span>}</>}</th>
                  <td className="px-2 py-1.5 text-right tabular-nums">{today && p.start > today ? "—" : nf(p.visitors)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{today && p.start > today ? "—" : nf(p.views)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}

// Classement (pages, provenances, clics…) en barres horizontales
export function RankList({ items, empty, color = "var(--accent-2)", total: suppliedTotal, limit }: { items: Ranked[]; empty: string; color?: string; total?: number; limit?: number }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = Math.max(1, suppliedTotal ?? items.reduce((s, i) => s + i.count, 0));
  const list = (rows: Ranked[]) => (
    <ChartTooltip><ul className="space-y-3">
      {rows.map((i) => (
        <li key={i.label} tabIndex={0} data-chart-label={i.label} data-chart-value={`${nf(i.count)} (${Math.round((i.count / total) * 100)} %)`} data-chart-color={color} className="rounded-md outline-none focus-visible:ring-1 focus-visible:ring-accent">
          <div className="flex justify-between gap-4 text-sm">
            <span className="min-w-0 truncate" title={i.label}>{i.label}</span>
            <span className="shrink-0 tabular-nums">
              {nf(i.count)} <span className="text-xs text-muted">({Math.round((i.count / total) * 100)} %)</span>
            </span>
          </div>
          <span className="mt-1 block h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${(i.count / max) * 100}%`, background: color }} />
          </span>
        </li>
      ))}
    </ul></ChartTooltip>
  );
  return <>
    {list(limit ? items.slice(0, limit) : items)}
    {limit && items.length > limit && <details className="group mt-4 border-t border-border pt-3">
      <summary className="cursor-pointer text-sm font-medium text-accent hover:text-foreground">
        <span className="group-open:hidden">Voir les {items.length - limit} autres résultats</span>
        <span className="hidden group-open:inline">Réduire la liste</span>
      </summary>
      <div className="mt-4">{list(items.slice(limit))}</div>
    </details>}
  </>;
}
