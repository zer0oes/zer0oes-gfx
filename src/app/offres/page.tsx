import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { PageHeader } from "@/components/ui";
import { packs } from "@/data/packs";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Offres",
  description: "Packs Débutant, Confirmé et Full : overlays, alertes et widgets créés sur mesure pour votre stream.",
};

const faq = [
  {
    q: "Comment se passe la création après la commande ?",
    a: "Juste après le paiement, vous remplissez un court brief (univers, couleurs, références). Je vous envoie ensuite une première proposition, puis on ajuste ensemble selon le nombre de retours inclus dans votre pack.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: `Comptez ${site.deliveryDays} jours ouvrés après réception du brief complet, selon le pack choisi.`,
  },
  {
    q: "Sous quelle forme sont livrés les fichiers ?",
    a: "Fichiers PNG / WebM / MP4 prêts à importer dans OBS, Streamlabs ou StreamElements, avec un guide d'installation.",
  },
  {
    q: "Je ne trouve pas mon bonheur dans les packs.",
    a: "Pas de souci : décrivez votre projet via la page contact et je vous prépare un devis sur mesure.",
  },
];

export default async function OffresPage({ searchParams }: PageProps<"/offres">) {
  const { annule } = await searchParams;

  return (
    <>
      <PageHeader eyebrow="Offres" title="Choisissez votre pack">
        Chaque pack est une création sur mesure, réalisée pour votre chaîne après la commande.
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
          Paiement sécurisé par Stripe. Besoin d&apos;autre chose ?{" "}
          <Link href="/contact" className="text-accent hover:underline">Demandez un devis sur mesure</Link>.
        </p>

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
