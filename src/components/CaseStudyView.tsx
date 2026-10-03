"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CaseStudy } from "@/data/case-studies";
import { categories, type Work } from "@/data/portfolio";
import { Carousel, CarouselItem } from "./Carousel";
import { HoverVideo } from "./HoverVideo";
import { Lightbox } from "./Lightbox";
import { ProtectedMedia } from "./protection";
import { WorkCard } from "./WorkCard";

// Page projet en « étude de cas » : une scène principale, des sections numérotées
// avec les pièces les plus fortes, puis les autres pièces plus petites, et un appel au contact.
export function CaseStudyView({ study, works, streamerName }: { study: CaseStudy; works: Work[]; streamerName: string }) {
  const byId = new Map(works.map((w) => [w.id, w]));
  const hero = byId.get(study.hero);
  const sections = study.sections
    .map((s) => ({ ...s, items: s.works.map((id) => byId.get(id)).filter((w): w is Work => Boolean(w)) }))
    .filter((s) => s.items.length);
  const featured = new Set([study.hero, ...sections.flatMap((s) => s.items.map((w) => w.id))]);
  // Autres pièces regroupées par type (un carrousel par type)
  const groups = categories
    .map((c) => ({ ...c, items: works.filter((w) => !featured.has(w.id) && w.category === c.id) }))
    .filter((g) => g.items.length);
  const others = groups.flatMap((g) => g.items);
  // Ordre de la visionneuse : celui de la page
  const ordered = [...(hero ? [hero] : []), ...sections.flatMap((s) => s.items), ...others];
  const [open, setOpen] = useState<number | null>(null);
  const openWork = (w: Work) => setOpen(ordered.indexOf(w));

  return (
    <>
      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{study.eyebrow}</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl">
          {study.headline[0]}
          <br />
          {study.headline[1]}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{study.intro}</p>
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Ce que comprend le projet">
          {study.tags.map((t) => (
            <li key={t} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {t}
            </li>
          ))}
        </ul>
      </header>

      {hero && (
        <Figure work={hero} onOpen={() => openWork(hero)} caption={study.heroCaption} aside="Vue d'ensemble" priority className="mt-10" />
      )}

      <div className="mt-14 grid gap-10 sm:grid-cols-2">
        {study.pillars.map((p) => (
          <div key={p.kicker}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{p.kicker}</p>
            <h2 className="mt-2 font-display text-2xl font-bold">{p.title}</h2>
            <p className="mt-3 text-muted">{p.text}</p>
          </div>
        ))}
      </div>

      {sections.map((s, i) => (
        <section key={s.kicker} aria-labelledby={`section-${i}`} className="mt-16 border-t border-border pt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            {String(i + 1).padStart(2, "0")} / {s.kicker}
          </p>
          <h2 id={`section-${i}`} className="mt-2 font-display text-3xl font-bold">
            {s.title}
          </h2>
          {s.text && <p className="mt-3 max-w-3xl text-muted">{s.text}</p>}
          <div className={`mt-8 grid gap-6 ${s.items.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {s.items.map((w) => (
              <Figure
                key={w.id}
                work={w}
                onOpen={() => openWork(w)}
                caption={s.items.length > 1 ? undefined : w.title}
                title={s.items.length > 1 ? w.title : undefined}
                text={s.items.length > 1 ? w.description : undefined}
              />
            ))}
          </div>
        </section>
      ))}

      {others.length > 0 && (
        <section aria-labelledby="autres" className="mt-16 border-t border-border pt-12">
          <h2 id="autres" className="font-display text-2xl font-bold">
            Les autres pièces du projet
          </h2>
          <p className="mt-2 text-muted">Variantes, widgets et déclinaisons, dans le même univers.</p>
          {groups.map((g) => (
            <div key={g.id} className="mt-10">
              <h3 className="mb-4 font-display text-lg font-semibold">
                {g.label} <span className="text-sm font-normal text-muted">({g.items.length})</span>
              </h3>
              <Carousel label={`${g.label} — autres pièces`}>
                {g.items.map((w) => (
                  <CarouselItem key={w.id}>
                    <WorkCard work={w} showStreamer={false} onOpen={() => openWork(w)} />
                  </CarouselItem>
                ))}
              </Carousel>
            </div>
          ))}
        </section>
      )}

      <aside className="mt-20 rounded-3xl border border-border bg-surface px-6 py-12 text-center sm:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Ton prochain univers</p>
        <h2 className="mt-3 font-display text-3xl font-bold">Et si on créait celui de ta chaîne ?</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Parle-moi de ton stream, de tes envies et de ce qui te rend unique.</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110"
        >
          Parlons de ton projet →
        </Link>
      </aside>

      <Lightbox
        works={ordered}
        streamerNames={{ [works[0]?.streamer ?? ""]: streamerName }}
        index={open}
        onClose={() => setOpen(null)}
        onNavigate={setOpen}
      />
    </>
  );
}

function Figure({
  work,
  onOpen,
  caption,
  aside,
  title,
  text,
  priority = false,
  className = "",
}: {
  work: Work;
  onOpen: () => void;
  caption?: string;
  aside?: string;
  title?: string;
  text?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div data-hover-root className="group relative aspect-video overflow-hidden rounded-2xl border border-border bg-background">
        {work.image && (
          <ProtectedMedia className="absolute inset-0">
            <Image
              src={work.image}
              alt={work.title}
              fill
              priority={priority}
              draggable={false}
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            {work.video && <HoverVideo src={work.video} />}
          </ProtectedMedia>
        )}
        {work.video && (
          <span className="absolute right-3 top-3 z-[6] flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
            <span aria-hidden>▶</span> Animé
          </span>
        )}
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Voir « ${work.title} » en grand`}
          className="absolute inset-0 z-[5] cursor-zoom-in rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>
      {(caption || aside) && (
        <figcaption className="mt-3 flex justify-between gap-4 text-sm text-muted">
          <span>{caption}</span>
          {aside && <span>{aside}</span>}
        </figcaption>
      )}
      {title && <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>}
      {text && <p className="mt-1 text-sm text-muted">{text}</p>}
    </figure>
  );
}
