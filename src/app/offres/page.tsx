import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { PageHeader } from "@/components/ui";
import { formatOfferPrice, formatPrice, options, packs } from "@/data/packs";
import { legal, site } from "@/data/site";

export const metadata: Metadata = {
  title: "Offres",
  description:
    "Premier look, Identité signature, Univers complet : logo, overlays, bannière, avatar et emotes sur mesure pour ta chaîne.",
};

const faq = [
  {
    q: "Comment se passe la création après la commande ?",
    a: "Juste après le paiement, vous remplissez un court brief : univers, couleurs, références et overlays souhaités (démarrage, pause, fin, discussion ou gameplay). Je vous présente ensuite une première proposition que l'on ajuste ensemble : deux séries de corrections regroupées sont incluses.",
  },
  {
    q: "J'ai déjà un logo, est-ce moins cher ?",
    a: `Oui : ${formatPrice(site.logoDiscount)} HT de réduction sur Premier look et Identité signature (case « J'ai déjà mon logo »), et sur devis pour Univers complet. Le logo doit être fourni en qualité suffisante, idéalement en format vectoriel ; toute retouche, reconstruction ou refonte est chiffrée séparément.`,
  },
  {
    q: "Puis-je payer en plusieurs fois ?",
    a: `Oui : à la commande, vous pouvez régler la totalité ou un acompte de ${site.depositPercent} %. Le solde est à régler à la livraison, avant la remise des fichiers définitifs, sur facture ou par lien de paiement.`,
  },
  {
    q: "Comment commander l'offre Univers complet ?",
    a: `Elle est proposée à partir de 1 990 € HT, animations légères comprises. Demandez un devis via la page contact : les animations complexes sont chiffrées selon votre projet. Un acompte de ${site.depositPercent} % est demandé à l'acceptation du devis.`,
  },
  {
    q: "Comment ajouter une option ?",
    a: "Les emotes et l'animation des overlays se choisissent directement dans les formules des offres. Les autres options à la carte se cochent dans votre brief après la commande, ou dans votre demande de devis ; je vous confirme le montant avant de les réaliser.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: `Comptez ${site.deliveryDays} jours ouvrés après réception du brief complet, selon l'offre choisie.`,
  },
  {
    q: "Sous quelle forme sont livrés les visuels ?",
    a: "Les visuels sont livrés prêts à utiliser, avec fond transparent lorsque nécessaire. L'installation dans OBS peut être chiffrée séparément.",
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
      <PageHeader eyebrow="Offres" title="Les offres zeroes gfx">
        Compose ton pack selon tes besoins. Choisis tes overlays : démarrage, pause, fin, discussion ou gameplay.
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
          Prix en euros HT — {legal.vatNote}. Paiement sécurisé par Stripe, en une fois ou avec un acompte de{" "}
          {site.depositPercent} % (solde à la livraison). Besoin d&apos;autre chose ?{" "}
          <Link href="/contact" className="text-accent hover:underline">Demandez un devis sur mesure</Link>.
        </p>

        <aside className="mx-auto mt-16 max-w-3xl rounded-2xl border border-accent/50 bg-accent/10 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">Tu as déjà ton logo ?</h2>
          <p className="mt-3">
            Profite de <strong>{formatPrice(site.logoDiscount)} HT de réduction sur ton pack</strong>. Je construis ton
            habillage autour de ton identité existante.
          </p>
          <p className="mt-3 text-sm text-muted">
            Le logo doit être fourni en qualité suffisante, idéalement en format vectoriel. Toute retouche,
            reconstruction ou refonte éventuelle est chiffrée séparément.
          </p>
          <p className="mt-3 text-sm text-muted">
            Coche « J&apos;ai déjà mon logo » sur Premier look ou Identité signature. Pour Univers complet, la remise
            s&apos;applique sur le devis.
          </p>
        </aside>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Les options à la carte</h2>
          <p className="mt-2 text-muted">
            Prix HT. Les emotes sont créées dans le style défini ensemble ; les illustrations complexes font l&apos;objet
            d&apos;un devis adapté.
          </p>
          <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {options.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-4 p-5">
                <span>{o.name}</span>
                <span className="shrink-0 text-right font-semibold">{formatOfferPrice(o)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Livraison des visuels prêts à utiliser, avec fond transparent lorsque nécessaire. L&apos;installation dans
            OBS peut être chiffrée séparément. Les options se cochent dans votre brief après la commande, ou dans votre
            demande de devis.
          </p>
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
