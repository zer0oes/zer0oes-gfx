import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HoverVideo } from "@/components/HoverVideo";
import { ProtectedMedia } from "@/components/protection";
import { PageHeader } from "@/components/ui";
import { caseStudies } from "@/data/case-studies";
import { categories, projectHref } from "@/data/portfolio";
import { resolveHome } from "@/lib/home-content";
import { asLocale, href, t } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
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
  const { streamers, works } = trDeep(lang, portfolio);
  // Textes modifiables dans Admin > Portfolio
  const texts = resolveHome(stored, lang);
  return (
    <>
      <PageHeader eyebrow={texts.text("portfolio.kicker")} title={texts.text("portfolio.title")}>
        {texts.text("portfolio.intro")}
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
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
              return { ...c, n, label: lang === "en" && en ? en[n > 1 ? 1 : 0] : n > 1 ? label : label.replace(/s$/, "") };
            })
            .filter((c) => c.n > 0);
          return (
            <Link
              key={s.id}
              href={href(lang, projectHref(s.id))}
              data-hover-root
              data-reveal
              className="group overflow-hidden rounded-3xl border border-border bg-surface transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none"
            >
              <div className="relative aspect-video overflow-hidden bg-background">
                {cover?.image && (
                  <ProtectedMedia className="absolute inset-0">
                    <Image
                      src={cover.image}
                      alt=""
                      fill
                      draggable={false}
                      sizes="(min-width: 1024px) 560px, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    {coverVideo && <HoverVideo src={coverVideo} />}
                  </ProtectedMedia>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold">{s.name}</h2>
                  <span className="text-sm text-accent transition group-hover:translate-x-1" aria-hidden>
                    {texts.text("portfolio.link")}
                  </span>
                </div>
                <p className="mt-2 text-muted">{s.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label={t(lang, { fr: "Contenu du projet", en: "Project contents" })}>
                  {counts.map((c) => (
                    <li key={c.id} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                      {c.n} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
