import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { PageHeader } from "@/components/ui";
import { formatOfferPrice, options, packs } from "@/data/packs";
import { legal, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Offres",
  description: "Premier look, Identité signature, Univers complet : trois offres d'identité visuelle sur mesure pour créateurs de contenu.",
};

const faq = [
  {
    q: "Comment se passe la création après la commande ?",
    a: "Juste après le paiement, vous remplissez un court brief (univers, couleurs, références). On fait ensuite l'échange de cadrage, puis je vous présente une première proposition que l'on ajuste ensemble : deux séries de corrections sont incluses.",
  },
  {
    q: "Comment commander l'offre Univers complet ?",
    a: "Son prix dépend de votre activité : demandez un devis via la page contact, je vous réponds avec une proposition chiffrée.",
  },
  {
    q: "Comment ajouter une option ?",
    a: "Cochez les options souhaitées dans votre brief après la commande, ou dans votre demande de devis. Je vous confirme le montant avant de les réaliser.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: `Comptez ${site.deliveryDays} jours ouvrés après réception du brief complet, selon l'offre choisie.`,
  },
  {
    q: "Sous quelle forme sont livrés les fichiers ?",
    a: "Des fichiers prêts à l'emploi, aux formats adaptés à vos plateformes, livrés par lien de téléchargement. L'offre Identité signature inclut un mini-guide, et l'offre Univers complet une prise en main.",
  },
  {
    q: "Aucune offre ne correspond à mon projet.",
    a: "Pas de souci : décrivez votre projet via la page contact et je vous prépare un devis sur mesure.",
  },
];

export default async function OffresPage({ searchParams }: PageProps<"/offres">) {
  const { annule } = await searchParams;

  return (
    <>
      <PageHeader eyebrow="Offres" title="Choisissez votre offre">
        Chaque offre est une création sur mesure, réalisée pour vous après la commande.
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {annule && (
          <p role="status" className="mb-8 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-muted">
            Paiement annulé : aucun montant n&apos;a été débité. Vous pouvez reprendre votre commande quand vous voulez.
          </p>
        )}
        <div className="grid gap-6 pt-3 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} order />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          Prix en euros HT — {legal.vatNote}. Paiement sécurisé par Stripe. Besoin d&apos;autre chose ?{" "}
          <Link href="/contact" className="text-accent hover:underline">Demandez un devis sur mesure</Link>.
        </p>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Options</h2>
          <p className="mt-2 text-muted">
            À ajouter à n&apos;importe quelle offre : cochez-les dans votre brief après la commande, ou dans votre
            demande de devis.
          </p>
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {options.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 p-5">
                <span>{o.name}</span>
                <span className="shrink-0 font-semibold">{formatOfferPrice(o)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold">
                  <span className="mr-2 text-accent group-open:hidden">+</span>
                  <span className="mr-2 hidden text-accent group-open:inline">−</span>
                  {f.q}
                </summary>
                <p className="mt-3 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
