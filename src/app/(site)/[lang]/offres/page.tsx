import type { Metadata } from "next";
import { OfferGuide } from "@/components/OfferGuide";
import { OfferTabs } from "@/components/OfferTabs";
import { OptionCatalog } from "@/components/OptionCatalog";
import { PackCard } from "@/components/PackCard";
import { PackComparison } from "@/components/PackComparison";
import { resolveHome } from "@/lib/home-content";
import { asLocale, t, type Locale } from "@/lib/i18n";
import {
  activePacks,
  formatPrice,
  type PricingSettings,
} from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { getPublicCatalog } from "@/lib/public-catalog";
import { trDeep } from "@/lib/translations-en";

export async function generateMetadata({ params }: PageProps<"/[lang]/offres">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/offres", {
    fr: {
      title: "Packs & à la carte",
      description: "Premier look, Identité signature, Univers complet : logo, overlays, bannière, avatar et emotes sur mesure pour ta chaîne.",
    },
    en: {
      title: "Packages & à la carte",
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
        a: "Right after payment, you fill in a short brief: universe, colours, references and the overlays you want (starting, break, ending, just chatting or gameplay). I then show you a first proposal that we refine together: each package item has its own included corrections.",
      },
      {
        q: "I already have a logo, is it cheaper?",
        a: `Yes: ${price(site.logoDiscount)} off First Look and ${price(25000)} off Signature Identity (tick “I already have my logo”), and on the quote for Full Universe. The logo must be supplied in good enough quality, ideally as a vector file; any retouching, rebuilding or redesign is quoted separately.`,
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
        a: "Emotes and overlay animation are chosen in the package options. Fixed-price à la carte creations can be ordered and paid for directly in full. Creations marked ‘from’ require a quote.",
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
      a: "Juste après le paiement, tu remplis un court brief : univers, couleurs, références et overlays souhaités (démarrage, pause, fin, discussion ou gameplay). Je te présente ensuite une première proposition que l'on ajuste ensemble : chaque élément du pack bénéficie de corrections incluses.",
    },
    {
      q: "J'ai déjà un logo, est-ce moins cher ?",
      a: `Oui : ${price(site.logoDiscount)} de réduction sur Premier look et ${price(25000)} sur Identité signature (case « J'ai déjà mon logo »), et sur devis pour Univers complet. Le logo doit être fourni en qualité suffisante, idéalement en format vectoriel ; toute retouche, reconstruction ou refonte est chiffrée séparément.`,
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
      a: "Les emotes et l'animation des overlays se choisissent dans les formules des offres. Les créations à la carte à prix fixe se commandent directement avec un paiement en une fois. Les tarifs « à partir de » nécessitent un devis.",
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

export default async function OffresPage({ params, searchParams }: PageProps<"/[lang]/offres">) {
  const lang = asLocale((await params).lang);
  const { annule, details, promo_erreur, prix_modifie } = await searchParams;
  const catalog = await getPublicCatalog();
  const { settings: site } = catalog;
  const packs = activePacks(catalog.packs);
  const texts = resolveHome(await getStore().getHomeContent(), lang);

  return (
    <>
      <header className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t(lang, { fr: "Packs & à la carte", en: "Packages & à la carte" })}</p>
        <h1 className="mt-3 text-center font-display text-4xl font-bold leading-[1.2] tracking-tight sm:text-5xl sm:leading-[1.2]">
          <span className="block">{texts.text("pricing.title")}</span>
          <span className="text-gradient block pb-[0.12em]">{texts.text("pricing.titleAccent")}</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {texts.text("pricing.intro")}
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {prix_modifie && <p role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">{lang === "fr" ? "Le prix a changé depuis l’ouverture de la page. Vérifie le nouveau montant avant de commander." : "The price has changed since you opened this page. Check the updated amount before ordering."}</p>}
        {promo_erreur && <p role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">{lang === "fr" ? "Ce code de réduction n’est plus disponible pour cette commande. Vérifie le code et réessaie." : "This discount code is no longer available for this order. Check your code and try again."}</p>}
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
        <PackComparison packs={packs} settings={site} locale={lang} />
        <section className="mt-12 text-center text-sm leading-relaxed text-muted" aria-labelledby="pack-value">
          <h2 id="pack-value" className="font-semibold text-foreground">{texts.text("pricing.explanationTitle")}</h2>
          <p className="mt-3 whitespace-pre-line">{texts.text("pricing.summary")}</p>
          <p className="mt-4 font-medium text-foreground">{t(lang, { fr: `Corrections incluses par élément · Fichiers prêts à utiliser · Acompte de ${site.depositPercent} % possible`, en: `Included corrections per item · Ready-to-use files · ${site.depositPercent}% deposit available` })}</p>
        </section>
        <OfferGuide locale={lang} />

        </>} options={
          <OptionCatalog settings={site} packs={packs.map((p) => trDeep(lang, p))} options={catalog.options.map((o) => trDeep(lang, o))} locale={lang} />
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
