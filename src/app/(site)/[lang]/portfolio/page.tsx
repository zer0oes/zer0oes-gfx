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
  // Cartes projet : image 16:9 et texte dessous. Projet mis en avant (Admin > Portfolio) : en premier, sur deux colonnes,
  // en grande image à la hauteur des cartes voisines, avec le texte posé dessus au survol
  const featured = featuredProjectId(stored);
  const streamers = [...ordered.filter((s) => s.id === featured), ...ordered.filter((s) => s.id !== featured)];
  const hasFeatured = streamers.length > 1 && streamers[0].id === featured;
  // Deux projets sans mise en avant : chacun prend la moitié de la largeur
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
              return { ...c, n, color: portfolioCategoryColor(productCategories, c.id, c.label), label: lang === "en" && en ? en[n > 1 ? 1 : 0] : n > 1 ? label : label.replace("réseaux sociaux", "réseau social").replace(/s$/, "") };
            })
            .filter((c) => c.n > 0);
          const big = hasFeatured && s.id === featured;
          const media = cover?.image && (
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
          );
          // Pastilles : toutes sur la carte en avant et les cartes à 50 %, sinon 3 puis « +N » (toutes sur mobile)
          const tight = !big && !pair && counts.length > tagLimit + 1;
          const tags = (
            <ul className={`flex flex-wrap gap-2 ${big ? "mt-2" : "mt-auto pt-4"}`} aria-label={t(lang, { fr: "Contenu du projet", en: "Project contents" })}>
              {counts.map((c, index) => (
                <li key={c.id} style={{ color: c.color, borderColor: `color-mix(in srgb, ${c.color} 45%, transparent)`, background: `color-mix(in srgb, ${c.color} ${big ? "15%, rgb(0 0 0 / 0.4)" : "10%, transparent"})` }} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${tight && index >= tagLimit ? "md:hidden" : ""}`}>
                  {c.n} {c.label}
                </li>
              ))}
              {tight && (
                <li aria-hidden title={counts.slice(tagLimit).map((c) => `${c.n} ${c.label}`).join(", ")} className="hidden whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-muted md:block">
                  +{counts.length - tagLimit}
                </li>
              )}
            </ul>
          );
          const heading = (
            <div className="flex items-center justify-between gap-4">
              <h2 className={`font-display font-bold ${big ? "text-2xl" : "text-xl"}`}>{s.name}</h2>
              <span className="whitespace-nowrap text-sm text-accent transition group-hover:translate-x-1" aria-hidden>
                {texts.text("portfolio.link")}
              </span>
            </div>
          );
          // Projet en avant : grande image sur deux colonnes, à la hauteur des cartes voisines, texte posé dessus au survol
          if (big) return (
            <Link
              key={s.id}
              href={href(lang, projectHref(s.id))}
              data-hover-root
              data-reveal
              className="group relative block aspect-video overflow-hidden rounded-3xl border border-border bg-background transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none md:col-span-2 lg:aspect-auto"
            >
              {media}
              {/* Texte visible au survol (toujours visible sur mobile, sans survol) */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent px-6 pb-5 pt-16 transition duration-300 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-visible:translate-y-0 md:group-focus-visible:opacity-100">
                {heading}
                <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>
                {tags}
              </div>
            </Link>
          );
          // Autres projets : image 16:9, texte en dessous
          return (
            <Link
              key={s.id}
              href={href(lang, projectHref(s.id))}
              data-hover-root
              data-reveal
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-surface transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none"
            >
              <div className="relative aspect-video shrink-0 overflow-hidden bg-background">{media}</div>
              <div className="flex flex-1 flex-col p-6">
                {heading}
                <p className="mt-2 text-muted">{s.description}</p>
                {tags}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
