import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";

export const metadata: Metadata = { title: "Conditions générales de vente" };

// MODÈLE PROVISOIRE : à relire et adapter (idéalement par un professionnel du droit)
// avant la mise en ligne.
export default function CgvPage() {
  return (
    <>
      <PageHeader title="Conditions générales de vente" />
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions régissent la vente des prestations de création graphique proposées sur le site{" "}
          {site.name} (identité visuelle, logos, bannières, habillage de stream et éléments visuels pour créateurs de contenu), par {legal.ownerName},{" "}
          {legal.status}, SIRET {legal.siret}, {legal.address}.
        </p>

        <h2>2. Prestations</h2>
        <p>
          Trois offres sont proposées : « Premier look », « Identité signature » et « Univers complet ». Chacune
          correspond à une création réalisée sur mesure, selon l&apos;échange de cadrage et le brief transmis par le
          client après la commande. Les livrables de chaque offre sont décrits sur la page Offres au moment de la
          commande. Les offres « Premier look » et « Identité signature » se commandent et se règlent directement en ligne.
          L&apos;offre « Univers complet », dont le prix est indiqué « à partir de », ainsi que les options et les
          demandes hors offre, font l&apos;objet d&apos;un devis préalable.
        </p>

        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros hors taxes (HT). {legal.vatNote}. Pour les offres commandées en ligne, le
          paiement s&apos;effectue en totalité à la commande, par carte bancaire via la plateforme sécurisée Stripe.
          Pour les prestations sur devis, les modalités de paiement sont précisées dans le devis.
        </p>

        <h2>4. Déroulement et délais</h2>
        <ul>
          <li>Après le paiement, le client transmet son brief via le formulaire prévu à cet effet.</li>
          <li>
            Le délai de livraison indicatif est de {site.deliveryDays} jours ouvrés à compter de la réception d&apos;un
            brief complet.
          </li>
          <li>
            Chaque offre inclut deux séries de corrections. Les modifications supplémentaires ou les changements de
            direction après validation peuvent être facturés.
          </li>
          <li>Les fichiers finaux sont livrés par lien de téléchargement.</li>
        </ul>

        <h2>5. Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé
          pour les biens confectionnés selon les spécifications du consommateur ou nettement personnalisés, ni pour la
          fourniture d&apos;un contenu numérique dont l&apos;exécution a commencé avec l&apos;accord préalable exprès du
          consommateur, qui a renoncé à son droit de rétractation. En validant sa commande, le client demande le
          démarrage immédiat de la création et reconnaît perdre son droit de rétractation.
        </p>

        <h2>6. Droits d&apos;utilisation</h2>
        <p>
          Après paiement intégral, le client dispose d&apos;un droit d&apos;utilisation personnel et non exclusif des
          créations livrées, pour ses propres chaînes et réseaux sociaux. La revente, la redistribution ou la
          modification en vue d&apos;une revente sont interdites. {legal.ownerName} conserve le droit de présenter les
          créations dans son portfolio, sauf demande contraire du client.
        </p>

        <h2>7. Responsabilité</h2>
        <p>
          Le client garantit disposer des droits sur les éléments qu&apos;il fournit (logos, images, polices). Le
          prestataire ne saurait être tenu responsable d&apos;une mauvaise utilisation des fichiers ou d&apos;une
          incompatibilité avec un logiciel tiers.
        </p>

        <h2>8. Réclamations et médiation</h2>
        <p>
          Toute réclamation peut être adressée à <a href={`mailto:${site.email}`}>{site.email}</a>. En cas de litige,
          le client consommateur peut recourir gratuitement au médiateur de la consommation : {legal.mediator}.
        </p>

        <h2>9. Droit applicable</h2>
        <p>Les présentes CGV sont soumises au droit français.</p>

        <p className="mt-8 text-xs">Dernière mise à jour : {legal.lastUpdate}</p>
      </article>
    </>
  );
}
