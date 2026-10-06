import type { Metadata } from "next";
import { OfferGuide } from "@/components/OfferGuide";
import { PackCard } from "@/components/PackCard";
import { OfferPrice, PageHeader } from "@/components/ui";
import { legal } from "@/data/site";
import { asLocale, t, type Locale } from "@/lib/i18n";
import {
  activePacks,
  formatPrice,
  optionCategories,
  optionCategory,
  splitOptionName,
  type OptionCategory,
  type PricingSettings,
} from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { tr } from "@/lib/translations-en";

export async function generateMetadata({ params }: PageProps<"/[lang]/offres">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/offres", {
    fr: {
      title: "Offres",
      description: "Premier look, Identité signature, Univers complet : logo, overlays, bannière, avatar et emotes sur mesure pour ta chaîne.",
    },
    en: {
      title: "Pricing",
      description: "First Look, Signature Identity, Full Universe: custom logo, overlays, banner, avatar and emotes for your channel.",
    },
  });
}

// universPrice : prix de départ de l'Univers complet (base), pour ne jamais afficher un ancien tarif
const faq = (locale: Locale, site: PricingSettings, universPrice?: number) => {
  const price = (cents: number) => formatPrice(cents, locale);
  if (locale === "en") {
    return [
      {
        q: "How does the creation work after I order?",
        a: "Right after payment, you fill in a short brief: universe, colours, references and the overlays you want (starting, break, ending, just chatting or gameplay). I then show you a first proposal that we refine together: two grouped rounds of revisions are included.",
      },
      {
        q: "I already have a logo, is it cheaper?",
        a: `Yes: ${price(site.logoDiscount)} off First Look and Signature Identity (tick “I already have my logo”), and on the quote for Full Universe. The logo must be supplied in good enough quality, ideally as a vector file; any retouching, rebuilding or redesign is quoted separately.`,
      },
      {
        q: "Can I pay in instalments?",
        a: `Yes: when ordering, you can pay in full or pay a ${site.depositPercent}% deposit. The balance is due on delivery, before the final files are handed over, by invoice or payment link.`,
      },
      {
        q: "How do I order the Full Universe package?",
        a: `It is offered${universPrice ? ` from ${price(universPrice)}` : " on quote"}, light animations included. Request a quote through the contact page: complex animations are priced according to your project. A ${site.depositPercent}% deposit is required when you accept the quote.`,
      },
      {
        q: "How do I add an add-on?",
        a: "Emotes and overlay animation are chosen directly in the package options. Other à la carte add-ons are ticked in your brief after ordering, or in your quote request; I confirm the amount before making them.",
      },
      {
        q: "How long does delivery take?",
        a: `Allow ${site.deliveryDays.replace(" à ", " to ")} business days after receiving the complete brief, depending on the package.`,
      },
      {
        q: "In what format are the visuals delivered?",
        a: "Visuals are delivered ready to use, with transparent backgrounds where needed. Setup in OBS can be quoted separately.",
      },
      {
        q: "None of the packages fits my project.",
        a: "No problem: describe your project on the contact page and I'll prepare a custom quote.",
      },
    ];
  }
  return [
    {
      q: "Comment se passe la création après la commande ?",
      a: "Juste après le paiement, tu remplis un court brief : univers, couleurs, références et overlays souhaités (démarrage, pause, fin, discussion ou gameplay). Je te présente ensuite une première proposition que l'on ajuste ensemble : deux séries de corrections regroupées sont incluses.",
    },
    {
      q: "J'ai déjà un logo, est-ce moins cher ?",
      a: `Oui : ${price(site.logoDiscount)} de réduction sur Premier look et Identité signature (case « J'ai déjà mon logo »), et sur devis pour Univers complet. Le logo doit être fourni en qualité suffisante, idéalement en format vectoriel ; toute retouche, reconstruction ou refonte est chiffrée séparément.`,
    },
    {
      q: "Puis-je payer en plusieurs fois ?",
      a: `Oui : à la commande, tu peux régler la totalité ou un acompte de ${site.depositPercent} %. Le solde est à régler à la livraison, avant la remise des fichiers définitifs, sur facture ou par lien de paiement.`,
    },
    {
      q: "Comment commander l'offre Univers complet ?",
      a: `Elle est proposée${universPrice ? ` à partir de ${price(universPrice)}` : " sur devis"}, animations légères comprises. Demande un devis via la page contact : les animations complexes sont chiffrées selon ton projet. Un acompte de ${site.depositPercent} % est demandé à l'acceptation du devis.`,
    },
    {
      q: "Comment ajouter une option ?",
      a: "Les emotes et l'animation des overlays se choisissent directement dans les formules des offres. Les autres options à la carte se cochent dans ton brief après la commande, ou dans ta demande de devis ; je te confirme le montant avant de les réaliser.",
    },
    {
      q: "Quel est le délai de livraison ?",
      a: `Compte ${site.deliveryDays} jours ouvrés après réception du brief complet, selon l'offre choisie.`,
    },
    {
      q: "Sous quelle forme sont livrés les visuels ?",
      a: "Les visuels sont livrés prêts à utiliser, avec fond transparent lorsque nécessaire. L'installation dans OBS peut être chiffrée séparément.",
    },
    {
      q: "Aucune offre ne correspond à mon projet.",
      a: "Pas de souci : décris ton projet via la page contact et je te prépare un devis sur mesure.",
    },
  ];
};

// Nom et sous-titre des catégories d'options en anglais
const categoryEn: Record<OptionCategory, { label: string; hint: string }> = {
  overlays: { label: "Overlays", hint: "Scenes and stream branding" },
  emotes: { label: "Emotes", hint: "For your chat and subscribers" },
  branding: { label: "Branding", hint: "Your channel across every platform" },
  motion: { label: "Motion", hint: "To bring your universe to life" },
};

