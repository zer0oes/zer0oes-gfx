import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HoverVideo } from "@/components/HoverVideo";
import { ProtectedMedia } from "@/components/protection";
import { PageHeader } from "@/components/ui";
import { caseStudies } from "@/data/case-studies";
import { categories, projectHref, withoutDrafts } from "@/data/portfolio";
import { resolveHome } from "@/lib/home-content";
import { asLocale, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { featuredProjectId } from "@/lib/portfolio-featured";
import { portfolioCategoryColor, readCategories } from "@/lib/product-categories";
import { trDeep } from "@/lib/translations-en";

// Rendu à la demande : éviter de servir une page 404 précompilée sur Heroku.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[lang]/portfolio">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/portfolio", {
    fr: { title: "Portfolio", description: "Les projets réalisés pour des streameurs : overlays, widgets, alertes et emotes." },
    en: { title: "Portfolio", description: "Projects made for streamers: overlays, widgets, alerts and emotes." },
  });
}

// Libellés des compteurs en anglais (singulier, pluriel)
const countLabelsEn: Record<string, [string, string]> = {
  logo: ["logo", "logos"],
  overlays: ["overlay", "overlays"],
  widgets: ["widget", "widgets"],
  alertes: ["alert", "alerts"],
  emotes: ["emote", "emotes"],
  reseaux: ["social media", "social media"],
};

export default async function PortfolioPage({ params }: PageProps<"/[lang]/portfolio">) {
  const lang = asLocale((await params).lang);
  const store = getStore();
  const [portfolio, stored] = await Promise.all([store.getPortfolio(), store.getHomeContent()]);
  const { streamers: ordered, works } = trDeep(lang, withoutDrafts(portfolio));
  // Cartes images 4:5, texte posé sur l'image (toutes à la même hauteur). Projet mis en avant (Admin > Portfolio) :
  // en premier, sur deux colonnes à la même hauteur que les autres (image recadrée)
  const featured = featuredProjectId(stored);
  const streamers = [...ordered.filter((s) => s.id === featured), ...ordered.filter((s) => s.id !== featured)];
  const hasFeatured = streamers.length > 1 && streamers[0].id === featured;
  // Deux projets sans mise en avant : chacun prend la moitié de la largeur
  const pair = streamers.length === 2 && !hasFeatured;
  // Textes modifiables dans Admin > Portfolio
  const texts = resolveHome(stored, lang);
  // Pastilles du contenu de chaque projet aux couleurs des catégories (Admin > Offres et réglages > Catégories)
  const productCategories = readCategories(stored);
  // Petites cartes : 3 pastilles, les suivantes résumées par « +N »
  const tagLimit = 3;
  return (
    <>
      <PageHeader eyebrow={texts.text("portfolio.kicker")} title={texts.text("portfolio.title")}>
        {texts.text("portfolio.intro")}
      </PageHeader>
      <div className={`mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 ${pair ? "" : "lg:grid-cols-3"}`}>
        {streamers.map((s) => {
          const own = works.filter((w) => w.streamer === s.id);
          // Couverture lisible en miniature (logo du projet), scène animée au survol
          const study = caseStudies[s.id];
          const cover = own.find((w) => w.id === study?.cover) ?? own.find((w) => w.category === "overlays") ?? own[0];
          const coverVideo = own.find((w) => w.id === study?.coverVideo)?.video ?? cover?.video;
          const counts = categories
            .map((c) => {
              const items = own.filter((w) => w.category === c.id);
              // Pour les emotes, on compte les emotes de la planche plutôt que les planches
              const n = c.id === "emotes" ? items.reduce((sum, w) => sum + (w.emotes?.length ?? 1), 0) : items.length;
              const label = c.label.toLowerCase();
              const en = countLabelsEn[c.id];
              return { ...c, n, color: portfolioCategoryColor(productCategories, c.id, c.label), label: lang === "en" && en ? en[n > 1 ? 1 : 0] : n > 1 ? label : label.replace("réseaux sociaux", "réseau social").replace(/s$/, "") };
            })
            .filter((c) => c.n > 0);
          const big = hasFeatured && s.id === featured;
          return (
            <Link
              key={s.id}
              href={href(lang, projectHref(s.id))}
              data-hover-root
              data-reveal
              className={`group relative block aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-background transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none ${big ? "md:col-span-2 md:aspect-[8/5] lg:aspect-auto" : ""}`}
            >
              {cover?.image && (
                <ProtectedMedia className="absolute inset-0">
                  <Image
                    src={cover.image}
                    alt=""
                    fill
                    draggable={false}
                    sizes={big ? "(min-width: 768px) 760px, 100vw" : pair ? "(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 370px, (min-width: 768px) 50vw, 100vw"}
                    className={`object-cover transition duration-500 ${coverVideo ? "" : "group-hover:scale-105"}`}
                  />
                  {coverVideo && <HoverVideo src={coverVideo} />}
                </ProtectedMedia>
              )}
              {/* Texte posé sur l'image, visible seulement au survol (toujours visible sur mobile, sans survol) */}
              <div className="absolute inset-x-0 bottom-0 translate-y-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-5 pb-4 pt-16 transition duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                <div className="flex items-end justify-between gap-4">
                  <h2 className={`font-display font-bold ${big ? "text-2xl" : "text-xl"}`}>{s.name}</h2>
                  <span className="whitespace-nowrap text-sm text-accent transition group-hover:translate-x-1" aria-hidden>
                    {texts.text("portfolio.link")}
                  </span>
                </div>
                <p className="line-clamp-2 pt-1 text-sm text-muted">{s.description}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t(lang, { fr: "Contenu du projet", en: "Project contents" })}>
                  {(big ? counts : counts.slice(0, tagLimit)).map((c) => (
                    <li key={c.id} style={{ color: c.color, borderColor: `color-mix(in srgb, ${c.color} 45%, transparent)`, background: `color-mix(in srgb, ${c.color} 15%, rgb(0 0 0 / 0.4))` }} className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs">
                      {c.n} {c.label}
                    </li>
                  ))}
                  {!big && counts.length > tagLimit && (
                    <li title={counts.slice(tagLimit).map((c) => `${c.n} ${c.label}`).join(", ")} className="whitespace-nowrap rounded-full border border-border bg-black/40 px-2.5 py-0.5 text-xs text-muted">
                      +{counts.length - tagLimit}
                    </li>
                  )}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
