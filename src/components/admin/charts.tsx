// Graphiques du tableau de bord : SVG rendus côté serveur, chacun avec
// une description pour les lecteurs d'écran et un tableau des données.
import type { Declaration, SeriesPoint } from "@/lib/dashboard";
import { declarationStateLabels, formatDay, kindLabels } from "@/lib/dashboard";
import { formatPrice } from "@/lib/pricing";
import { ChartTooltip } from "./ChartTooltip";

export const colors = {
  acompte: "var(--accent)",
  solde: "var(--accent-2)",
  complet: "var(--accent-3)",
  remboursement: "#f59e0b",
  revenue: "var(--accent-2)",
  net: "var(--accent)",
};

// « 1,2 k€ », « 450 € »
export function shortPrice(cents: number) {
  const e = cents / 100;
  if (Math.abs(e) >= 1000) return `${(e / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k€`;
  return `${Math.round(e).toLocaleString("fr-FR")} €`;
}

const W = 720;
const H = 260;
const PAD = { top: 14, right: 14, bottom: 36, left: 74 };
const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

function niceMax(v: number) {
  if (v <= 0) return 10000;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

function Legend({ items }: { items: { label: string; color: string; line?: boolean }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-hidden="true">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span className={i.line ? "h-0.5 w-4" : "size-3 rounded-sm"} style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function Axes({ max, min, labels }: { max: number; min: number; labels: { x: number; text: string }[] }) {
  const y = (v: number) => PAD.top + ((max - v) / (max - min)) * innerH;
  const ticks = [max, max / 2, 0, ...(min < 0 ? [min] : [])];
  return (
    <g fontSize="15" fill="var(--muted)">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeDasharray={t === 0 ? undefined : "3 4"} />
          <text x={PAD.left - 10} y={y(t) + 5} textAnchor="end">
            {shortPrice(t)}
          </text>
        </g>
      ))}
      {labels.map((l) => (
        <text key={`${l.x}-${l.text}`} x={l.x} y={H - 10} textAnchor="middle">
          {l.text}
        </text>
      ))}
    </g>
  );
}

function xLabels(points: SeriesPoint[], x: (i: number) => number) {
  const every = Math.ceil(points.length / 12);
  return points.flatMap((p, i) => (i % every === 0 ? [{ x: x(i), text: p.axis }] : []));
}

function DataTable({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-muted hover:text-foreground">Voir les données</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              {head.map((h, i) => (
                <th key={h} scope="col" className={`px-2 py-1.5 font-medium ${i ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={String(r[0])}>
                {r.map((c, i) =>
                  i ? (
                    <td key={i} className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums">
                      {c}
                    </td>
                  ) : (
                    <th key={i} scope="row" className="whitespace-nowrap px-2 py-1.5 font-normal">
                      {c}
                    </th>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export function ChartCard({ id, title, description, children }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <h2 id={id} className="font-display text-lg font-bold">
        {title}
      </h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

// Encaissements par type de paiement (barres empilées), remboursements sous l'axe.
export function PaymentsChart({ points }: { points: SeriesPoint[] }) {
  const max = niceMax(Math.max(...points.map((p) => p.acompte + p.solde + p.complet)));
  const minRaw = Math.max(...points.map((p) => p.refunds));
  const min = minRaw > 0 ? -niceMax(minRaw) : 0;
  const y = (v: number) => PAD.top + ((max - v) / (max - min)) * innerH;
  const step = innerW / points.length;
  const x = (i: number) => PAD.left + step * i + step / 2;
  const bw = Math.max(2, Math.min(40, step * 0.7));
  const total = points.reduce((s, p) => s + p.revenue, 0);

  return (
    <>
      <ChartTooltip><svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Encaissements sur la période : ${formatPrice(total)} de chiffre d'affaires, remboursements déduits. Détail dans le tableau des données.`}>
        <Axes max={max} min={min} labels={xLabels(points, x)} />
        {points.map((p, i) => {
          let top = 0;
          const segs = (["complet", "acompte", "solde"] as const).map((k) => {
            const from = top;
            top += p[k];
            return { k, from, to: top };
          });
          return (
            <g key={p.key}>
              {segs
                .filter((s) => s.to > s.from)
                .map((s) => (
                  <rect key={s.k} x={x(i) - bw / 2} width={bw} y={y(s.to)} height={y(s.from) - y(s.to)} fill={colors[s.k]} tabIndex={0} aria-label={`${p.label} — ${kindLabels[s.k]} : ${formatPrice(p[s.k])}`} data-chart-label={`${p.label} · ${kindLabels[s.k]}`} data-chart-value={formatPrice(p[s.k])} data-chart-total={formatPrice(p.complet + p.acompte + p.solde)} data-chart-color={colors[s.k]} className="cursor-pointer outline-none focus:stroke-foreground focus:stroke-2" />
                ))}
              {p.refunds > 0 && (
                <rect x={x(i) - bw / 2} width={bw} y={y(0)} height={y(-p.refunds) - y(0)} fill={colors.remboursement} tabIndex={0} aria-label={`${p.label} — Remboursements : −${formatPrice(p.refunds)}`} data-chart-label={`${p.label} · Remboursements`} data-chart-value={`−${formatPrice(p.refunds)}`} data-chart-total={formatPrice(p.complet + p.acompte + p.solde)} data-chart-color={colors.remboursement} className="cursor-pointer outline-none focus:stroke-foreground focus:stroke-2" />
              )}
            </g>
          );
        })}
      </svg></ChartTooltip>
      <Legend
        items={[
          { label: kindLabels.complet, color: colors.complet },
          { label: kindLabels.acompte, color: colors.acompte },
          { label: kindLabels.solde, color: colors.solde },
          { label: kindLabels.remboursement, color: colors.remboursement },
        ]}
      />
      <DataTable
        caption="Encaissements par type de paiement"
        head={["Période", kindLabels.complet, kindLabels.acompte, kindLabels.solde, kindLabels.remboursement, "Chiffre d'affaires"]}
        rows={points.map((p) => [p.label, formatPrice(p.complet), formatPrice(p.acompte), formatPrice(p.solde), p.refunds ? `−${formatPrice(p.refunds)}` : "—", formatPrice(p.revenue)])}
      />
    </>
  );
}

