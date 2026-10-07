import type { ReactNode } from "react";

export function OrderBriefPanel({ unread, defaultOpen, summary, children }: { unread: boolean; defaultOpen: boolean; summary: string; children: ReactNode }) {
  return <details open={defaultOpen} className="group/brief rounded-2xl border border-border bg-surface p-5 sm:p-6">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
      <span className="flex flex-wrap items-center gap-3"><span className="font-semibold">{summary}</span>{unread && <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">Modification du brief · Non consultée</span>}</span>
      <svg aria-hidden="true" data-icon="expand_more" viewBox="0 0 24 24" className="size-6 shrink-0 text-accent transition-transform group-open/brief:rotate-180" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg>
    </summary>
    <div className="mt-5 border-t border-border pt-4">{children}</div>
  </details>;
}
