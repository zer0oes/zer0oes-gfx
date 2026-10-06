import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectOverview } from "@/components/ProjectOverview";
import { CaseStudyView } from "@/components/CaseStudyView";
import { EditorialView } from "@/components/EditorialView";
import { TestimonialQuote, testimonialImage } from "@/components/TestimonialQuote";
import { WorkGrid } from "@/components/WorkGrid";
import { caseStudies } from "@/data/case-studies";
import { categories, projectHref, type Category } from "@/data/portfolio";
import { withStoredTexts } from "@/lib/case-study-texts";
import { asLocale, href, t, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { tr, trDeep } from "@/lib/translations-en";

export async function generateStaticParams() {
  const { streamers } = await getStore().getPortfolio();
  return streamers.map((s) => ({ streamer: s.id }));
}

async function findStreamer(id: string, locale: Locale) {
  const portfolio = trDeep(locale, await getStore().getPortfolio());
  return { ...portfolio, streamer: portfolio.streamers.find((s) => s.id === id) };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/portfolio/[streamer]">): Promise<Metadata> {
  const p = await params;
  const lang = asLocale(p.lang);
  const { streamer } = await findStreamer(p.streamer, lang);
  return streamer
    ? { title: `${streamer.name} — Portfolio`, description: streamer.description, alternates: languageAlternates(lang, projectHref(streamer.id)) }
    : {};
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/[lang]/portfolio/[streamer]">) {
  const p = await params;
  const lang = asLocale(p.lang);
  const to = (path: string) => href(lang, path);
  const { streamer, works } = await findStreamer(p.streamer, lang);
  if (!streamer) notFound();

  const own = works.filter((w) => w.streamer === streamer.id);
  // Avis du client (publié seulement avec son accord)
  const review = (await getStore().listTestimonials()).find((x) => x.streamerId === streamer.id);
  const quote = review?.consent ? <TestimonialQuote testimonial={review} locale={lang} image={testimonialImage(own, streamer.id)} /> : null;
  const base = caseStudies[streamer.id];
  // Textes modifiés dans l'admin, appliqués sur la mise en page du code (puis traduits sur /en)
  const study = trDeep(lang, base && "layout" in base ? withStoredTexts(base, await getStore().getCaseStudyTexts(streamer.id)) : base);
  const back = (
    <Link href={to("/portfolio")} className="text-sm text-muted hover:text-foreground">
      {t(lang, { fr: "← Tous les projets", en: "← All projects" })}
    </Link>
  );
  if (study) {
    return (
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        {back}
        {"layout" in study ? (
          <EditorialView study={study} works={own} streamerName={streamer.name} overview={<ProjectOverview streamer={streamer} works={own} locale={lang} quote={quote} />} />
        ) : (
          <CaseStudyView study={study} works={own} streamerName={streamer.name} overview={<ProjectOverview streamer={streamer} works={own} locale={lang} quote={quote} />} />
        )}
      </div>
    );
  }
  const sections = categories.filter((c) => own.some((w) => w.category === c.id)).map((c) => ({ ...c, label: tr(lang, c.label) }));
  // Onglet « Tout » (par défaut) : vue d'ensemble, rangée par type
  const tabs = [{ id: "tout", label: t(lang, { fr: "Tout", en: "All" }) }, ...sections];
  const requested = (await searchParams).type;
  const active = sections.find((s) => s.id === requested) ?? tabs[0];
  // Une seule grille continue, dans l'ordre des types
  const rank = (c: Category) => categories.findIndex((x) => x.id === c);
  const all = [...own].sort((a, b) => rank(a.category) - rank(b.category));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      {back}
      <header className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">{t(lang, { fr: "Projet", en: "Project" })}</p>
          <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">{streamer.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{streamer.description}</p>
        </div>
        {streamer.url && (
          <a href={streamer.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-sm text-accent hover:underline">
            {t(lang, { fr: "Voir la chaîne →", en: "See the channel →" })}
          </a>
        )}
      </header>

      <ProjectOverview streamer={streamer} works={own} locale={lang} quote={quote} />
      <nav aria-label={t(lang, { fr: "Types de réalisations", en: "Types of work" })} className="mt-10 border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const n = tab.id === "tout" ? own.length : own.filter((w) => w.category === tab.id).length;
            const current = tab.id === active?.id;
            return (
              <li key={tab.id}>
                <Link
                  href={to(tab.id === "tout" ? projectHref(streamer.id) : projectHref(streamer.id, tab.id as Category))}
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  className={`block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    current ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {tab.label} <span className="text-muted/70">({n})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">
        {/* key : réinitialise la visionneuse au changement d'onglet */}
        <WorkGrid key={active.id} works={active.id === "tout" ? all : own.filter((w) => w.category === active.id)} showStreamer={false} />
      </div>

    </div>
  );
}
