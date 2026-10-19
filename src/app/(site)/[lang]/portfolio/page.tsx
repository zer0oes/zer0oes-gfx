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
  // Projet mis en avant (Admin > Portfolio) : en premier, sur deux colonnes ; images en 16:9 à la même hauteur partout, cartes d'une même ligne à la même hauteur
  const featured = featuredProjectId(stored);
  const streamers = [...ordered.filter((s) => s.id === featured), ...ordered.filter((s) => s.id !== featured)];
  // Deux projets sans mise en avant : chacun prend la moitié de la largeur
  const hasFeatured = streamers.length > 1 && streamers[0].id === featured;
  const pair = streamers.length === 2 && !hasFeatured;
  // Textes modifiables dans Admin > Portfolio
  const texts = resolveHome(stored, lang);
  // Pastilles du contenu de chaque projet aux couleurs des catégories (Admin > Offres et réglages > Catégories)
  const productCategories = readCategories(stored);
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
              return { ...c, n, label: lang === "en" && en ? en[n > 1 ? 1 : 0] : n > 1 ? label : label.replace("réseaux sociaux", "réseau social").replace(/s$/, "") };
            })
            .filter((c) => c.n > 0);
          const big = hasFeatured && s.id === featured;
          // Projet en avant : une deuxième réalisation à côté de la couverture (deux images 16:9 à la hauteur des autres cartes)
          const others = own.filter((w) => w.image && w.id !== cover?.id && w.video !== coverVideo);
          const second = big ? others.find((w) => w.featured) ?? others.find((w) => w.category === "overlays") ?? others[0] : undefined;
          // Petite carte : pastilles sur une seule ligne (les suivantes résumées par « +N », toutes visibles sur mobile)
          const tight = !big && !pair && counts.length > tagLimit + 1;
          return (
            <Link
              key={s.id}
              href={href(lang, projectHref(s.id))}
              data-hover-root
              data-reveal
              className={`group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none ${big ? "md:col-span-2" : ""}`}
            >
              <div className={big ? "grid gap-6 lg:grid-cols-2" : ""}>
                {[cover, second].map((work, index) => work?.image && (
                  <div key={work.id} className={`relative aspect-video overflow-hidden bg-background ${index ? "hidden lg:block" : ""}`}>
                    <ProtectedMedia className="absolute inset-0">
                      <Image
                        src={work.image}
                        alt=""
                        fill
                        draggable={false}
                        sizes={big ? "(min-width: 1024px) 370px, 100vw" : pair ? "(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 370px, (min-width: 768px) 50vw, 100vw"}
                        className={`object-cover transition duration-500 ${(index ? work.video : coverVideo) ? "" : "group-hover:scale-105"}`}
                      />
                      {(index ? work.video : coverVideo) && <HoverVideo src={(index ? work.video : coverVideo)!} />}
                    </ProtectedMedia>
                  </div>
                ))}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className={`font-display font-bold ${big ? "text-2xl lg:text-3xl" : "text-xl"}`}>{s.name}</h2>
                  <span className="text-sm text-accent transition group-hover:translate-x-1" aria-hidden>
                    {texts.text("portfolio.link")}
                  </span>
                </div>
                <p className="mt-2 text-muted">{s.description}</p>
                <ul className="mt-auto flex flex-wrap gap-2 pt-4" aria-label={t(lang, { fr: "Contenu du projet", en: "Project contents" })}>
                  {counts.map((c, index) => {
                    const color = portfolioCategoryColor(productCategories, c.id, categories.find((k) => k.id === c.id)?.label ?? c.id);
                    return (
                      <li key={c.id} style={{ color, borderColor: `color-mix(in srgb, ${color} 45%, transparent)`, background: `color-mix(in srgb, ${color} 10%, transparent)` }} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${tight && index >= tagLimit ? "md:hidden" : ""}`}>
                        {c.n} {c.label}
                      </li>
                    );
                  })}
                  {tight && (
                    <li aria-hidden title={counts.slice(tagLimit).map((c) => `${c.n} ${c.label}`).join(", ")} className="hidden whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-muted md:block">
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
