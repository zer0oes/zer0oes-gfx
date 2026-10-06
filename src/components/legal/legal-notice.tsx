import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { ContentVariable } from "@/lib/editable-document";

export function MentionsLegalesFr() {
  return (
    <>
      <PageHeader title="Mentions légales" />
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Éditeur du site</h2>
        <p>
          Le site <ContentVariable name="site.name" value={site.name} /> est édité par <ContentVariable name="legal.ownerName" value={legal.ownerName} />, <ContentVariable name="legal.status" value={legal.status} />.
          <br />
          Nom commercial : <ContentVariable name="legal.commercialName" value={legal.commercialName} />
          <br />
          SIREN : <ContentVariable name="legal.siren" value={legal.siren} /> — SIRET : <ContentVariable name="legal.siret" value={legal.siret} />
          <br />
          <ContentVariable name="legal.registration" value={legal.registration} />
          <br />
          Code APE : <ContentVariable name="legal.ape" value={legal.ape} />
          <br />
          N° de TVA intracommunautaire : <ContentVariable name="legal.vatNumber" value={legal.vatNumber} />
          <br />
          <ContentVariable name="legal.address" value={legal.address} />
          <br />
          Contact : <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>
          <br />
          <ContentVariable name="legal.vatNote" value={legal.vatNote} />
        </p>
        <p>Directrice de la publication : <ContentVariable name="legal.publicationDirector" value={legal.publicationDirector} /></p>

        <h2>Hébergement</h2>
        <p>
          <ContentVariable name="legal.host.name" value={legal.host.name} />
          <br />
          <ContentVariable name="legal.host.address" value={legal.host.address} />
          <br />
          Téléphone : <ContentVariable name="legal.host.phone" value={legal.host.phone} />
          <br />
          <a href={legal.host.website}><ContentVariable name="legal.host.website" value={legal.host.website} /></a>
          <br />
          Serveurs situés dans l&apos;Union européenne (Irlande).
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus de ce site (créations graphiques, textes, logos, animations) est la propriété
          de <ContentVariable name="legal.ownerName" value={legal.ownerName} />, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.
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

        <p className="mt-8 text-xs">Dernière mise à jour : <ContentVariable name="legal.lastUpdate" value={legal.lastUpdate} /></p>
      </article>
    </>
  );
}

export function LegalNoticeEn() {
  return (
    <>
      <PageHeader title="Legal notice">English translation provided for convenience; the French version prevails.</PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Website publisher</h2>
        <p>
          The <ContentVariable name="site.name" value={site.name} /> website is published by <ContentVariable name="legal.ownerName" value={legal.ownerName} />, sole trader under the French micro-enterprise scheme.
          <br />
          Trade name: <ContentVariable name="legal.commercialName" value={legal.commercialName} />
          <br />
          SIREN: <ContentVariable name="legal.siren" value={legal.siren} /> — SIRET: <ContentVariable name="legal.siret" value={legal.siret} />
          <br />
          Unregulated liberal activity, registered with the French National Business Register (RNE) since 3 April 2025
          <br />
          APE code: 7410Z — Specialised design activities
          <br />
          EU VAT number: <ContentVariable name="legal.vatNumber" value={legal.vatNumber} />
          <br />
          <ContentVariable name="legal.address" value={legal.address} />
          <br />
          Contact: <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>
          <br />
          VAT not applicable, article 293 B of the French General Tax Code
        </p>
        <p>Publication director: <ContentVariable name="legal.publicationDirector" value={legal.publicationDirector} /></p>

        <h2>Hosting</h2>
        <p>
          Heroku, a Salesforce, Inc. service
          <br />
          Salesforce Tower, 415 Mission Street, 3rd Floor, San Francisco, CA 94105, United States
          <br />
          Phone: <ContentVariable name="legal.host.phone" value={legal.host.phone} />
          <br />
          <a href={legal.host.website}><ContentVariable name="legal.host.website" value={legal.host.website} /></a>
          <br />
          Servers located in the European Union (Ireland).
        </p>

        <h2>Intellectual property</h2>
        <p>
          All content on this website (graphic creations, texts, logos, animations) is the property of <ContentVariable name="legal.ownerName" value={legal.ownerName} />, unless stated
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

        <p className="mt-8 text-xs">Last updated: <ContentVariable name="legal.lastUpdate" value={legal.lastUpdate} /> (French version)</p>
      </article>
    </>
  );
}