// Couleur, dégradé et pictogramme de chaque catégorie d'options
const categoryLooks: Record<OptionCategory, { color: string; gradient: string; icon: React.ReactNode }> = {
  overlays: {
    color: "var(--accent-2)",
    gradient: "linear-gradient(135deg, var(--accent-2), var(--accent))",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
  emotes: {
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
      </>
    ),
  },
  branding: {
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-3))",
    icon: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
  },
  motion: {
    color: "var(--accent-3)",
    gradient: "linear-gradient(135deg, var(--accent-3), var(--accent))",
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  },
};

export default async function OffresPage({ params, searchParams }: PageProps<"/[lang]/offres">) {
  const lang = asLocale((await params).lang);
  const { annule, details } = await searchParams;
  const catalog = await getStore().getCatalog();
  const { settings: site, options } = catalog;
  const packs = activePacks(catalog.packs);

  return (
    <>
      <PageHeader eyebrow={t(lang, { fr: "Offres", en: "Pricing" })} title={t(lang, { fr: "Les offres zeroes gfx", en: "zeroes gfx packages" })}>
        {t(lang, {
          fr: "Compose ton pack selon tes besoins. Choisis tes overlays : démarrage, pause, fin, discussion ou gameplay.",
          en: "Build your package around your needs. Pick your overlays: starting, break, ending, just chatting or gameplay.",
        })}
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {annule && (
          <p role="status" className="mb-8 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-muted">
            {t(lang, {
              fr: "Paiement annulé : aucun montant n'a été débité. Tu peux reprendre ta commande quand tu veux.",
              en: "Payment cancelled: nothing was charged. You can resume your order whenever you like.",
            })}
          </p>
        )}
        <div className="grid gap-6 pt-3 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={site} order locale={lang} openOptions={details === p.id} />
          ))}
        </div>
        <OfferGuide locale={lang} />

        {lang === "en" ? (
          <p className="mt-6 text-center text-sm text-muted">
            Prices in euros — VAT not applicable, article 293 B of the French General Tax Code (sole trader exempt from VAT). Secure payment by Stripe, in
            full or with a {site.depositPercent}% deposit (balance on delivery).
          </p>
        ) : (
          <p className="mt-6 text-center text-sm text-muted">
            Prix en euros — {legal.vatNote} (entrepreneur individuel non soumis à la TVA). Paiement sécurisé par Stripe, en une fois ou avec un acompte de{" "}
            {site.depositPercent} % (solde à la livraison). Besoin d&apos;autre chose ?{" "}
          </p>
        )}

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold">{t(lang, { fr: "Les options à la carte", en: "À la carte add-ons" })}</h2>
          <p className="mt-2 text-muted">
            {t(lang, {
              fr: "Les emotes sont créées dans le style défini ensemble ; les illustrations complexes font l'objet d'un devis adapté.",
              en: "Emotes are created in the style we define together; complex illustrations are quoted individually.",
            })}
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {optionCategories.map((c) => {
              const list = options.filter((o) => optionCategory(o) === c.id);
              if (!list.length) return null;
              const look = categoryLooks[c.id];
              const label = lang === "en" ? categoryEn[c.id] : c;
              return (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 sm:p-6"
                  style={
                    {
                      "--cat": look.color,
                      background: "linear-gradient(160deg, color-mix(in srgb, var(--cat) 14%, var(--surface)), var(--surface) 55%)",
                      borderColor: "color-mix(in srgb, var(--cat) 35%, var(--border))",
                    } as React.CSSProperties
                  }
                >
                  {/* Liseré et halo aux couleurs de la catégorie */}
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: look.gradient }} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{ background: look.gradient }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-background shadow-[0_0_24px_-6px_var(--cat)]"
                      style={{ background: look.gradient }}
                    >
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {look.icon}
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">{label.label}</h3>
                      <p className="text-xs text-muted">{label.hint}</p>
                    </div>
                  </div>
                  <ul className="relative mt-5 divide-y divide-border/70">
                    {list.map((o) => {
                      const name = splitOptionName(tr(lang, o.name));
                      return (
                        <li
                          key={o.id}
                          className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--cat)_10%,transparent)]"
                        >
                          <span className="flex items-start gap-2.5">
                            <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: "var(--cat)" }} />
                            <span>
                              {name.main}
                              {name.detail && <span className="block text-xs text-muted">{name.detail}</span>}
                            </span>
                          </span>
                          <span
                            className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-right font-semibold"
                            style={{ borderColor: "color-mix(in srgb, var(--cat) 45%, transparent)", background: "color-mix(in srgb, var(--cat) 12%, transparent)" }}
                          >
                            <OfferPrice item={o} locale={lang} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            {t(lang, {
              fr: "Livraison des visuels prêts à utiliser, avec fond transparent lorsque nécessaire. L'installation dans OBS peut être chiffrée séparément. Les options se cochent dans ton brief après la commande, ou dans ta demande de devis.",
              en: "Visuals delivered ready to use, with transparent backgrounds where needed. Setup in OBS can be quoted separately. Add-ons are ticked in your brief after ordering, or in your quote request.",
            })}
          </p>
        </section>

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold">{t(lang, { fr: "Questions fréquentes", en: "FAQ" })}</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq(lang, site, catalog.packs.find((p) => p.id === "univers-complet")?.price).map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="mr-2 text-accent group-open:hidden">+</span>
                  <span className="mr-2 hidden text-accent group-open:inline">−</span>
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
