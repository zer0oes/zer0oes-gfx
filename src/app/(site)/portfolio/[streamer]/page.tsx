import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkGrid } from "@/components/WorkGrid";
import { categories, projectHref } from "@/data/portfolio";
import { getStore } from "@/lib/store";

export async function generateStaticParams() {
  const { streamers } = await getStore().getPortfolio();
  return streamers.map((s) => ({ streamer: s.id }));
}

async function findStreamer(id: string) {
  const portfolio = await getStore().getPortfolio();
  return { ...portfolio, streamer: portfolio.streamers.find((s) => s.id === id) };
}

export async function generateMetadata({ params }: PageProps<"/portfolio/[streamer]">): Promise<Metadata> {
  const { streamer } = await findStreamer((await params).streamer);
  return streamer ? { title: `${streamer.name} — Portfolio`, description: streamer.description } : {};
}

export default async function ProjectPage({ params, searchParams }: PageProps<"/portfolio/[streamer]">) {
  const { streamer, works } = await findStreamer((await params).streamer);
  if (!streamer) notFound();

  const own = works.filter((w) => w.streamer === streamer.id);
  const tabs = categories.filter((c) => own.some((w) => w.category === c.id));
  const requested = (await searchParams).type;
  const active = tabs.find((t) => t.id === requested) ?? tabs[0];
  const shown = own.filter((w) => w.category === active?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <Link href="/portfolio" className="text-sm text-muted hover:text-foreground">
        ← Tous les projets
      </Link>
      <header className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Projet</p>
          <h1 className="mt-1 font-display text-4xl font-bold sm:text-5xl">{streamer.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">{streamer.description}</p>
        </div>
        {streamer.url && (
          <a
            href={streamer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm text-accent hover:underline"
          >
            Voir la chaîne →
          </a>
        )}
      </header>

      <nav aria-label="Types de réalisations" className="mt-10 border-b border-border">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const n = own.filter((w) => w.category === t.id).length;
            const current = t.id === active?.id;
            return (
              <li key={t.id}>
                <Link
                  href={projectHref(streamer.id, t.id)}
                  scroll={false}
                  aria-current={current ? "page" : undefined}
                  className={`block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
                    current ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {t.label} <span className="text-muted/70">({n})</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8">
        {/* key : réinitialise la visionneuse au changement d'onglet */}
        <WorkGrid key={active?.id} works={shown} showStreamer={false} />
      </div>
    </div>
  );
}
