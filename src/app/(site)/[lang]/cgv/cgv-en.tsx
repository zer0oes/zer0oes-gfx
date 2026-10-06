import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { formatPrice, type PricingSettings } from "@/lib/pricing";

// Traduction anglaise des CGV, pour information : la version française fait foi.
export function CgvEn({ settings }: { settings: PricingSettings }) {
  return (
    <>
      <PageHeader title="Terms of sale">
        English translation provided for convenience. In case of discrepancy, the French version prevails.
      </PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>1. Purpose</h2>
        <p>
          These terms govern the sale of the graphic design services offered on the {site.name} website (logos, stream overlays,
          banners, avatars, emotes and other visual elements for content creators) by {legal.ownerName}, sole trader under the French
          micro-enterprise scheme (trade name {legal.commercialName}), SIRET {legal.siret}, {legal.address}.
        </p>

        <h2>2. Services</h2>
        <p>
          Three packages are offered: “First Look”, “Signature Identity” and “Full Universe”. Each one is a custom creation, based on
          the scoping exchange and the brief sent by the customer after ordering. The deliverables of each package are described on the
          Pricing page at the time of ordering. The “First Look” and “Signature Identity” packages, in the chosen option, are ordered and
          paid for directly online. The “Full Universe” package, whose price is shown as “from”, à la carte add-ons, complex animations,
          complex illustrations and requests outside the packages are subject to a prior quote.
        </p>

        <h2>3. Prices and payment</h2>
        <p>
          Prices are shown in euros and are net: the provider, a sole trader, benefits from the VAT exemption scheme (VAT not applicable,
          article 293 B of the French General Tax Code). Payment is made by card through the secure Stripe platform.
        </p>
        <ul>
          <li>
            Packages ordered online: when ordering, the customer chooses to pay the full price or a {settings.depositPercent}% deposit of
            the price of the chosen option.
          </li>
          <li>
            If a deposit is paid, the balance ({100 - settings.depositPercent}%) is due on delivery, before the final files are handed over.
            It is paid by invoice or through a payment link sent to the customer.
          </li>
          <li>
            Quoted services (including the “Full Universe” package): a {settings.depositPercent}% deposit is required when the quote is
            accepted; the balance is due under the same conditions.
          </li>
          <li>
            “Existing logo” discount: when the customer supplies their own logo, a {formatPrice(settings.logoDiscount, "en")} discount
            applies to the “First Look” and “Signature Identity” packages, and on quote for “Full Universe”. The logo must be supplied in
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
          <li>The indicative delivery time is {settings.deliveryDays.replace(" à ", " to ")} business days from receipt of a complete brief.</li>
          <li>
            Each package includes two grouped rounds of revisions. Additional changes or changes of direction after approval may be
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
          et seq. of the French Consumer Code), by sending their request to <a href={`mailto:${site.email}`}>{site.email}</a>.
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
          social media. Reselling, redistributing or modifying them for resale is prohibited. {legal.ownerName} keeps the right to show the
          creations in her portfolio, unless the customer asks otherwise.
        </p>

        <h2>7. Liability</h2>
        <p>
          The customer guarantees that they hold the rights to the elements they supply (logos, images, fonts). The provider cannot be held
          liable for misuse of the files or for incompatibility with third-party software.
        </p>

        <h2>8. Disputes</h2>
        <p>
          Any complaint must first be sent to <a href={`mailto:${site.email}`}>{site.email}</a>, in order to seek an amicable solution.
          Failing agreement, the dispute will be brought before the competent courts.
        </p>

        <h2>9. Governing law</h2>
        <p>These terms of sale are governed by French law.</p>

        <p className="mt-8 text-xs">Last updated: {legal.lastUpdate} (French version)</p>
      </article>
    </>
  );
}
