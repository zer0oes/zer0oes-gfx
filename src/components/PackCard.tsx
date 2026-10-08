import Link from "next/link";
import { href, t, type Locale } from "@/lib/i18n";
import { type Pack, type PricingSettings } from "@/lib/pricing";
import { glossaryFor } from "@/lib/glossary";
import { trDeep } from "@/lib/translations-en";
import { Hint } from "./Hint";
import { OfferPrice, SaleBadge, discountPercent } from "./ui";
import { OrderForm } from "./OrderForm";

// Titre de sous-section d'une carte (Inclus, Formule, Paiement…), séparé par un trait franc
export function CardSection({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`mt-6 relative before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border pt-5 ${className}`}>
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
  openOptions = false,
  locale = "fr",
}: {
  pack: Pack;
  settings: PricingSettings;
  order?: boolean;
  openOptions?: boolean;
  // Version courte (accueil) : prix, bénéfice, trois livrables et bouton
  compact?: boolean;
  locale?: Locale;
}) {
  // Textes de l'offre dans la langue de la page
  const translated = trDeep(locale, original);
  const pack = { ...translated, deliverables: translated.deliverables.map((line) => line.replace(/overlays fixes/gi, "overlays").replace(/static overlays/gi, "overlays")) };
  const to = (path: string) => href(locale, path);
  const quote = !pack.checkout;
  const buttonClass = `w-full rounded-full px-5 py-3 text-center font-semibold transition hover:brightness-110 ${
    pack.highlight || quote ? "bg-accent text-background" : "bg-foreground text-background"
  }`;
  // Détails des ajouts, visibles en complément du sélecteur de formule.
  // Ancien contenu du catalogue : ces scènes font déjà partie des cinq overlays inclus.
  const extras = pack.id === "univers-complet"
    ? pack.extras?.filter((extra) => ![
        "Scènes animées : démarrage, pause, discussion, fin de live",
        "Animated scenes: starting, break, just chatting, ending",
      ].includes(extra.trim()))
    : pack.extras;
  const showExtras = !compact && extras?.length;

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
      <SaleBadge item={pack} locale={locale} className="absolute right-4 top-4" />
      <div className={`flex flex-wrap items-center gap-2 ${discountPercent(pack) ? "pr-20" : ""}`}>
        <h3 className="font-display text-xl font-bold">{pack.name}</h3>
        {quote && (
          <span className="rounded-full border border-accent-3/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-3">
            {t(locale, { fr: "Sur devis", en: "Quote" })}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">
        <OfferPrice item={pack} stacked={!compact} locale={locale} />
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{pack.tagline}</p>

      {compact ? (
        <ul className="mt-4 space-y-1.5 text-sm">
          {pack.deliverables.slice(0, 3).map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-accent-2" aria-hidden>✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
      <CardSection title={t(locale, { fr: "Inclus", en: "Included" })}>
        <ul className="space-y-2.5 text-sm">
          {pack.deliverables.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-accent-2" aria-hidden>
                ✓
              </span>
              <span>
                {f}
                <Hint hint={glossaryFor(f, locale)} />
              </span>
            </li>
          ))}
        </ul>
      </CardSection>
      )}

      {showExtras ? (
        <CardSection
          title={
            quote
              ? t(locale, { fr: "Ajouts sur devis", en: "Quoted add-ons" })
              : extras!.length > 1
                ? t(locale, { fr: "Options", en: "Add-ons" })
                : t(locale, { fr: "Option", en: "Add-on" })
          }
        >
          <ul className={`space-y-2 text-sm ${quote ? "" : "text-muted"}`}>
            {extras!.map((e) => (
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
      {!compact && (pack.id === "premier-look" || pack.id === "identite-signature") && <p className="mt-4 text-xs text-muted">{t(locale, { fr: pack.formulas?.some((f) => f.id === "emotes-animations") ? "Overlays statiques inclus. Variante animée disponible dans la formule avec emotes et animations." : "Overlays statiques inclus.", en: pack.formulas?.some((f) => f.id === "emotes-animations") ? "Static overlays included. Animated variant available in the package with emotes and animations." : "Static overlays included." })}</p>}
      {order && <Link href={to(`/contact?offre=${pack.id}&sujet=offre`)} className="mt-4 text-sm text-accent underline underline-offset-4">{t(locale, { fr: "Poser une question sur ce pack", en: "Ask about this package" })}</Link>}
      {!compact && quote && <p className="mt-5 text-xs leading-relaxed text-muted">{t(locale, { fr: "Alertes, widgets et transition (stinger) ne sont pas inclus dans le tarif de base : ces ajouts sont chiffrés séparément sur le devis.", en: "Alerts, widgets and a stinger transition are not included in the base price: these add-ons are priced separately in your quote." })}</p>}
      {!compact && pack.note && <p className="mt-5 text-xs leading-relaxed text-muted">{pack.note}</p>}
      {!compact && <div className="flex-1" />}

      {!order ? (
        <div className={compact ? "mt-auto pt-4" : "mt-8"}>
          <Link
            href={to(`/offres?details=${encodeURIComponent(pack.id)}#offre-${pack.id}`)}
            className={`block rounded-full px-5 py-3 text-center font-semibold transition ${
              pack.highlight || quote ? "bg-accent text-background hover:brightness-110" : "border border-border hover:border-accent"
            }`}
          >
            {quote ? t(locale, { fr: "Découvrir l'offre", en: "Discover the package" }) : t(locale, { fr: "Voir le détail", en: "See details" })}
          </Link>
        </div>
      ) : pack.checkout ? (
        <OrderForm key={`${pack.id}-${openOptions}`} pack={pack} settings={settings} buttonClass={buttonClass} defaultOpen={openOptions} />
      ) : (
        <div className="mt-8 space-y-3">
          <p className="text-center text-xs leading-relaxed text-muted">{t(locale, { fr: `Généralement ${settings.deliveryDays} jours ouvrés après réception du brief complet, selon le projet.`, en: `Usually ${settings.deliveryDays.replace(" à ", " to ")} business days after receiving the complete brief, depending on the project.` })}</p>
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
