"use client";

import { useId, useState, type ReactNode, type SyntheticEvent } from "react";

export function ChartTooltip({ children }: { children: ReactNode }) {
  const id = useId();
  const [tip, setTip] = useState<{ label: string; value: string; total?: string; color: string; x: number; y: number } | null>(null);
  function show(event: SyntheticEvent<HTMLDivElement>) {
    const target = event.target instanceof Element ? event.target.closest<SVGElement>("[data-chart-label]") : null;
    if (!target) { setTip(null); return; }
    const container = event.currentTarget.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    setTip({ label: target.dataset.chartLabel!, value: target.dataset.chartValue!, total: target.dataset.chartTotal, color: target.dataset.chartColor!,
      x: Math.max(0, Math.min(container.width - Math.min(240, container.width), box.left + box.width / 2 - container.left - 120)),
      y: Math.max(0, box.top - container.top - (target.dataset.chartTotal ? 120 : 86)) });
  }
  return <div className="relative" onPointerMove={show} onPointerLeave={() => setTip(null)} onFocus={show} onBlur={() => setTip(null)} onKeyDown={(event) => { if (event.key === "Escape") setTip(null); }}>
    {children}
    {tip && <div id={id} role="tooltip" className="pointer-events-none absolute z-20 w-60 max-w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground shadow-xl" style={{ left: tip.x, top: tip.y }}>
      <p className="text-xs text-muted">{tip.label}</p>
      <p className="mt-1 flex items-center gap-2 font-display font-semibold"><span className="size-2 shrink-0 rounded-full" style={{ background: tip.color }} />{tip.value}</p>
      {tip.total && <p className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2 text-xs"><span className="text-muted">Total encaissé</span><strong className="font-display text-sm tabular-nums">{tip.total}</strong></p>}
    </div>}
  </div>;
}
