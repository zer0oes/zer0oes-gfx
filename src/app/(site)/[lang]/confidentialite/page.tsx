import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { legal, site } from "@/data/site";
import { FILES_RETENTION_MONTHS } from "@/lib/portal";
import { asLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { STATS_RETENTION_MONTHS } from "@/lib/stats";
import { PrivacyEn } from "./privacy-en";

export async function generateMetadata({ params }: PageProps<"/[lang]/confidentialite">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/confidentialite", {
    fr: {
      title: "Politique de confidentialité",
      description: "Quelles données sont collectées sur zer0oes gfx, pourquoi, combien de temps elles sont conservées et comment exercer tes droits.",
    },
    en: {
      title: "Privacy policy",
      description: "What data zer0oes gfx collects, why, how long it is kept and how to exercise your rights.",
    },
  });
}

// Durées de conservation : à garder alignées avec le fonctionnement réel du site
// (fichiers livrés : FILES_RETENTION_MONTHS dans src/lib/portal.ts, purge par npm run purge:livrables).
const retention = [
  ["Demande de contact ou de devis", "3 ans après notre dernier échange, si aucune commande ne suit"],
  ["Commande, brief et échanges sur ton projet", "3 ans après la fin du projet"],
  ["Factures et données comptables", "10 ans (obligation légale, art. L123-22 du Code de commerce)"],
  ["Aperçus et fichiers livrés (espace commande)", `${FILES_RETENTION_MONTHS} mois après la clôture du projet, puis supprimés`],
  ["Journaux techniques du serveur (adresse IP, pages appelées)", "quelques jours, pour la sécurité du site"],
  ["Statistiques de visite anonymes", `${STATS_RETENTION_MONTHS} mois, puis supprimées`],
];

const processors = [
  ["Heroku (Salesforce)", "hébergement du site", "Union européenne (Irlande)"],
  ["Supabase", "base de données (commandes, briefs, réglages)", "Union européenne (Allemagne)"],
  ["Amazon Web Services", "stockage des images du portfolio et des fichiers livrés", "Union européenne (France, Paris)"],
  ["Stripe", "paiement en ligne (je ne vois jamais tes données bancaires)", "Union européenne (Irlande)"],
  ["Abby", "facturation", "France"],
  ["Resend", "envoi des e-mails du site", "États-Unis*"],
  ["Google (Gmail)", "messagerie professionnelle", "États-Unis*"],
];

export default async function PrivacyPage({ params }: PageProps<"/[lang]/confidentialite">) {
  if (asLocale((await params).lang) === "en") return <PrivacyEn />;
  return (
    <>
      <PageHeader title="Politique de confidentialité">Tes données, ce que j&apos;en fais, et combien de temps je les garde.</PageHeader>
      <article className="prose-legal mx-auto max-w-3xl px-4 sm:px-6">
        <h2>Qui est responsable de tes données ?</h2>
        <p>
          {legal.ownerName}, {legal.status} ({legal.commercialName}), {legal.address}. Contact :{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>

        <h2>Quelles données, et pourquoi ?</h2>
        <ul>
          <li>
            <strong>Formulaire de contact</strong> : nom ou pseudo, e-mail, lien de ta chaîne et ce que tu me racontes de
            ton projet. Pour répondre à ta demande et te faire un devis, avec ton accord (case à cocher).
          </li>
          <li>
            <strong>Commande</strong> : nom, e-mail, adresse de facturation (et, pour les pros, raison sociale, SIRET,
            n° de TVA), formule choisie et paiements. Pour réaliser ta commande et la facturer (exécution du contrat et
            obligations comptables).
          </li>
          <li>
            <strong>Brief et espace commande</strong> : informations sur ta chaîne et ton univers, tes validations et
            demandes de modification, les fichiers livrés. Pour créer et te livrer ton projet.
          </li>
          <li>
            <strong>Paiement</strong> : traité par Stripe sur ses propres pages sécurisées. Je ne reçois jamais ton numéro
            de carte.
          </li>
          <li>
            <strong>Statistiques de visite</strong> : pages vues, boutons cliqués, site d&apos;où tu arrives et type
            d&apos;appareil (mobile ou ordinateur). Mesure anonyme, faite par le site lui-même, sans cookie et sans
            enregistrer ton adresse IP : un visiteur est reconnu seulement le temps d&apos;une journée, par une empreinte
            anonyme qui change chaque jour. Pour savoir quelles pages t&apos;intéressent et améliorer le site (intérêt
            légitime).
          </li>
        </ul>
        <p>Tes données ne sont ni vendues, ni louées, ni utilisées pour de la publicité.</p>

        <h2>Combien de temps sont-elles conservées ?</h2>
        <table>
          <thead>
            <tr>
              <th>Données</th>
              <th>Durée</th>
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

        <h2>Qui y a accès ?</h2>
        <p>
          Moi seule, et les prestataires techniques qui font fonctionner le site, chacun pour sa mission uniquement :
        </p>
        <table>
          <thead>
            <tr>
              <th>Prestataire</th>
              <th>Rôle</th>
              <th>Localisation</th>
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
          * Transferts hors de l&apos;Union européenne encadrés par le cadre de protection des données UE–États-Unis
          (Data Privacy Framework) et les clauses contractuelles types de la Commission européenne.
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site ne dépose aucun cookie de suivi : la mesure d&apos;audience est anonyme et sans cookie, et il n&apos;y a ni
          publicité, ni réseaux sociaux intégrés. Seul ton choix de langue est mémorisé (cookie « zgfx_lang », 1 an) si tu
          utilises le sélecteur FR / EN : c&apos;est un cookie de préférence, sans suivi. C&apos;est pour ça qu&apos;il n&apos;y a
          pas de bandeau cookies. Le paiement se fait sur
          les pages de Stripe, qui gère ses propres cookies, nécessaires à la sécurité du paiement.
        </p>

        <h2>Sécurité</h2>
        <p>
          Connexion chiffrée (HTTPS), espace commande accessible uniquement par un lien privé, fichiers livrés stockés
          dans un espace privé et servis par des liens temporaires, après ta validation.
        </p>

        <h2>Tes droits</h2>
        <p>
          Tu peux à tout moment accéder à tes données, les faire corriger ou supprimer, en limiter l&apos;usage, t&apos;opposer
          à leur traitement, les récupérer dans un format lisible, ou retirer ton accord. Écris-moi à{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a> : je te réponds sous un mois. Les factures, elles, doivent être
          conservées 10 ans par la loi.
        </p>
        <p>
          Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          ).
        </p>

        <p className="mt-8 text-xs">
          Voir aussi les <Link href="/mentions-legales">mentions légales</Link> et les <Link href="/cgv">CGV</Link>. Dernière
          mise à jour : {legal.lastUpdate}
        </p>
      </article>
    </>
  );
}
