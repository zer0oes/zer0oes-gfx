import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Conditions générales de vente" };

// MODÈLE PROVISOIRE : à relire et adapter (idéalement par un professionnel du droit)
// avant la mise en ligne.
export default async function CgvPage() {
  const { settings } = await getStore().getCatalog();
  return (
    <>
      <PageHeader title="Conditions générales de vente" />
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions régissent la vente des prestations de création graphique proposées sur le site{" "}
          {site.name} (logos, overlays de stream, bannières, avatars, emotes et autres éléments visuels pour créateurs de contenu), par {legal.ownerName},{" "}
          {legal.status} (nom commercial {legal.commercialName}), SIRET {legal.siret}, {legal.address}.
        </p>

        <h2>2. Prestations</h2>
        <p>
          Trois offres sont proposées : « Premier look », « Identité signature » et « Univers complet ». Chacune
          correspond à une création réalisée sur mesure, selon l&apos;échange de cadrage et le brief transmis par le
          client après la commande. Les livrables de chaque offre sont décrits sur la page Offres au moment de la
          commande. Les offres « Premier look » et « Identité signature », dans la formule choisie, se commandent et se
          règlent directement en ligne. L&apos;offre « Univers complet », dont le prix est indiqué « à partir de », les
          options à la carte, les animations complexes, les illustrations complexes et les demandes hors offre font
          l&apos;objet d&apos;un devis préalable.
        </p>

        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros hors taxes (HT). {legal.vatNote}. Le paiement s&apos;effectue par carte
          bancaire via la plateforme sécurisée Stripe.
        </p>
        <ul>
          <li>
            Offres commandées en ligne : le client choisit, à la commande, de régler la totalité du prix ou un acompte
            de {settings.depositPercent} % du prix de la formule choisie.
          </li>
          <li>
            En cas d&apos;acompte, le solde ({100 - settings.depositPercent} %) est dû à la livraison, avant la remise des
            fichiers définitifs. Il est réglé sur facture ou par un lien de paiement transmis au client.
          </li>
          <li>
            Prestations sur devis (dont l&apos;offre « Univers complet ») : un acompte de {settings.depositPercent} % est
            demandé à l&apos;acceptation du devis ; le solde est dû dans les mêmes conditions.
          </li>
          <li>
            Remise « logo déjà existant » : lorsque le client fournit son propre logo, une remise de{" "}
            {settings.logoDiscount / 100} € HT est appliquée sur les offres « Premier look » et « Identité signature », et
            sur devis pour « Univers complet ». Le logo doit être fourni en qualité suffisante, idéalement en format
            vectoriel ; toute retouche, reconstruction ou refonte éventuelle est chiffrée séparément. Le client garantit
            détenir les droits sur ce logo.
          </li>
          <li>
            Sous réserve de l&apos;exercice du droit de rétractation dans les conditions de l&apos;article 5,
            l&apos;acompte n&apos;est pas remboursable une fois la création commencée, sauf manquement du prestataire
            à ses obligations.
          </li>
        </ul>

        <h2>4. Déroulement et délais</h2>
        <ul>
          <li>Après le paiement, le client transmet son brief via le formulaire prévu à cet effet.</li>
          <li>
            Le délai de livraison indicatif est de {settings.deliveryDays} jours ouvrés à compter de la réception d&apos;un
            brief complet.
          </li>
          <li>
            Chaque offre inclut deux séries de corrections regroupées. Les modifications supplémentaires ou les
            changements de direction après validation peuvent être facturés.
          </li>
          <li>
            Les visuels sont livrés prêts à utiliser, avec fond transparent lorsque nécessaire, par lien de
            téléchargement. L&apos;installation dans OBS n&apos;est pas incluse et peut être chiffrée séparément.
          </li>
        </ul>

        <h2>5. Droit de rétractation</h2>
        {/* Formulation prudente, à faire relire par un professionnel du droit. */}
        <p>
          Le client consommateur dispose d&apos;un délai de 14 jours à compter de la commande pour exercer son droit de
          rétractation, sans avoir à se justifier (articles L221-18 et suivants du Code de la consommation), en
          adressant sa demande à <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
        <p>
          En validant sa commande, le client demande expressément que la création commence avant la fin de ce délai.
          S&apos;il se rétracte ensuite, il reste redevable d&apos;un montant proportionnel au travail déjà réalisé
          (article L221-25). Il ne peut plus exercer son droit de rétractation lorsque la prestation a été pleinement
          exécutée avant la fin du délai, ni pour un contenu numérique dont la fourniture a commencé avec son accord
          préalable exprès et sa renonciation expresse à ce droit (article L221-28, 1° et 13°).
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

        <h2>8. Litiges</h2>
        <p>
          Toute réclamation doit d&apos;abord être adressée à <a href={`mailto:${site.email}`}>{site.email}</a>, afin
          de rechercher une solution amiable. À défaut d&apos;accord, le litige sera porté devant les tribunaux
          compétents.
        </p>

        <h2>9. Droit applicable</h2>
        <p>Les présentes CGV sont soumises au droit français.</p>

        <p className="mt-8 text-xs">Dernière mise à jour : {legal.lastUpdate}</p>
      </article>
    </>
  );
}
