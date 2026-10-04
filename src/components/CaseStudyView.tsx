"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CasePiece, CaseStudy } from "@/data/case-studies";
import type { Work } from "@/data/portfolio";
import { HoverVideo } from "./HoverVideo";
import { Lightbox } from "./Lightbox";
import { ProtectedMedia } from "./protection";
import { WorkCard } from "./WorkCard";

type Piece = { work: Work; label: string };

// Page projet en « étude de cas » : scène d'ouverture, scènes du stream, sections numérotées
// (pièces fortes en grand, pièces complémentaires plus discrètes), puis un appel au contact.
export function CaseStudyView({ study, works, streamerName }: { study: CaseStudy; works: Work[]; streamerName: string }) {
  const byId = new Map(works.map((w) => [w.id, w]));
  const pieces = (list: CasePiece[] = []): Piece[] =>
    list.flatMap((p) => {
      const work = byId.get(p.id);
      return work ? [{ work, label: p.label }] : [];
    });
  const hero = byId.get(study.hero);
  const scenes = pieces(study.scenes);
  const sections = study.sections
    .map((s) => ({
      ...s,
      items: s.works.map((id) => byId.get(id)).filter((w): w is Work => Boolean(w)),
      extra: pieces(s.secondary),
    }))
    .filter((s) => s.items.length || s.extra.length);
  const placed = new Set([
    study.hero,
    ...scenes.map((p) => p.work.id),
    ...sections.flatMap((s) => [...s.items.map((w) => w.id), ...s.extra.map((p) => p.work.id)]),
  ]);
  // Pièce ajoutée dans l'admin sans place prévue : affichée à la fin plutôt que perdue
  const unplaced = works.filter((w) => !placed.has(w.id));
  // Ordre de la visionneuse : celui de la page
  const ordered = [
    ...(hero ? [hero] : []),
    ...scenes.map((p) => p.work),
    ...sections.flatMap((s) => [...s.items, ...s.extra.map((p) => p.work)]),
    ...unplaced,
  ];
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

      {scenes.length > 0 && (
        <section aria-labelledby="scenes" className="mt-12">
          <h2 id="scenes" className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Les scènes du stream
          </h2>
          <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((p) => (
              <li key={p.work.id}>
                <Tile work={p.work} label={p.label} onOpen={() => openWork(p.work)} />
              </li>
            ))}
          </ul>
        </section>
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
          {s.items.length > 0 && (
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
          )}
          {s.extra.length > 0 &&
            (s.secondaryLayout === "profil" && s.extra.length === 2 ? (
              // Avatar en petit carré à gauche, panneaux dans un espace plus large à droite
              <div className="mt-8 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <Tile work={s.extra[0].work} label={s.extra[0].label} onOpen={() => openWork(s.extra[0].work)} aspect="aspect-square" />
                <Tile work={s.extra[1].work} label={s.extra[1].label} onOpen={() => openWork(s.extra[1].work)} aspect="aspect-video sm:aspect-auto sm:min-h-48 sm:flex-1" />
              </div>
            ) : (
              // Aperçus côte à côte, plus discrets que les pièces principales
              <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:w-2/3">
                {s.extra.map((p) => (
                  <li key={p.work.id}>
                    <Tile work={p.work} label={p.label} onOpen={() => openWork(p.work)} />
                  </li>
                ))}
              </ul>
            ))}
        </section>
      ))}

      {unplaced.length > 0 && (
        <section aria-labelledby="autres" className="mt-16 border-t border-border pt-12">
          <h2 id="autres" className="font-display text-2xl font-bold">
            Aussi dans ce projet
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((w) => (
              <WorkCard key={w.id} work={w} showStreamer={false} onOpen={() => openWork(w)} />
            ))}
          </div>
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

// Média cliquable (agrandissement), avec la vidéo au survol s'il y en a une.
export function Media({
  work,
  onOpen,
  aspect = "aspect-video",
  sizes,
  priority = false,
  image,
}: {
  work: Work;
  onOpen: () => void;
  aspect?: string;
  sizes: string;
  priority?: boolean;
  // Visuel recadré pour la mise en page (la visionneuse affiche l'original)
  image?: string;
}) {
  return (
    <div data-hover-root className={`group relative overflow-hidden rounded-2xl border border-border bg-background ${aspect}`}>
      {(image ?? work.image) && (
        <ProtectedMedia className="absolute inset-0">
          <Image
            src={(image ?? work.image)!}
            alt={work.title}
            fill
            priority={priority}
            draggable={false}
            sizes={sizes}
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
      <Media work={work} onOpen={onOpen} priority={priority} sizes="(min-width: 1152px) 1152px, 100vw" />
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

// Vignette : une image, un titre court, un clic pour agrandir.
function Tile({ work, label, onOpen, aspect }: { work: Work; label: string; onOpen: () => void; aspect?: string }) {
  return (
    <figure className="flex h-full flex-col">
      <Media work={work} onOpen={onOpen} aspect={aspect} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
      <figcaption className="mt-2 text-sm font-medium">{label}</figcaption>
    </figure>
  );
}
