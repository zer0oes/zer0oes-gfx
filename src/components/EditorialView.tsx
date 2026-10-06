"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CasePiece, EditorialBlock, EditorialStudy } from "@/data/case-studies";
import type { Work } from "@/data/portfolio";
import { href, t } from "@/lib/i18n";
import { Media } from "./CaseStudyView";
import { useLocale } from "./I18nProvider";
import { Lightbox } from "./Lightbox";
import { WorkCard } from "./WorkCard";

const kickerClass = "text-xs font-semibold uppercase tracking-[0.2em] text-accent";
const titleClass = "mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl";

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={l}>
          {i > 0 && <br />}
          {l}
        </span>
      ))}
    </>
  );
}

// Page projet « éditoriale » : blocs asymétriques où texte et visuels alternent.
export function EditorialView({ study, works, streamerName }: { study: EditorialStudy; works: Work[]; streamerName: string }) {
  const byId = new Map(works.map((w) => [w.id, w]));
  const get = (id?: string) => (id ? byId.get(id) : undefined);

  // Ordre de la visionneuse : celui de la page
  const ids: string[] = [study.hero, ...(study.headerLogo ? [study.headerLogo.id] : [])];
  for (const b of study.blocks) {
    if (b.type === "signature") ids.push(b.main, ...(b.side ? [b.side.id] : []));
    if (b.type === "scenes") ids.push(...b.scenes.map((s) => s.id));
    if (b.type === "detail") ids.push(b.main.id, b.side.id, ...b.small.map((s) => s.id));
    if (b.type === "emotes") ids.push(b.work);
    if (b.type === "beyond") ids.push(b.main, ...(b.extra ?? []).map((s) => s.id));
  }
  const placed = ids.map(get).filter((w): w is Work => Boolean(w));
  const unplaced = works.filter((w) => !placed.includes(w));
  const ordered = [...placed, ...unplaced];
  const [open, setOpen] = useState<number | null>(null);
  const locale = useLocale();
  const openWork = (w: Work) => setOpen(ordered.indexOf(w));
  const hero = get(study.hero);
  const headerLogo = get(study.headerLogo?.id);

  return (
    <>
      {/* Titre et présentation alignés en haut : l'asymétrie vient des largeurs de colonnes */}
      <header className="mt-8">
        <p className={kickerClass}>{study.eyebrow}</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-7xl">
              {study.headline[0]}
              <br />
              <span className="text-accent">{study.headline[1]}</span>
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pt-3">
            <p className="text-lg text-muted">{study.intro}</p>
            <p className="mt-4 text-sm text-muted" aria-label={t(locale, { fr: "Ce que comprend le projet", en: "What the project includes" })}>
              {study.tags.join(" / ")}
            </p>
            {headerLogo && (
              <figure className="mt-6 max-w-sm">
                <Media work={headerLogo} onOpen={() => openWork(headerLogo)} sizes="384px" />
                <figcaption className="mt-2 text-sm text-muted">{study.headerLogo?.caption}</figcaption>
              </figure>
            )}
          </div>
        </div>
      </header>

      {hero && (
        <figure className="mt-10">
          <Media work={hero} onOpen={() => openWork(hero)} priority sizes="(min-width: 1152px) 1152px, 100vw" />
          <figcaption className="mt-3 text-sm text-muted">{study.heroCaption}</figcaption>
        </figure>
      )}

      {study.blocks.map((b, i) => (
        <Block key={i} block={b} get={get} openWork={openWork} />
      ))}

      {unplaced.length > 0 && (
        <section aria-labelledby="aussi" className="mt-24">
          <h2 id="aussi" className="font-display text-2xl font-bold">
            {t(locale, { fr: "Aussi dans ce projet", en: "Also in this project" })}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {unplaced.map((w) => (
              <WorkCard key={w.id} work={w} showStreamer={false} onOpen={() => openWork(w)} />
            ))}
          </div>
        </section>
      )}

      <aside className="mt-24 flex flex-col gap-6 border-t border-border pt-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className={kickerClass}>{study.cta.kicker}</p>
          <h2 className={titleClass}>
            <Lines lines={study.cta.title} />
          </h2>
        </div>
        <Link
          href={href(locale, "/contact")}
          className="inline-flex shrink-0 self-start rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 sm:self-auto"
        >
          {t(locale, { fr: "Parlons de ton projet ↗", en: "Let's talk about your project ↗" })}
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

function Block({ block: b, get, openWork }: { block: EditorialBlock; get: (id?: string) => Work | undefined; openWork: (w: Work) => void }) {
  if (b.type === "signature") {
    const main = get(b.main);
    const side = get(b.side?.id);
    return (
      <section className="mt-24">
        <p className={kickerClass}>{b.kicker}</p>
        <h2 className={titleClass}>
          <Lines lines={b.title} />
        </h2>
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
          {main && (
            <div className="lg:col-span-8">
              <Media work={main} onOpen={() => openWork(main)} sizes="(min-width: 1024px) 760px, 100vw" />
            </div>
          )}
          {side && (
            <figure className="mx-auto w-2/3 max-w-xs sm:w-1/2 lg:col-span-4 lg:w-full">
              <div className="overflow-hidden rounded-full">
                <Media work={side} onOpen={() => openWork(side)} aspect="aspect-square" sizes="320px" />
              </div>
              <figcaption className="mt-4 text-center text-sm text-muted">{b.side?.caption}</figcaption>
            </figure>
          )}
        </div>
      </section>
    );
  }

  if (b.type === "scenes") return <ScenesBlock block={b} get={get} openWork={openWork} />;

  if (b.type === "detail") {
    const main = get(b.main.id);
    const side = get(b.side.id);
    const small = b.small.flatMap((p) => {
      const w = get(p.id);
      return w ? [{ w, ...p }] : [];
    });
    return (
      <section className="mt-24">
        <p className={kickerClass}>{b.kicker}</p>
        <h2 className={titleClass}>
          <Lines lines={b.title} />
        </h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {main && (
            <figure className={b.main.aspect ? "lg:col-span-5" : "lg:col-span-7"}>
              <Media
                work={main}
                onOpen={() => openWork(main)}
                image={b.main.image}
                aspect={b.main.aspect}
                sizes="(min-width: 1024px) 660px, 100vw"
              />
              <figcaption className="mt-3 text-sm text-muted">{b.main.caption}</figcaption>
            </figure>
          )}
          <div className={b.main.aspect ? "lg:col-span-7" : "lg:col-span-5"}>
            <h3 className="font-display text-2xl font-bold leading-tight">
              <Lines lines={b.sideTitle} />
            </h3>
            {side && (
              <figure className="mt-6">
                <Media work={side} onOpen={() => openWork(side)} sizes="(min-width: 1024px) 460px, 100vw" />
                <figcaption className="mt-3 text-sm text-muted">{b.side.caption}</figcaption>
              </figure>
            )}
            {small.length > 0 && (
              <ul className={`mt-6 grid gap-4 ${small.length > 1 ? "grid-cols-2" : ""}`}>
                {small.map(({ w, label, image, aspect }) => (
                  <li key={w.id}>
                    <Media work={w} onOpen={() => openWork(w)} image={image} aspect={aspect} sizes="(min-width: 1024px) 460px, 50vw" />
                    <p className="mt-2 text-sm text-muted">{label}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (b.type === "emotes") {
    const work = get(b.work);
    if (!work) return null;
    const emotes = (work.emotes ?? []).slice(0, 12);
    return (
      <section className="mt-24 grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className={kickerClass}>{b.kicker}</p>
          <h2 className={titleClass}>
            <Lines lines={b.title} />
          </h2>
          <p className="mt-4 text-muted">{b.text}</p>
        </div>
        <div className="lg:col-span-8">
          <button
            type="button"
            onClick={() => openWork(work)}
            aria-label="Voir toutes les emotes en grand"
            className="protected-media relative block w-full cursor-zoom-in select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent [-webkit-touch-callout:none]"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            {emotes.length ? (
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {emotes.map((e) => (
                  <li key={e.name} className="relative aspect-square">
                    <Image src={e.src} alt={e.name} fill sizes="120px" draggable={false} unoptimized={e.animated} className="object-contain" />
                  </li>
                ))}
              </ul>
            ) : (
              <Media work={work} onOpen={() => openWork(work)} sizes="(min-width: 1024px) 760px, 100vw" />
            )}
          </button>
        </div>
      </section>
    );
  }

  // beyond
  const main = get(b.main);
  const extra = (b.extra ?? []).flatMap((p) => {
    const w = get(p.id);
    return w ? [{ w, label: p.label }] : [];
  });
  if (b.wide) {
    // Conclusion visuelle : la bannière en très grand, le texte sur le côté
    return (
      <section className="mt-24 grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3 lg:pb-6">
          <p className={kickerClass}>{b.kicker}</p>
          <h2 className={titleClass}>
            <Lines lines={b.title} />
          </h2>
          <p className="mt-4 text-muted">{b.text}</p>
        </div>
        {main && (
          <div className="lg:col-span-9">
            <Media work={main} onOpen={() => openWork(main)} sizes="(min-width: 1024px) 860px, 100vw" />
          </div>
        )}
      </section>
    );
  }
  return (
    <section className="mt-24 grid items-center gap-8 lg:grid-cols-12">
      {main && (
        <div className="lg:col-span-7">
          <Media work={main} onOpen={() => openWork(main)} sizes="(min-width: 1024px) 660px, 100vw" />
        </div>
      )}
      <div className="lg:col-span-5">
        <p className={kickerClass}>{b.kicker}</p>
        <h2 className={titleClass}>
          <Lines lines={b.title} />
        </h2>
        <p className="mt-4 text-muted">{b.text}</p>
        {extra.map(({ w, label }) => (
          <figure key={w.id} className="mt-6">
            <Media work={w} onOpen={() => openWork(w)} sizes="(min-width: 1024px) 460px, 100vw" />
            <figcaption className="mt-2 text-sm text-muted">{label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

// Une grande scène, et les noms des autres scènes en dessous pour passer de l'une à l'autre.
function ScenesBlock({
  block: b,
  get,
  openWork,
}: {
  block: Extract<EditorialBlock, { type: "scenes" }>;
  get: (id?: string) => Work | undefined;
  openWork: (w: Work) => void;
}) {
  const scenes = b.scenes.flatMap((p: CasePiece) => {
    const w = get(p.id);
    return w ? [{ w, label: p.label }] : [];
  });
  const [current, setCurrent] = useState(0);
  const locale = useLocale();
  if (!scenes.length) return null;
  const active = scenes[Math.min(current, scenes.length - 1)];
  return (
    <section className="mt-24 grid items-end gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 lg:pb-12">
        <p className={kickerClass}>{b.kicker}</p>
        <h2 className={titleClass}>
          <Lines lines={b.title} />
        </h2>
        <p className="mt-4 text-muted">{b.text}</p>
      </div>
      <div className="lg:col-span-8">
        {/* key : relance l'aperçu vidéo au changement de scène */}
        <Media key={active.w.id} work={active.w} onOpen={() => openWork(active.w)} sizes="(min-width: 1024px) 760px, 100vw" />
        <div role="tablist" aria-label={t(locale, { fr: "Scènes", en: "Scenes" })} className="mt-3 flex flex-wrap justify-between gap-2">
          {scenes.map((s, i) => (
            <button
              key={s.w.id}
              type="button"
              role="tab"
              aria-selected={s === active}
              onClick={() => setCurrent(i)}
              className={`rounded-full px-3 py-1 text-sm transition ${s === active ? "bg-surface-2 font-semibold text-foreground" : "text-muted hover:text-foreground"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
