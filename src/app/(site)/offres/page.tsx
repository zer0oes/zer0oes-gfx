import type { Metadata } from "next";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { OfferPrice, PageHeader } from "@/components/ui";
import { legal } from "@/data/site";
import { activePacks, formatPrice, optionCategories, optionCategory, splitOptionName, type OptionCategory, type PricingSettings } from "@/lib/pricing";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Offres",
  description:
    "Premier look, Identité signature, Univers complet : logo, overlays, bannière, avatar et emotes sur mesure pour ta chaîne.",
};

// universPrice : prix de départ de l'Univers complet (base), pour ne jamais afficher un ancien tarif
const faq = (site: PricingSettings, universPrice?: number) => [
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
    a: `Elle est proposée${universPrice ? ` à partir de ${formatPrice(universPrice)} HT` : " sur devis"}, animations légères comprises. Demande un devis via la page contact : les animations complexes sont chiffrées selon ton projet. Un acompte de ${site.depositPercent} % est demandé à l'acceptation du devis.`,
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

// Couleur, dégradé et pictogramme de chaque catégorie d'options
const categoryLooks: Record<OptionCategory, { color: string; gradient: string; icon: React.ReactNode }> = {
  overlays: {
    color: "var(--accent-2)",
    gradient: "linear-gradient(135deg, var(--accent-2), var(--accent))",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
  },
  emotes: {
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
      </>
    ),
  },
  branding: {
    color: "var(--accent)",
    gradient: "linear-gradient(135deg, var(--accent), var(--accent-3))",
    icon: <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />,
  },
  motion: {
    color: "var(--accent-3)",
    gradient: "linear-gradient(135deg, var(--accent-3), var(--accent))",
    icon: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  },
};

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

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold">Les options à la carte</h2>
          <p className="mt-2 text-muted">
            Prix HT. Les emotes sont créées dans le style défini ensemble ; les illustrations complexes font l&apos;objet
            d&apos;un devis adapté.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {optionCategories.map((c) => {
              const list = options.filter((o) => optionCategory(o) === c.id);
              if (!list.length) return null;
              const look = categoryLooks[c.id];
              return (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 sm:p-6"
                  style={{ "--cat": look.color, background: "linear-gradient(160deg, color-mix(in srgb, var(--cat) 14%, var(--surface)), var(--surface) 55%)", borderColor: "color-mix(in srgb, var(--cat) 35%, var(--border))" } as React.CSSProperties}
                >
                  {/* Liseré et halo aux couleurs de la catégorie */}
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: look.gradient }} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full opacity-30 blur-3xl transition-opacity duration-300 group-hover:opacity-60"
                    style={{ background: look.gradient }}
                  />
                  <div className="relative flex items-center gap-3">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-background shadow-[0_0_24px_-6px_var(--cat)]"
                      style={{ background: look.gradient }}
                    >
                      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {look.icon}
                      </svg>
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">{c.label}</h3>
                      <p className="text-xs text-muted">{c.hint}</p>
                    </div>
                  </div>
                  <ul className="relative mt-5 divide-y divide-border/70">
                    {list.map((o) => (
                      <li key={o.id} className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2.5 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--cat)_10%,transparent)]">
                        <span className="flex items-start gap-2.5">
                          <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: "var(--cat)" }} />
                          <span>
                            {splitOptionName(o.name).main}
                            {splitOptionName(o.name).detail && (
                              <span className="block text-xs text-muted">{splitOptionName(o.name).detail}</span>
                            )}
                          </span>
                        </span>
                        <span
                          className="shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-right font-semibold"
                          style={{ borderColor: "color-mix(in srgb, var(--cat) 45%, transparent)", background: "color-mix(in srgb, var(--cat) 12%, transparent)" }}
                        >
                          <OfferPrice item={o} />
                        </span>
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

        <section className="mt-20">
          <h2 className="font-display text-3xl font-bold">Questions fréquentes</h2>
          <div className="mt-6 divide-y divide-border rounded-2xl border border-border bg-surface">
            {faq(site, catalog.packs.find((p) => p.id === "univers-complet")?.price).map((f) => (
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