// Chiffre d'affaires et net cumulés sur la période.
export function CumulativeChart({ points }: { points: SeriesPoint[] }) {
  const max = niceMax(Math.max(...points.map((p) => Math.max(p.cumulativeRevenue, p.cumulativeNet))));
  const minRaw = Math.min(0, ...points.map((p) => p.cumulativeNet));
  const min = minRaw < 0 ? -niceMax(-minRaw) : 0;
  const y = (v: number) => PAD.top + ((max - v) / (max - min)) * innerH;
  const x = (i: number) => (points.length === 1 ? PAD.left + innerW / 2 : PAD.left + (innerW * i) / (points.length - 1));
  const past = points.filter((p) => !p.future);
  const line = (k: "cumulativeRevenue" | "cumulativeNet") => past.map((p, i) => `${x(i)},${y(p[k])}`).join(" ");
  const last = past.at(-1);

  return (
    <>
      <ChartTooltip><svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Cumul sur la période : ${formatPrice(last?.cumulativeRevenue ?? 0)} de chiffre d'affaires, ${formatPrice(last?.cumulativeNet ?? 0)} de net. Détail dans le tableau des données.`}
      >
        <Axes max={max} min={min} labels={xLabels(points, x)} />
        {(["cumulativeRevenue", "cumulativeNet"] as const).map((k) => (
          <g key={k}>
            <polyline points={line(k)} fill="none" stroke={k === "cumulativeRevenue" ? colors.revenue : colors.net} strokeWidth="2.5" strokeLinejoin="round" />
            {points.length <= 31 &&
              past.map((p, i) => (
                <circle key={p.key} cx={x(i)} cy={y(p[k])} r="3" fill={k === "cumulativeRevenue" ? colors.revenue : colors.net} tabIndex={0} aria-label={`${p.label} : ${formatPrice(p[k])}`} data-chart-label={`${p.label} · ${k === "cumulativeRevenue" ? "CA" : "Net"}`} data-chart-value={formatPrice(p[k])} data-chart-color={k === "cumulativeRevenue" ? colors.revenue : colors.net} />
              ))}
          </g>
        ))}
      </svg></ChartTooltip>
      <Legend
        items={[
          { label: "Chiffre d'affaires cumulé", color: colors.revenue, line: true },
          { label: "Net cumulé (après frais et cotisations)", color: colors.net, line: true },
        ]}
      />
      <DataTable
        caption="Chiffre d'affaires et net cumulés"
        head={["Période", "CA", "Net", "CA cumulé", "Net cumulé"]}
        rows={past.map((p) => [p.label, formatPrice(p.revenue), formatPrice(p.net), formatPrice(p.cumulativeRevenue), formatPrice(p.cumulativeNet)])}
      />
    </>
  );
}

const stateStyles: Record<Declaration["state"], string> = {
  en_cours: "border-border text-muted",
  a_declarer: "border-amber-400/50 bg-amber-400/10 text-amber-200",
  echue: "border-border text-muted",
};

// Cotisations par période de déclaration URSSAF.
export function DeclarationsChart({ items }: { items: Declaration[] }) {
  const max = Math.max(1, ...items.map((d) => d.contributions));
  return (
    <ul className="space-y-5">
      {items.map((d) => (
        <li key={d.key}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium">{d.label}</span>
            <span className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full border px-2 py-0.5 ${stateStyles[d.state]}`}>{declarationStateLabels[d.state]}</span>
              <span className="text-muted">avant le {formatDay(d.deadline)}</span>
            </span>
          </div>
          <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${(d.contributions / max) * 100}%`, background: colors.acompte }} />
          </span>
          <p className="mt-1.5 text-sm tabular-nums">
            {formatPrice(d.contributions)} de cotisations <span className="text-muted">sur {formatPrice(d.revenue)} de chiffre d&apos;affaires</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// Chiffre d'affaires par offre.
export function OffersChart({ items }: { items: { offer: string; revenue: number }[] }) {
  const max = Math.max(1, ...items.map((o) => o.revenue));
  if (!items.length) return <p className="text-sm text-muted">Aucune vente sur la période.</p>;
  return (
    <ul className="space-y-3">
      {items.map((o) => (
        <li key={o.offer}>
          <div className="flex justify-between gap-4 text-sm">
            <span>{o.offer}</span>
            <span className="tabular-nums">{formatPrice(o.revenue)}</span>
          </div>
          <span className="mt-1 block h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${(Math.max(0, o.revenue) / max) * 100}%`, background: colors.complet }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
