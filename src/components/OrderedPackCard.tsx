import { CardSection } from "@/components/PackCard";
import { t, type Locale } from "@/lib/i18n";
import { formatPrice, type Pack } from "@/lib/pricing";
import { trDeep, trOfferName } from "@/lib/translations-en";

export function OrderedPackCard({ pack: original, offerName, formulaId, totalPrice, hasLogo, locale, children, deliveryTemplate }: {
  pack?: Pack; offerName: string; formulaId: string; totalPrice: number; hasLogo: boolean; locale: Locale;
  children?: React.ReactNode;
  deliveryTemplate?: string[];
}) {
  const translated = original && trDeep(locale, original);
  const pack = translated && { ...translated, deliverables: translated.deliverables.map((line) => line.replace(/overlays fixes/gi, "overlays").replace(/static overlays/gi, "overlays")) };
  const formula = pack?.formulas?.find((f) => f.id === formulaId);
  const withOptions = formula && formula.id !== pack?.formulas?.[0]?.id;
  return (
    <section aria-labelledby="order-summary" className={`relative overflow-hidden rounded-2xl border p-6 ${pack?.highlight ? "border-accent bg-surface-2 shadow-[0_0_40px_-12px_var(--accent)]" : "border-border bg-surface"}`}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t(locale, { fr: "Ta commande", en: "Your order" })}</p>
      {!pack && deliveryTemplate?.length ? <>
        {/* À la carte : les produits commandés en titre (nom en gras, précision en dessous), puis le total */}
        <h2 id="order-summary" className="sr-only">{t(locale, { fr: "Produits commandés", en: "Ordered products" })}</h2>
        <ul className="space-y-3">{deliveryTemplate.map((line, index) => {
          const [name, ...detail] = trOfferName(locale, line).split(" — ");
          return <li key={index}><span className="block font-display text-base font-bold">{name}</span>{detail.length > 0 && <span className="mt-0.5 block text-sm text-muted">{detail.join(" — ")}</span>}</li>;
        })}</ul>
        <CardSection title={t(locale, { fr: "Total", en: "Total" })}><p className="font-display text-3xl font-bold">{formatPrice(totalPrice, locale)}</p></CardSection>
      </> : <>
        <h2 id="order-summary" className="font-display text-xl font-bold">{pack?.name ?? trOfferName(locale, offerName)}</h2>
        <p className="mt-2 font-display text-3xl font-bold">{formatPrice(totalPrice, locale)}</p>
        {pack && <p className="mt-3 text-sm leading-relaxed text-muted">{pack.tagline}</p>}
      </>}
      {pack && <CardSection title={t(locale, { fr: "Inclus", en: "Included" })}>
        <ul className="space-y-2.5 text-sm">{pack.deliverables.map((item) => (
          <li key={item} className="flex gap-2"><span aria-hidden className="text-accent-2">✓</span><span>{hasLogo && /^logo\b/i.test(item) ? t(locale, { fr: "Ton logo existant fourni", en: "Your existing logo supplied" }) : item}</span></li>
        ))}</ul>
      </CardSection>}
      {withOptions && <CardSection title={t(locale, { fr: "Options sélectionnées", en: "Selected add-ons" })}>
        <p className="flex gap-2 text-sm"><span aria-hidden className="text-accent-2">✓</span>{formula.label}</p>
      </CardSection>}
      {children && <CardSection title={t(locale, { fr: "Paiement", en: "Payment" })}>{children}</CardSection>}
    </section>
  );
}
