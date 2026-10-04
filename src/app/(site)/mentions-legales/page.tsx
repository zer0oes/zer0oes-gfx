import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";

export const metadata: Metadata = { title: "Mentions légales" };

// Les informations proviennent de src/data/site.ts (objet `legal`).
export default function MentionsLegalesPage() {
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
        <p>Ce site ne dépose aucun cookie lors de ta visite : ni mesure d&apos;audience, ni publicité.</p>

        <p className="mt-8 text-xs">Dernière mise à jour : {legal.lastUpdate}</p>
      </article>
    </>
  );
}
