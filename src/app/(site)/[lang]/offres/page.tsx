import type { Metadata } from "next";
import Link from "next/link";
import { OfferGuide } from "@/components/OfferGuide";
import { OfferTabs } from "@/components/OfferTabs";
import { OptionDisclosure } from "@/components/OptionDisclosure";
import { PackCard } from "@/components/PackCard";
import { OfferPrice } from "@/components/ui";
import { resolveHome } from "@/lib/home-content";
import { asLocale, href, t, type Locale } from "@/lib/i18n";
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
import { trDeep } from "@/lib/translations-en";

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
        q: "Is VAT added to the prices?",
        a: "No VAT is added to the displayed prices. VAT is not applicable under article 293 B of the French General Tax Code.",
      },
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
      q: "La TVA s’ajoute-t-elle aux prix affichés ?",
      a: "Aucune TVA ne s’ajoute aux prix affichés. TVA non applicable, article 293 B du Code général des impôts.",
    },
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
  motion: { label: "Animation", hint: "To bring your universe to life" },
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
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-3))",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
      </>
    ),
  },
  branding: {
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))",
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
  const { settings: site } = catalog;
  const packs = activePacks(catalog.packs);
  const texts = resolveHome(await getStore().getHomeContent(), lang);

  return (
    <>
      <header className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{texts.text("pricing.kicker")}</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          {texts.text("pricing.title")}{" "}
          <span className="text-gradient">{texts.text("pricing.titleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {texts.text("pricing.intro")}
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {annule && (
          <p role="status" className="mb-8 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-muted">
            {t(lang, {
              fr: "Paiement annulé : aucun montant n'a été débité. Tu peux reprendre ta commande quand tu veux.",
              en: "Payment cancelled: nothing was charged. You can resume your order whenever you like.",
            })}
          </p>
        )}
        <OfferTabs locale={lang} packs={<>
        <div className="grid gap-6 pt-3 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={site} order locale={lang} openOptions={details === p.id} />
          ))}
        </div>
        <section className="mt-8 text-center text-sm leading-relaxed text-muted" aria-labelledby="pack-value">
          <h2 id="pack-value" className="font-semibold text-foreground">{texts.text("pricing.explanationTitle")}</h2>
          <p className="mt-3 whitespace-pre-line">{texts.text("pricing.summary")}</p>
          <p className="mt-4 font-medium text-foreground">{t(lang, { fr: `2 séries de corrections · Fichiers prêts à utiliser · Acompte de ${site.depositPercent} % possible`, en: `2 rounds of revisions · Ready-to-use files · ${site.depositPercent}% deposit available` })}</p>
        </section>
        <OfferGuide locale={lang} />

        </>} options={
        <section>
          <p className="mb-6 text-center text-sm leading-relaxed text-muted">{texts.text("pricing.optionsIntro")}</p>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            {([["overlays", "emotes"], ["branding", "motion"]] as OptionCategory[][]).map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-5">
            {column.map((category) => optionCategories.find((c) => c.id === category)!).map((c) => {
              const list = catalog.options.filter((o) => optionCategory(o) === c.id).map((o) => trDeep(lang, o));
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
                  {(() => {
                    const renderOption = (o: (typeof list)[number]) => {
                      const name = splitOptionName(o.name);
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
                    };
                    if (c.id !== "emotes" && c.id !== "overlays") return <ul className="relative mt-5 divide-y divide-border/70">{list.map(renderOption)}</ul>;
                    const isAnimated = (o: (typeof list)[number]) => /anim/i.test(o.id) || /anim/i.test(o.name);
                    const grouped = c.id === "emotes" ? list : list.filter((o) => /overlay|alerte|alert/i.test(o.id) || /overlay|alerte|alert/i.test(o.name));
                    const other = list.filter((o) => !grouped.includes(o));
                    return (
                      <div className="relative mt-5 divide-y divide-border/70">
                        {[false, true].map((animated) => {
                          const items = grouped.filter((o) => isAnimated(o) === animated);
                          if (!items.length) return null;
                          return (
                            <OptionDisclosure key={String(animated)}
                              label={animated ? t(lang, { fr: c.id === "emotes" ? "Animées" : "Animés", en: "Animated" }) : t(lang, { fr: "Statiques", en: "Static" })}
                              price={
                                <span
                                  className="ml-auto shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-right font-semibold"
                                  style={{ borderColor: "color-mix(in srgb, var(--cat) 45%, transparent)", background: "color-mix(in srgb, var(--cat) 12%, transparent)" }}
                                >
                                  <span className="mr-1 text-[0.7em] font-normal text-muted">{t(lang, { fr: "dès", en: "from" })}</span>
                                  {formatPrice(Math.min(...items.map((o) => o.price)), lang)}
                                </span>
                              }>
                              <ul className="mt-3 divide-y divide-border/70">{items.map(renderOption)}</ul>
                            </OptionDisclosure>
                          );
                        })}
                        {other.length > 0 && <ul className="divide-y divide-border/70">{other.map(renderOption)}</ul>}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href={href(lang, "/contact")} className="inline-flex rounded-full bg-accent px-8 py-3 text-sm font-semibold text-background transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
              {t(lang, { fr: "Demander un devis à la carte", en: "Request an à la carte quote" })}
            </Link>
            <p className="mt-3 text-sm text-muted">
              {t(lang, { fr: "Indique les créations dont tu as besoin.", en: "Tell me which creations you need." })}
            </p>
          </div>
        </section>
        } />

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
