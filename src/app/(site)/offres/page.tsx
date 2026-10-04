import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { PageHeader } from "@/components/ui";
import { legal } from "@/data/site";
import { activePacks, formatOfferPrice, formatPrice, optionCategories, optionCategory, type PricingSettings } from "@/lib/pricing";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Offres",
  description:
    "Premier look, Identité signature, Univers complet : logo, overlays, bannière, avatar et emotes sur mesure pour ta chaîne.",
};

const faq = (site: PricingSettings) => [
  {
    q: "Comment se passe la création après la commande ?",
    a: "Juste après le paiement, tu remplis un court brief : univers, couleurs, références et overlays souhaités (démarrage, pause, fin, discussion ou gameplay). Je te présente ensuite une première proposition que l'on ajuste ensemble : deux séries de corrections regroupées sont incluses.",
  },
  {
    q: "J'ai déjà un logo, est-ce moins cher ?",
    a: `Oui : ${formatPrice(site.logoDiscount)} HT de réduction sur Premier look et Identité signature (case « J'ai déjà mon logo »), et sur devis pour Univers complet. Le logo doit être fourni en qualité suffisante, idéalement en format vectoriel ; toute retouche, reconstruction ou refonte est chiffrée séparément.`,
  },
  {
    q: "Puis-je payer en plusieurs fois ?",
    a: `Oui : à la commande, tu peux régler la totalité ou un acompte de ${site.depositPercent} %. Le solde est à régler à la livraison, avant la remise des fichiers définitifs, sur facture ou par lien de paiement.`,
  },
  {
    q: "Comment commander l'offre Univers complet ?",
    a: `Elle est proposée à partir de 1 990 € HT, animations légères comprises. Demande un devis via la page contact : les animations complexes sont chiffrées selon ton projet. Un acompte de ${site.depositPercent} % est demandé à l'acceptation du devis.`,
  },
  {
    q: "Comment ajouter une option ?",
    a: "Les emotes et l'animation des overlays se choisissent directement dans les formules des offres. Les autres options à la carte se cochent dans ton brief après la commande, ou dans ta demande de devis ; je te confirme le montant avant de les réaliser.",
  },
  {
    q: "Quel est le délai de livraison ?",
    a: `Compte ${site.deliveryDays} jours ouvrés après réception du brief complet, selon l'offre choisie.`,
  },
  {
    q: "Sous quelle forme sont livrés les visuels ?",
    a: "Les visuels sont livrés prêts à utiliser, avec fond transparent lorsque nécessaire. L'installation dans OBS peut être chiffrée séparément.",
  },
  {
    q: "Aucune offre ne correspond à mon projet.",
    a: "Pas de souci : décris ton projet via la page contact et je te prépare un devis sur mesure.",
  },
];

export default async function OffresPage({ searchParams }: PageProps<"/offres">) {
  const { annule } = await searchParams;
  const catalog = await getStore().getCatalog();
  const { settings: site, options } = catalog;
  const packs = activePacks(catalog.packs);

  return (
    <>
      <PageHeader eyebrow="Offres" title="Les offres zeroes gfx">
        Compose ton pack selon tes besoins. Choisis tes overlays : démarrage, pause, fin, discussion ou gameplay.
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {annule && (
          <p role="status" className="mb-8 rounded-lg border border-border bg-surface px-4 py-3 text-center text-sm text-muted">
            Paiement annulé : aucun montant n&apos;a été débité. Tu peux reprendre ta commande quand tu veux.
          </p>
        )}
        <div className="grid gap-6 pt-3 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={site} order />
          ))}
        </div>
        <aside className="mt-6 flex flex-col gap-4 rounded-2xl border border-accent/50 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-display text-xl font-bold">Tu as déjà ton logo ?</h2>
            <p className="mt-1 text-sm">
              <strong>{formatPrice(site.logoDiscount)} HT de réduction</strong> sur Premier look et Identité signature : coche
              « J&apos;ai déjà mon logo » dans la formule. Pour Univers complet, la remise s&apos;applique sur le devis.
            </p>
            <p className="mt-2 text-xs text-muted">
              Logo fourni en qualité suffisante, idéalement vectoriel. Toute retouche, reconstruction ou refonte est
              chiffrée séparément.
            </p>
          </div>
          <span className="shrink-0 self-start rounded-full bg-accent px-4 py-2 font-display text-lg font-bold text-background sm:self-center">
            −{formatPrice(site.logoDiscount)} HT
          </span>
        </aside>

        <p className="mt-6 text-center text-sm text-muted">
          Prix en euros HT — {legal.vatNote}. Paiement sécurisé par Stripe, en une fois ou avec un acompte de{" "}
          {site.depositPercent} % (solde à la livraison). Besoin d&apos;autre chose ?{" "}
          <Link href="/contact" className="text-accent hover:underline">Demande un devis sur mesure</Link>.
        </p>

        <section className="mx-auto mt-20 max-w-5xl">
          <h2 className="font-display text-3xl font-bold">Les options à la carte</h2>
          <p className="mt-2 text-muted">
            Prix HT. Les emotes sont créées dans le style défini ensemble ; les illustrations complexes font l&apos;objet
            d&apos;un devis adapté.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {optionCategories.map((c) => {
              const list = options.filter((o) => optionCategory(o) === c.id);
              if (!list.length) return null;
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-surface p-5">
                  <h3 className="font-display text-lg font-bold">{c.label}</h3>
                  <p className="text-xs text-muted">{c.hint}</p>
                  <ul className="mt-4 space-y-3">
                    {list.map((o) => (
                      <li key={o.id} className="flex items-baseline justify-between gap-4 text-sm">
                        <span>{o.name}</span>
                        <span className="shrink-0 text-right font-semibold">{formatOfferPrice(o)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted">
            Livraison des visuels prêts à utiliser, avec fond transparent lorsque nécessaire. L&apos;installation dans
            OBS peut être chiffrée séparément. Les options se cochent dans ton brief après la commande, ou dans ta
            demande de devis.
          </p>
        </section>

        <section className="mx-auto mt-20 max-w-3xl">
          <h2 className="font-display text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq(site).map((f) => (
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
