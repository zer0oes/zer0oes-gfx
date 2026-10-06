import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { asLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[lang]/mentions-legales">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/mentions-legales", {
    fr: { title: "Mentions légales", description: "Mentions légales du site zer0oes gfx : éditeur, hébergement, propriété intellectuelle." },
    en: { title: "Legal notice", description: "Legal notice of the zer0oes gfx website: publisher, hosting, intellectual property." },
  });
}

// Les informations proviennent de src/data/site.ts (objet `legal`).
export default async function MentionsLegalesPage({ params }: PageProps<"/[lang]/mentions-legales">) {
  return asLocale((await params).lang) === "en" ? <LegalNoticeEn /> : <MentionsLegalesFr />;
}

function MentionsLegalesFr() {
  return (
    <>
      <PageHeader title="Mentions légales" />
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Éditeur du site</h2>
        <p>
          Le site {site.name} est édité par {legal.ownerName}, {legal.status}.
          <br />
          Nom commercial : {legal.commercialName}
          <br />
          SIREN : {legal.siren} — SIRET : {legal.siret}
          <br />
          {legal.registration}
          <br />
          Code APE : {legal.ape}
          <br />
          N° de TVA intracommunautaire : {legal.vatNumber}
          <br />
          {legal.address}
          <br />
          Contact : <a href={`mailto:${site.email}`}>{site.email}</a>
          <br />
          {legal.vatNote}
        </p>
        <p>Directrice de la publication : {legal.publicationDirector}</p>

        <h2>Hébergement</h2>
        <p>
          {legal.host.name}
          <br />
          {legal.host.address}
          <br />
          Téléphone : {legal.host.phone}
          <br />
          <a href={legal.host.website}>{legal.host.website}</a>
          <br />
          Serveurs situés dans l&apos;Union européenne (Irlande).
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus de ce site (créations graphiques, textes, logos, animations) est la propriété
          de {legal.ownerName}, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.
          Les réalisations présentées dans le portfolio sont reproduites avec l&apos;accord des créateurs concernés.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Les informations transmises via les formulaires de contact et de brief sont utilisées uniquement pour
          répondre à ta demande et réaliser ta commande. Elles ne sont ni vendues ni cédées à des tiers. Les
          paiements sont traités par Stripe ; aucune donnée bancaire n&apos;est stockée sur ce site. Le détail (données
          collectées, durées de conservation, prestataires, tes droits) est dans la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site ne dépose aucun cookie de suivi : ni mesure d&apos;audience par cookie, ni publicité. Seul ton choix de
          langue est mémorisé si tu utilises le sélecteur FR / EN.
        </p>

        <p className="mt-8 text-xs">Dernière mise à jour : {legal.lastUpdate}</p>
      </article>
    </>
  );
}

function LegalNoticeEn() {
  return (
    <>
      <PageHeader title="Legal notice">English translation provided for convenience; the French version prevails.</PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Website publisher</h2>
        <p>
          The {site.name} website is published by {legal.ownerName}, sole trader under the French micro-enterprise scheme.
          <br />
          Trade name: {legal.commercialName}
          <br />
          SIREN: {legal.siren} — SIRET: {legal.siret}
          <br />
          Unregulated liberal activity, registered with the French National Business Register (RNE) since 3 April 2025
          <br />
          APE code: 7410Z — Specialised design activities
          <br />
          EU VAT number: {legal.vatNumber}
          <br />
          {legal.address}
          <br />
          Contact: <a href={`mailto:${site.email}`}>{site.email}</a>
          <br />
          VAT not applicable, article 293 B of the French General Tax Code
        </p>
        <p>Publication director: {legal.publicationDirector}</p>

        <h2>Hosting</h2>
        <p>
          Heroku, a Salesforce, Inc. service
          <br />
          Salesforce Tower, 415 Mission Street, 3rd Floor, San Francisco, CA 94105, United States
          <br />
          Phone: {legal.host.phone}
          <br />
          <a href={legal.host.website}>{legal.host.website}</a>
          <br />
          Servers located in the European Union (Ireland).
        </p>

        <h2>Intellectual property</h2>
        <p>
          All content on this website (graphic creations, texts, logos, animations) is the property of {legal.ownerName}, unless stated
          otherwise. Any reproduction without prior permission is prohibited. The work shown in the portfolio is reproduced with the
          agreement of the creators concerned.
        </p>

        <h2>Personal data</h2>
        <p>
          The information sent through the contact and brief forms is used only to answer your request and carry out your order. It is
          never sold or passed on to third parties. Payments are handled by Stripe; no bank details are stored on this website. Details
          (data collected, retention periods, providers, your rights) are in the <Link href="/en/confidentialite">privacy policy</Link>.
        </p>

        <h2>Cookies</h2>
        <p>
          This website sets no tracking cookies: no cookie-based audience measurement, no advertising. Only your language choice is
          remembered if you use the FR / EN switch.
        </p>

        <p className="mt-8 text-xs">Last updated: {legal.lastUpdate} (French version)</p>
      </article>
    </>
  );
}
