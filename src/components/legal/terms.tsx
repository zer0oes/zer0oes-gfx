import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { ContentVariable } from "@/lib/editable-document";
import { formatPrice, type PricingSettings } from "@/lib/pricing";

export function CgvFr({ settings }: { settings: PricingSettings }) {
  return (
    <>
      <PageHeader title="Conditions générales de vente" />
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions régissent la vente des prestations de création graphique proposées sur le site{" "}
          <ContentVariable name="site.name" value={site.name} /> (logos, overlays de stream, bannières, avatars, emotes et autres éléments visuels pour créateurs de contenu), par <ContentVariable name="legal.ownerName" value={legal.ownerName} />,{" "}
          <ContentVariable name="legal.status" value={legal.status} /> (nom commercial <ContentVariable name="legal.commercialName" value={legal.commercialName} />), SIRET <ContentVariable name="legal.siret" value={legal.siret} />, <ContentVariable name="legal.address" value={legal.address} />.
        </p>

        <h2>2. Prestations</h2>
        <p>
          Trois offres sont proposées : « Premier look », « Identité signature » et « Univers complet ». Chacune
          correspond à une création réalisée sur mesure, selon l&apos;échange de cadrage et le brief transmis par le
          client après la commande. Les livrables de chaque offre sont décrits sur la page Offres au moment de la
          commande. Les offres « Premier look » et « Identité signature », dans la formule choisie, se commandent et se
          règlent directement en ligne. Les options à la carte à prix fixe se commandent en ligne et se règlent en une fois.
          L&apos;offre « Univers complet », les options dont le prix est indiqué « à partir de », les animations complexes, les illustrations complexes et les demandes hors offre font
          l&apos;objet d&apos;un devis préalable.
        </p>

        <h2>3. Prix et paiement</h2>
        <p>
          Les prix sont indiqués en euros, nets : le prestataire, entrepreneur individuel, bénéficie de la franchise en
          base de TVA (<ContentVariable name="legal.vatNote" value={legal.vatNote} />). Le paiement s&apos;effectue par carte
          bancaire via la plateforme sécurisée Stripe.
        </p>
        <ul>
          <li>
            Packs commandés en ligne : le client choisit, à la commande, de régler la totalité du prix ou un acompte
            de <ContentVariable name="settings.depositPercent" value={settings.depositPercent} /> % du prix de la formule choisie.
          </li>
          <li>
            En cas d&apos;acompte, le solde (<ContentVariable name="balancePercent" value={100 - settings.depositPercent} /> %) est dû à la livraison, avant la remise des
            fichiers définitifs. Il est réglé sur facture ou par un lien de paiement transmis au client.
          </li>
          <li>
            Prestations sur devis (dont l&apos;offre « Univers complet ») : un acompte de <ContentVariable name="settings.depositPercent" value={settings.depositPercent} /> % est
            demandé à l&apos;acceptation du devis ; le solde est dû dans les mêmes conditions.
          </li>
          <li>
            Remise « logo déjà existant » : lorsque le client fournit son propre logo, une remise de{" "}
            <ContentVariable name="logoDiscountEuros" value={settings.logoDiscount / 100} /> € est appliquée sur l&apos;offre « Premier look », et une remise de 250 € sur « Identité signature », et
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
            Le délai de livraison indicatif est de <ContentVariable name="settings.deliveryDays" value={settings.deliveryDays} /> jours ouvrés à compter de la réception d&apos;un
            brief complet.
          </li>
          <li>
            Chaque création à la carte inclut une seule modification. Chaque élément inclut deux corrections pour Premier look et Identité signature, et trois pour Univers complet. Les modifications du brief sont comptées séparément. Les modifications supplémentaires ou les
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
          adressant sa demande à <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>.
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
          modification en vue d&apos;une revente sont interdites. <ContentVariable name="legal.ownerName" value={legal.ownerName} /> conserve le droit de présenter les
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
          Toute réclamation doit d&apos;abord être adressée à <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>, afin
          de rechercher une solution amiable. À défaut d&apos;accord, le litige sera porté devant les tribunaux
          compétents.
        </p>

        <h2>9. Droit applicable</h2>
        <p>Les présentes CGV sont soumises au droit français.</p>

        <p className="mt-8 text-xs">Dernière mise à jour : <ContentVariable name="legal.lastUpdate" value={legal.lastUpdate} /></p>
      </article>
    </>
  );
}

