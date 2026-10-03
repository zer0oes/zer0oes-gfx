import Link from "next/link";
import { createCheckout } from "@/app/actions";
import { formatOfferPrice, type Pack } from "@/data/packs";

export function PackCard({ pack, order = false }: { pack: Pack; order?: boolean }) {
  const buttonClass = `w-full rounded-full px-5 py-3 text-center font-semibold transition hover:brightness-110 ${
    pack.highlight ? "bg-accent text-background" : "bg-foreground text-background"
  }`;
  const formulas = pack.formulas ?? [];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        pack.highlight ? "border-accent bg-surface-2 shadow-[0_0_40px_-12px_var(--accent)]" : "border-border bg-surface"
      }`}
    >
      <h3 className="font-display text-xl font-bold">{pack.name}</h3>
      <p className="mt-2 font-display text-3xl font-bold">{formatOfferPrice(pack)}</p>
      <p className="mt-3 text-sm text-muted">{pack.tagline}</p>
      <ul className="mt-6 space-y-3 text-sm">
        {pack.deliverables.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-accent-2" aria-hidden>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {pack.extras && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {pack.extras.length > 1 ? "Options" : "Option"}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {pack.extras.map((e) => (
              <li key={e}>{e.replace(/^Option : /, "")}</li>
            ))}
          </ul>
        </div>
      )}
      {pack.note && <p className="mt-6 text-xs leading-relaxed text-muted">{pack.note}</p>}
      <div className="flex-1" />

      {!order ? (
        <Link
          href="/offres"
          className="mt-8 rounded-full border border-border px-5 py-3 text-center font-semibold transition hover:border-accent"
        >
          Voir le détail
        </Link>
      ) : pack.checkout ? (
        <form action={createCheckout} className="mt-8 space-y-4">
          <input type="hidden" name="packId" value={pack.id} />
          {formulas.length > 1 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">Formule</legend>
              {formulas.map((f, i) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm has-[:checked]:border-accent"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="formulaId"
                      value={f.id}
                      defaultChecked={i === 0}
                      className="accent-[var(--accent)]"
                    />
                    {f.label}
                  </span>
                  <span className="shrink-0 font-semibold">{formatOfferPrice(f)}</span>
                </label>
              ))}
            </fieldset>
          )}
          <label className="flex items-start gap-2 text-xs text-muted">
            <input type="checkbox" name="cgv" required className="mt-0.5 accent-[var(--accent)]" />
            <span>
              J&apos;accepte les <Link href="/cgv" className="underline hover:text-foreground">CGV</Link> et demande
              le démarrage de la création dès le paiement.
            </span>
          </label>
          <button type="submit" className={buttonClass}>
            Commander
          </button>
        </form>
      ) : (
        <div className="mt-8">
          <Link href={`/contact?offre=${pack.id}`} className={`block ${buttonClass}`}>
            Demander un devis
          </Link>
        </div>
      )}
    </div>
  );
}
