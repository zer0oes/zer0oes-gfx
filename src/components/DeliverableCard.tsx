import type { ReactNode } from "react";

export function DeliverableCard({ downloaded, className, summary, children }: { downloaded: boolean; className: string; summary: ReactNode; children: ReactNode }) {
  if (!downloaded) return <div className={className}>{summary}{children}</div>;
  return <details className={`group/file ${className}`}>
    <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden"><div className="min-w-0 flex-1">{summary}</div><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-accent transition-transform group-open/file:rotate-180" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg></summary>
    {children}
  </details>;
}
