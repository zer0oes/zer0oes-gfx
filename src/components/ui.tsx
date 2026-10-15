import type { Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/pricing";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center sm:px-6">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 text-lg text-muted">{children}</div>}
    </header>
  );
}

export const inputClass =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted/60 focus:border-accent";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function OptionsField({
  options,
  name = "options",
  legend = "Options souhaitées",
  hint,
  selectedIds = [],
}: {
  options: { id: string; label: string; main?: string; detail?: string; price?: string }[];
  selectedIds?: string[];
  name?: string;
  legend?: string;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">{legend}</legend>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-muted">{hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <label key={o.id} className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <input type="checkbox" name={name} value={o.label} defaultChecked={selectedIds.includes(o.id)} className="mt-0.5 accent-[var(--accent)]" />
            {o.main ? (
              <span>
                {o.main} {o.price && <span className="whitespace-nowrap text-muted">({o.price})</span>}
                {o.detail && <span className="block text-xs text-muted">{o.detail}</span>}
              </span>
            ) : (
              <span>{o.label}</span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function FormStatus({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p
      role="status"
      className={`rounded-lg border px-4 py-3 text-sm ${
        state.ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      {state.message}
    </p>
  );
}

// Prix d'une offre ou d'une option : seul le montant est en gras, « à partir de » reste discret (prix nets, franchise de TVA)
// stacked : « à partir de » sur sa propre ligne (gros prix des cartes de formules)
export function discountPercent(item: { price: number; normalPrice?: number }) {
  return item.normalPrice && item.normalPrice > item.price
    ? Math.round((item.normalPrice - item.price) / item.normalPrice * 10_000) / 100
    : 0;
}

export function SaleBadge({ item, locale = "fr", upTo = false, compact = false, className = "" }: {
  item: { price: number; normalPrice?: number };
  locale?: Locale;
  upTo?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const percent = discountPercent(item);
  if (!percent) return null;
  const number = new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", { maximumFractionDigits: 2 }).format(percent);
  return <span aria-label={`${upTo ? locale === "fr" ? "Jusqu’à " : "Up to " : ""}−${number} %`} className={`z-10 inline-flex shrink-0 -rotate-6 rounded-xl bg-gradient-to-br from-accent-3/80 via-accent/70 to-accent-2/70 p-px font-display font-bold leading-none ${compact ? "h-8 min-w-11" : "h-12 min-w-19"} ${className}`}>
    <span aria-hidden className={`flex w-full flex-col items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,#2a1d37,#15131f_65%)] ${compact ? "px-1.5" : "px-2.5"}`}>
      {upTo && <span className="mb-1 text-[8px] font-medium text-accent">{locale === "fr" ? "Jusqu’à" : "Up to"}</span>}
      <span className={`text-gradient whitespace-nowrap tracking-tight ${number.length > 4 ? compact ? "text-[10px]" : "text-sm" : compact ? "text-xs" : "text-[23px]"}`}>−{number}<span className={compact ? "text-[9px]" : "text-sm"}>%</span></span>
    </span>
  </span>;
}

export function OfferPrice({
  item,
  stacked,
  locale = "fr",
}: {
  item: { price: number; normalPrice?: number; priceFrom?: boolean; unit?: string };
  stacked?: boolean;
  locale?: Locale;
}) {
  const unit = item.unit && locale === "en" && item.unit === "unité" ? "each" : item.unit;
  return (
    <>
      {item.priceFrom && (
        <span className={`font-normal text-muted ${stacked ? "block font-sans text-sm" : "mr-1 text-[0.7em]"}`}>{locale === "en" ? "from " : "à partir de "}</span>
      )}
      {item.normalPrice !== undefined && item.normalPrice > item.price && <><span className="sr-only">{locale === "fr" ? "Prix normal : " : "Regular price: "}</span><del className="mr-2 text-[0.6em] font-normal text-muted">{formatPrice(item.normalPrice, locale)}</del><span className="sr-only">{locale === "fr" ? "Prix promotionnel : " : "Sale price: "}</span></>}
      {formatPrice(item.price, locale)}
      {unit && <span className="font-normal text-muted"> / {unit}</span>}
    </>
  );
}
