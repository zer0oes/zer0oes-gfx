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
}: {
  options: { id: string; label: string; main?: string; detail?: string; price?: string }[];
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
            <input type="checkbox" name={name} value={o.label} className="mt-0.5 accent-[var(--accent)]" />
            {o.main ? (
              <span>
                {o.main} <span className="whitespace-nowrap text-muted">({o.price})</span>
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

// Prix d'une offre ou d'une option : seul le montant est en gras, « à partir de » et « HT » restent discrets
// stacked : « à partir de » sur sa propre ligne (gros prix des cartes de formules)
export function OfferPrice({ item, stacked }: { item: { price: number; priceFrom?: boolean; unit?: string }; stacked?: boolean }) {
  return (
    <>
      {item.priceFrom && <span className={`font-normal text-muted ${stacked ? "block font-sans text-sm" : "mr-1 text-[0.7em]"}`}>à partir de </span>}
      {formatPrice(item.price)}
      <span className="font-normal text-muted"> HT{item.unit ? ` / ${item.unit}` : ""}</span>
    </>
  );
}
