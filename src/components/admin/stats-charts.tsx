// Graphiques de la page Statistiques : SVG rendus côté serveur, avec description et tableau des données.
import { ChartTooltip } from "./ChartTooltip";
import type { Ranked, StatsPoint } from "@/lib/stats";

const W = 720;
const H = 240;
const PAD = { top: 14, right: 14, bottom: 36, left: 48 };
const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

function niceMax(v: number) {
  if (v <= 5) return 5;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const nf = (n: number) => n.toLocaleString("fr-FR");

// Pages vues (barres) et visiteurs (barres plus foncées devant), par jour ou par mois.
export function VisitsChart({ points }: { points: StatsPoint[] }) {
  const max = niceMax(Math.max(0, ...points.map((p) => p.views)));
  const y = (v: number) => PAD.top + ((max - v) / max) * innerH;
  const step = innerW / Math.max(1, points.length);
  const x = (i: number) => PAD.left + step * i + step / 2;
  const bw = Math.max(2, Math.min(36, step * 0.7));
  const every = Math.ceil(points.length / 12);
  const views = points.reduce((s, p) => s + p.views, 0);
  const visitors = points.reduce((s, p) => s + p.visitors, 0);

  return (
    <>
      <ChartTooltip><svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${nf(visitors)} visiteurs et ${nf(views)} pages vues sur la période. Détail dans le tableau des données.`}>
        <g fontSize="15" fill="var(--muted)">
          {[max, max / 2, 0].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "3 4"} />
              <text x={PAD.left - 10} y={y(t) + 5} textAnchor="end">
                {nf(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % every === 0 ? (
              <text key={p.key} x={x(i)} y={H - 10} textAnchor="middle">
                {p.axis}
              </text>
            ) : null,
          )}
        </g>
        {points.map((p, i) => (
          <g key={p.key}>
            {p.views > 0 && (
              <rect x={x(i) - bw / 2} width={bw} y={y(p.views)} height={y(0) - y(p.views)} rx="2" fill="var(--accent)" opacity="0.35" tabIndex={0} aria-label={`${p.label} : ${nf(p.views)} pages vues`} data-chart-label={p.label} data-chart-value={`${nf(p.views)} pages vues`} data-chart-color="var(--accent)" className="cursor-pointer focus:stroke-foreground focus:stroke-2" />
            )}
            {p.visitors > 0 && (
              <rect x={x(i) - bw / 4} width={bw / 2} y={y(p.visitors)} height={y(0) - y(p.visitors)} rx="2" fill="var(--accent)" tabIndex={0} aria-label={`${p.label} : ${nf(p.visitors)} visiteurs`} data-chart-label={p.label} data-chart-value={`${nf(p.visitors)} visiteurs`} data-chart-color="var(--accent)" className="cursor-pointer focus:stroke-foreground focus:stroke-2" />
            )}
          </g>
        ))}
      </svg></ChartTooltip>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-hidden="true">
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm" style={{ background: "var(--accent)" }} />
          Visiteurs
        </li>
        <li className="flex items-center gap-2">
          <span className="size-3 rounded-sm opacity-35" style={{ background: "var(--accent)" }} />
          Pages vues
        </li>
      </ul>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-foreground">Voir les données</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[360px] text-left">
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
                  <th scope="row" className="whitespace-nowrap px-2 py-1.5 font-normal">{p.label}</th>
                  <td className="px-2 py-1.5 text-right tabular-nums">{nf(p.visitors)}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{nf(p.views)}</td>
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
export function RankList({ items, empty, color = "var(--accent-2)" }: { items: Ranked[]; empty: string; color?: string }) {
  if (!items.length) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...items.map((i) => i.count));
  const total = items.reduce((s, i) => s + i.count, 0);
  return (
    <ChartTooltip><ul className="space-y-3">
      {items.map((i) => (
        <li key={i.label} tabIndex={0} data-chart-label={i.label} data-chart-value={`${nf(i.count)} (${Math.round((i.count / total) * 100)} %)`} data-chart-color={color} className="rounded-md outline-none focus-visible:ring-1 focus-visible:ring-accent">
          <div className="flex justify-between gap-4 text-sm">
            <span className="min-w-0 break-words">{i.label}</span>
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
}
