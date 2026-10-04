import Link from "next/link";
import { formatOfferPrice, type Pack, type PricingSettings } from "@/lib/pricing";
import { OrderForm } from "./OrderForm";

// Titre de sous-section d'une carte (Inclus, Formule, Paiement…), séparé par un trait franc
export function CardSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`mt-6 border-t border-border pt-5 ${className}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{title}</p>
      {children}
    </div>
  );
}

export function PackCard({
  pack,
  settings,
  order = false,
  compact = false,
}: {
  pack: Pack;
  settings: PricingSettings;
  order?: boolean;
  // Version courte (accueil) : prix, promesse et livrables, sans options ni notes
  compact?: boolean;
}) {
  const quote = !pack.checkout;
  const buttonClass = `w-full rounded-full px-5 py-3 text-center font-semibold transition hover:brightness-110 ${
    pack.highlight || quote ? "bg-accent text-background" : "bg-foreground text-background"
  }`;
  // Les « options » d'une offre commandable décrivent ses formules : déjà visibles dans le choix de formule
  const showExtras = !compact && pack.extras?.length && (quote || (pack.formulas?.length ?? 0) <= 1);

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        pack.highlight
          ? "border-accent bg-surface-2 shadow-[0_0_40px_-12px_var(--accent)]"
          : quote
            ? "border-accent-3/50 bg-gradient-to-b from-surface-2 to-surface"
            : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-xl font-bold">{pack.name}</h3>
        {quote && (
          <span className="rounded-full border border-accent-3/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-3">Sur devis</span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{formatOfferPrice(pack)}</p>
      <p className={`mt-3 ${quote ? "text-base text-foreground" : "text-sm text-muted"}`}>{pack.tagline}</p>

      <CardSection title="Inclus">
        <ul className="space-y-2.5 text-sm">
          {pack.deliverables.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-accent-2" aria-hidden>
                ✓
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardSection>

      {showExtras ? (
        <CardSection title={quote ? "Par exemple" : pack.extras!.length > 1 ? "Options" : "Option"}>
          <ul className={`space-y-2 text-sm ${quote ? "" : "text-muted"}`}>
            {pack.extras!.map((e) => (
              <li key={e} className={quote ? "flex gap-2" : ""}>
                {quote && (
                  <span className="text-accent-3" aria-hidden>
                    ✦
                  </span>
                )}
                <span>{e.replace(/^Option : /, "")}</span>
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}
      {!compact && pack.note && <p className="mt-5 text-xs leading-relaxed text-muted">{pack.note}</p>}
      {!compact && <div className="flex-1" />}

      {!order ? (
        <Link
          href="/offres"
          className={`${compact ? "mt-auto pt-6" : "mt-8"} block rounded-full border border-border px-5 py-3 text-center font-semibold transition hover:border-accent`}
        >
          Voir le détail
        </Link>
      ) : pack.checkout ? (
        <OrderForm pack={pack} settings={settings} buttonClass={buttonClass} />
      ) : (
        <div className="mt-8 space-y-3">
          <Link href={`/contact?offre=${pack.id}`} className={`block ${buttonClass} shadow-[0_0_30px_-10px_var(--accent)]`}>
            Demander mon devis
          </Link>
          <Link href="/portfolio" className="block text-center text-sm text-muted hover:text-foreground">
            Voir des univers complets →
          </Link>
        </div>
      )}
    </div>
  );
}
