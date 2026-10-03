export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center sm:px-6">
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      {children && <div className="mt-4 text-lg text-muted">{children}</div>}
    </div>
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
