import type { ProjectContext as Context } from "@/lib/project-context";

// Encart « Le contexte » : la chaîne, les jeux ou contenus et le besoin, saisis dans l'admin
export function ProjectContext({ context }: { context: Context }) {
  if (!context.lines.length) return null;
  const short = context.lines.filter((c) => c.key !== "need");
  const need = context.lines.find((c) => c.key === "need");
  return (
    <section
      data-reveal
      aria-labelledby="contexte"
      className="mt-10 grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-10"
    >
      <div>
        <h2 id="contexte" className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {context.title}
        </h2>
        {short.length > 0 && (
          <dl className="mt-4 space-y-4">
            {short.map((c) => (
              <div key={c.key}>
                <dt className="text-xs text-muted">{c.label}</dt>
                <dd className="mt-0.5 font-medium">{c.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      {need && (
        <div className="md:border-l md:border-border md:pl-10">
          <p className="text-xs text-muted">{need.label}</p>
          <p className="mt-2 whitespace-pre-line text-lg leading-relaxed">{need.value}</p>
        </div>
      )}
    </section>
  );
}
