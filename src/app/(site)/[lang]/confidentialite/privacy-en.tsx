import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { FILES_RETENTION_MONTHS } from "@/lib/portal";
import { STATS_RETENTION_MONTHS } from "@/lib/stats";

// Traduction anglaise de la politique de confidentialité (même contenu que la version française).
const retention = [
  ["Contact or quote request", "3 years after our last exchange, if no order follows"],
  ["Order, brief and exchanges about your project", "3 years after the end of the project"],
  ["Invoices and accounting data", "10 years (legal obligation, article L123-22 of the French Commercial Code)"],
  ["Previews and delivered files (order space)", `${FILES_RETENTION_MONTHS} months after the project is closed, then deleted`],
  ["Server technical logs (IP address, pages requested)", "a few days, for site security"],
  ["Anonymous visit statistics", `${STATS_RETENTION_MONTHS} months, then deleted`],
];

const processors = [
  ["Heroku (Salesforce)", "website hosting", "European Union (Ireland)"],
  ["Supabase", "database (orders, briefs, settings)", "European Union (Germany)"],
  ["Amazon Web Services", "storage of portfolio images and delivered files", "European Union (France, Paris)"],
  ["Stripe", "online payment (I never see your bank details)", "European Union (Ireland)"],
  ["Abby", "invoicing", "France"],
  ["Resend", "sending the website's emails", "United States*"],
  ["Google (Gmail)", "business email", "United States*"],
];

export function PrivacyEn() {
  return (
    <>
      <PageHeader title="Privacy policy">
        Your data, what I do with it, and how long I keep it. English translation provided for convenience; the French version prevails.
      </PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Who is responsible for your data?</h2>
        <p>
          {legal.ownerName}, sole trader (micro-enterprise, {legal.commercialName}), {legal.address}. Contact:{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>

        <h2>What data, and why?</h2>
        <ul>
          <li>
            <strong>Contact form</strong>: name or nickname, email, link to your channel and what you tell me about your project. To answer
            your request and send you a quote, with your consent (checkbox).
          </li>
          <li>
            <strong>Order</strong>: name, email, billing address (and, for businesses, company name, SIRET, VAT number), chosen package and
            payments. To carry out and invoice your order (performance of the contract and accounting obligations).
          </li>
          <li>
            <strong>Brief and order space</strong>: information about your channel and universe, your approvals and change requests, the
            delivered files. To create and deliver your project.
          </li>
          <li>
            <strong>Payment</strong>: handled by Stripe on its own secure pages. I never receive your card number.
          </li>
          <li>
            <strong>Visit statistics</strong>: pages viewed, buttons clicked, the site you came from and device type (mobile or desktop).
            Anonymous measurement, done by the website itself, without cookies and without storing your IP address: a visitor is only
            recognised for one day, through an anonymous fingerprint that changes every day. To know which pages interest you and improve
            the site (legitimate interest).
          </li>
        </ul>
        <p>Your data is never sold, rented or used for advertising.</p>

        <h2>How long is it kept?</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Retention</th>
            </tr>
          </thead>
          <tbody>
            {retention.map(([what, how]) => (
              <tr key={what}>
                <td>{what}</td>
                <td>{how}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Who has access to it?</h2>
        <p>Only me, and the technical providers that run the website, each for their own task only:</p>
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Role</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {processors.map(([who, role, where]) => (
              <tr key={who}>
                <td>{who}</td>
                <td>{role}</td>
                <td>{where}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs">
          * Transfers outside the European Union are covered by the EU–US Data Privacy Framework and the European Commission&apos;s standard
          contractual clauses.
        </p>

        <h2>Cookies</h2>
        <p>
          This website sets no tracking cookies: audience measurement is anonymous and cookie-free, and there is no advertising or embedded
          social media. Only your language choice is remembered (cookie “zgfx_lang”, 1 year) if you use the FR / EN switch: it is a
          preference cookie, with no tracking. That is why there is no cookie banner. Payment takes place on Stripe&apos;s pages, which use
          their own cookies, required for payment security.
        </p>

        <h2>Security</h2>
        <p>
          Encrypted connection (HTTPS), order space accessible only through a private link, delivered files stored in a private space and
          served through temporary links, after your approval.
        </p>

        <h2>Your rights</h2>
        <p>
          You can at any time access your data, have it corrected or deleted, restrict its use, object to its processing, get it back in a
          readable format, or withdraw your consent. Write to me at <a href={`mailto:${site.email}`}>{site.email}</a>: I reply within one
          month. Invoices, however, must be kept for 10 years by law.
        </p>
        <p>
          If you believe your rights are not respected, you can file a complaint with the CNIL, the French data protection authority (
          <a href="https://www.cnil.fr/en/complaints" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          ).
        </p>

        <p className="mt-8 text-xs">
          See also the <Link href="/en/mentions-legales">legal notice</Link> and the <Link href="/en/cgv">terms of sale</Link>. Last updated:{" "}
          {legal.lastUpdate} (French version)
        </p>
      </article>
    </>
  );
}
