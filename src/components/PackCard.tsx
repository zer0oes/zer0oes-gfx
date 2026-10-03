import Link from "next/link";
import { createCheckout } from "@/app/actions";
import { formatOfferPrice, type Pack } from "@/data/packs";

export function PackCard({ pack, order = false }: { pack: Pack; order?: boolean }) {
  const buttonClass = `w-full rounded-full px-5 py-3 text-center font-semibold transition hover:brightness-110 ${
    pack.highlight ? "bg-accent text-background" : "bg-foreground text-background"
  }`;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        pack.highlight ? "border-accent bg-surface-2 shadow-[0_0_40px_-12px_var(--accent)]" : "border-border bg-surface"
      }`}
    >
      <h3 className="font-display text-xl font-bold">{pack.name}</h3>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent">Pour qui</p>
      <p className="mt-1 text-sm text-muted">{pack.audience}</p>
      <p className="mt-6 font-display text-3xl font-bold">{formatOfferPrice(pack)}</p>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-accent">Livrables</p>
      <ul className="mt-3 space-y-3 text-sm">
        {pack.deliverables.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-accent-2" aria-hidden>✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Le bénéfice</p>
        <p className="mt-1 text-sm font-medium">{pack.benefit}</p>
      </div>

      {!order ? (
        <Link
          href="/offres"
          className="mt-8 rounded-full border border-border px-5 py-3 text-center font-semibold transition hover:border-accent"
        >
          Voir le détail
        </Link>
      ) : pack.checkout ? (
        <form action={createCheckout} className="mt-8 space-y-3">
          <input type="hidden" name="packId" value={pack.id} />
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
