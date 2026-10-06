import Link from "next/link";
import { href, t, type Locale } from "@/lib/i18n";
import { type Pack, type PricingSettings } from "@/lib/pricing";
import { trDeep } from "@/lib/translations-en";
import { OfferPrice } from "./ui";
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
  pack: original,
  settings,
  order = false,
  compact = false,
  locale = "fr",
}: {
  pack: Pack;
  settings: PricingSettings;
  order?: boolean;
  // Version courte (accueil) : prix, promesse et livrables, sans options ni notes
  compact?: boolean;
  locale?: Locale;
}) {
  // Textes de l'offre dans la langue de la page
  const pack = trDeep(locale, original);
  const to = (path: string) => href(locale, path);
  const quote = !pack.checkout;
  const buttonClass = `w-full rounded-full px-5 py-3 text-center font-semibold transition hover:brightness-110 ${
    pack.highlight || quote ? "bg-accent text-background" : "bg-foreground text-background"
  }`;
  // Détails des ajouts, visibles en complément du sélecteur de formule.
  const showExtras = !compact && pack.extras?.length;

  return (
    <div
      data-reveal
      id={order ? `offre-${pack.id}` : undefined}
      className={`relative flex scroll-mt-28 flex-col rounded-2xl border p-6 ${
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
          <span className="rounded-full border border-accent-3/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-3">
            {t(locale, { fr: "Sur devis", en: "Quote" })}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">
        <OfferPrice item={pack} stacked locale={locale} />
      </p>
      <p className={`mt-3 ${quote ? "text-base text-foreground" : "text-sm text-muted"}`}>{pack.tagline}</p>

      <CardSection title={t(locale, { fr: "Inclus", en: "Included" })}>
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
        <CardSection
          title={
            quote
              ? t(locale, { fr: "Par exemple", en: "For example" })
              : pack.extras!.length > 1
                ? t(locale, { fr: "Options", en: "Add-ons" })
                : t(locale, { fr: "Option", en: "Add-on" })
          }
        >
          <ul className={`space-y-2 text-sm ${quote ? "" : "text-muted"}`}>
            {pack.extras!.map((e) => (
              <li key={e} className={quote ? "flex gap-2" : ""}>
                {quote && (
                  <span className="text-accent-3" aria-hidden>
                    ✦
                  </span>
                )}
                <span>{e.replace(/^(Option : |Add-on: )/, "")}</span>
              </li>
            ))}
          </ul>
        </CardSection>
      ) : null}
      {order && <p className="mt-5 text-xs leading-relaxed text-muted">{t(locale, { fr: "Overlays au choix : démarrage, pause, fin, discussion ou gameplay. Visuels prêts à utiliser ; installation OBS sur devis séparé.", en: "Choose starting, break, ending, chatting or gameplay overlays. Ready-to-use visuals; OBS setup quoted separately." })}</p>}
      {order && <Link href={to(`/contact?offre=${pack.id}`)} className="mt-4 text-sm text-accent underline underline-offset-4">{t(locale, { fr: "Poser une question sur ce pack", en: "Ask about this package" })}</Link>}
      {!compact && pack.note && <p className="mt-5 text-xs leading-relaxed text-muted">{pack.note}</p>}
      {!compact && <div className="flex-1" />}

      {!order ? (
        <div className={compact ? "mt-auto pt-6" : "mt-8"}>
          <Link
            href={to(`/offres#offre-${pack.id}`)}
            className={`block rounded-full px-5 py-3 text-center font-semibold transition ${
              pack.highlight || quote ? "bg-accent text-background hover:brightness-110" : "border border-border hover:border-accent"
            }`}
          >
            {quote ? t(locale, { fr: "Découvrir l'offre", en: "Discover the package" }) : t(locale, { fr: "Voir le détail", en: "See details" })}
          </Link>
        </div>
      ) : pack.checkout ? (
        <OrderForm pack={pack} settings={settings} buttonClass={buttonClass} />
      ) : (
        <div className="mt-8 space-y-3">
          <Link href={to(`/contact?offre=${pack.id}`)} className={`block ${buttonClass} shadow-[0_0_30px_-10px_var(--accent)]`}>
            {t(locale, { fr: "Demander mon devis", en: "Request my quote" })}
          </Link>
          <Link href={to("/portfolio")} className="block text-center text-sm text-muted hover:text-foreground">
            {t(locale, { fr: "Voir des univers complets →", en: "See complete universes →" })}
          </Link>
        </div>
      )}
    </div>
  );
}
