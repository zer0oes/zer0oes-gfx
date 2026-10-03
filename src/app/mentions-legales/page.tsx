import type { Metadata } from "next";
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
          {site.name} — {legal.ownerName}
          <br />
          {legal.status}
          <br />
          SIRET : {legal.siret}
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
          <a href={legal.host.website}>{legal.host.website}</a>
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
          répondre à votre demande et réaliser votre commande. Elles ne sont ni vendues ni cédées à des tiers. Les
          paiements sont traités par Stripe ; aucune donnée bancaire n&apos;est stockée sur ce site.
        </p>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
          données en écrivant à <a href={`mailto:${site.email}`}>{site.email}</a>. Vous pouvez également introduire
          une réclamation auprès de la CNIL.
        </p>

        <h2>Cookies</h2>
        <p>Ce site n&apos;utilise pas de cookies publicitaires ni de mesure d&apos;audience.</p>

        <p className="mt-8 text-xs">Dernière mise à jour : {legal.lastUpdate}</p>
      </article>
    </>
  );
}