export function CgvEn({ settings }: { settings: PricingSettings }) {
  return (
    <>
      <PageHeader title="Terms of sale">
        English translation provided for convenience. In case of discrepancy, the French version prevails.
      </PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>1. Purpose</h2>
        <p>
          These terms govern the sale of the graphic design services offered on the <ContentVariable name="site.name" value={site.name} /> website (logos, stream overlays,
          banners, avatars, emotes and other visual elements for content creators) by <ContentVariable name="legal.ownerName" value={legal.ownerName} />, sole trader under the French
          micro-enterprise scheme (trade name <ContentVariable name="legal.commercialName" value={legal.commercialName} />), SIRET <ContentVariable name="legal.siret" value={legal.siret} />, <ContentVariable name="legal.address" value={legal.address} />.
        </p>

        <h2>2. Services</h2>
        <p>
          Three packages are offered: “First Look”, “Signature Identity” and “Full Universe”. Each one is a custom creation, based on
          the scoping exchange and the brief sent by the customer after ordering. The deliverables of each package are described on the
          Pricing page at the time of ordering. The “First Look” and “Signature Identity” packages, in the chosen option, are ordered and
          paid for directly online. Fixed-price à la carte creations are ordered online and paid for in full.
          The “Full Universe” package, add-ons whose price is shown as “from”, complex animations,
          complex illustrations and requests outside the packages are subject to a prior quote.
        </p>

        <h2>3. Prices and payment</h2>
        <p>
          Prices are shown in euros and are net: the provider, a sole trader, benefits from the VAT exemption scheme (VAT not applicable,
          article 293 B of the French General Tax Code). Payment is made by card through the secure Stripe platform.
        </p>
        <ul>
          <li>
            Packages ordered online: when ordering, the customer chooses to pay the full price or a <ContentVariable name="settings.depositPercent" value={settings.depositPercent} />% deposit of
            the price of the chosen option.
          </li>
          <li>
            If a deposit is paid, the balance (<ContentVariable name="balancePercent" value={100 - settings.depositPercent} />%) is due on delivery, before the final files are handed over.
            It is paid by invoice or through a payment link sent to the customer.
          </li>
          <li>
            Quoted services (including the “Full Universe” package): a <ContentVariable name="settings.depositPercent" value={settings.depositPercent} />% deposit is required when the quote is
            accepted; the balance is due under the same conditions.
          </li>
          <li>
            “Existing logo” discount: when the customer supplies their own logo, a <ContentVariable name="logoDiscount" value={formatPrice(settings.logoDiscount, "en")} /> discount
            applies to “First Look”, and a €250 discount applies to “Signature Identity”; on quote for “Full Universe”. The logo must be supplied in
            good enough quality, ideally as a vector file; any retouching, rebuilding or redesign is quoted separately. The customer
            guarantees that they hold the rights to this logo.
          </li>
          <li>
            Subject to the right of withdrawal under the conditions of article 5, the deposit is not refundable once the creation has
            started, unless the provider fails to meet their obligations.
          </li>
        </ul>

        <h2>4. Process and timing</h2>
        <ul>
          <li>After payment, the customer sends their brief through the dedicated form.</li>
          <li>The indicative delivery time is <ContentVariable name="settings.deliveryDays" value={settings.deliveryDays.replace(" à ", " to ")} /> business days from receipt of a complete brief.</li>
          <li>
            Each à la carte creation includes one revision. Each item includes two corrections for Premier look and Identité signature, and three for Univers complet. Brief updates are counted separately. Additional changes or changes of direction after approval may be
            charged.
          </li>
          <li>
            Visuals are delivered ready to use, with transparent backgrounds where needed, via a download link. Setup in OBS is not
            included and can be quoted separately.
          </li>
        </ul>

        <h2>5. Right of withdrawal</h2>
        <p>
          A consumer customer has 14 days from the order to exercise their right of withdrawal, without giving any reason (articles L221-18
          et seq. of the French Consumer Code), by sending their request to <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>.
        </p>
        <p>
          By confirming their order, the customer expressly requests that the creation start before the end of this period. If they
          withdraw afterwards, they remain liable for an amount proportionate to the work already done (article L221-25). They can no longer
          exercise the right of withdrawal once the service has been fully performed before the end of the period, nor for digital content
          whose supply began with their express prior consent and express waiver of this right (article L221-28, 1° and 13°).
        </p>

        <h2>6. Usage rights</h2>
        <p>
          After full payment, the customer has a personal, non-exclusive right to use the delivered creations on their own channels and
          social media. Reselling, redistributing or modifying them for resale is prohibited. <ContentVariable name="legal.ownerName" value={legal.ownerName} /> keeps the right to show the
          creations in her portfolio, unless the customer asks otherwise.
        </p>

        <h2>7. Liability</h2>
        <p>
          The customer guarantees that they hold the rights to the elements they supply (logos, images, fonts). The provider cannot be held
          liable for misuse of the files or for incompatibility with third-party software.
        </p>

        <h2>8. Disputes</h2>
        <p>
          Any complaint must first be sent to <a href={`mailto:${site.email}`}><ContentVariable name="site.email" value={site.email} /></a>, in order to seek an amicable solution.
          Failing agreement, the dispute will be brought before the competent courts.
        </p>

        <h2>9. Governing law</h2>
        <p>These terms of sale are governed by French law.</p>

        <p className="mt-8 text-xs">Last updated: <ContentVariable name="legal.lastUpdate" value={legal.lastUpdate} /> (French version)</p>
      </article>
    </>
  );
}
