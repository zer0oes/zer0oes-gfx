import { quoteBriefFields, defaultQuoteRequiredFields } from "@/lib/quote-brief";
import type { ProjectQuote } from "@/lib/quotes";
import { saveQuoteBriefRequirements } from "@/app/admin/devis-actions";

export function QuoteBriefRequirements({ quote }: { quote: ProjectQuote }) {
  return <details className="group/requirements mt-4 rounded-xl border border-border bg-background/40 p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden"><span className="text-sm font-semibold">Champs obligatoires du brief</span><span className="flex items-center gap-2 text-xs font-semibold text-accent">Configurer<svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="size-5 transition-transform group-open/requirements:rotate-180"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" /></svg></span></summary>
    <form action={saveQuoteBriefRequirements} className="mt-4 space-y-5 border-t border-border pt-4">
      <input type="hidden" name="id" value={quote.id} /><input type="hidden" name="updatedAt" value={quote.updatedAt} /><input type="hidden" name="backToOrder" value="1" />
      <p className="text-sm text-muted">Coche les champs à rendre obligatoires. Les autres sont facultatifs pour le client.</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{quoteBriefFields.map((field) => <label key={field.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"><input type="checkbox" name="requiredBrief" value={field.id} defaultChecked={(quote.requiredBriefFields ?? defaultQuoteRequiredFields).includes(field.id)} className="size-4 accent-[var(--accent)]" />{field.label}</label>)}</div>
      <input type="hidden" name="requiredDeliverablesMode" value="1" />
      <div className="space-y-3 border-t border-border pt-4"><h3 className="text-sm font-semibold">Descriptions des livrables obligatoires</h3><p className="text-xs text-muted">Coche les descriptions à rendre obligatoires.</p>
        {quote.deliverables.map((line, i) => <label key={i} className="flex items-center gap-3 text-sm"><input type="checkbox" name="requiredDeliverable" value={line} defaultChecked={!quote.optionalBriefDeliverables?.includes(line)} className="accent-[var(--accent)]" />{line}</label>)}
      </div>
      <div className="flex justify-end border-t border-border pt-4"><button className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background">Enregistrer les champs du brief</button></div>
    </form>
  </details>;
}
