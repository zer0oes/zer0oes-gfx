"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Work } from "@/data/portfolio";
import { href, t } from "@/lib/i18n";
import { lines, pageWorkIds, say, type Block, type BuilderPage, type Slot } from "@/lib/page-builder";
import { Media } from "./CaseStudyView";
import { useLocale } from "./I18nProvider";
import { Lightbox } from "./Lightbox";
import { ProjectOverview } from "./ProjectOverview";
import { WorkCard } from "./WorkCard";

const kickerClass = "text-xs font-semibold uppercase tracking-[0.2em] text-accent";
const titleClass = "mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl";

function Lines({ text }: { text: string[] }) {
  return (
    <>
      {text.map((l, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {l}
        </span>
      ))}
    </>
  );
}

type Ctx = { get: (id?: string) => Work | undefined; openWork: (w: Work) => void };

// Page projet construite dans l'admin (Portfolio > projet > Mise en page).
// quote : avis du client, affiché avant l'appel au contact.
export function BuilderView({
  page,
  works,
  streamerName,
  quote,
}: {
  page: BuilderPage;
  works: Work[];
  streamerName: string;
  quote?: React.ReactNode;
}) {
  const locale = useLocale();
  const byId = new Map(works.map((w) => [w.id, w]));
  const get = (id?: string) => (id ? byId.get(id) : undefined);
  const placed = pageWorkIds(page).map(get).filter((w): w is Work => Boolean(w));
  const unplaced = works.filter((w) => !placed.includes(w));
  const ordered = [...new Set([...placed, ...unplaced])];
  const [open, setOpen] = useState<number | null>(null);
  const openWork = (w: Work) => setOpen(ordered.indexOf(w));
  const hero = get(page.header.hero);
  const headerLogo = get(page.header.headerLogo?.work);
  const headline = lines(page.header.headline, locale);
  const ctaTitle = lines(page.cta.title, locale);

  return (
    <>
      <header className="mt-8">
        <p className={kickerClass}>{say(page.header.eyebrow, locale)}</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-0">
          <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-7xl lg:contents">
            <span className="lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:[text-box-trim:trim-start]">{headline[0]}</span>
            <br className="lg:hidden" />
            <span className="text-accent lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:[align-self:last_baseline]">{headline.slice(1).join(" ")}</span>
          </h1>
          <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:pb-4 lg:[&>ul]:mt-0">
            <ProjectOverview works={works} locale={locale} />
          </div>
          <p className="text-lg text-muted lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:[align-self:last_baseline]">{say(page.header.intro, locale)}</p>
          {headerLogo && (
            <figure className="max-w-sm lg:col-span-5 lg:col-start-8 lg:row-start-3 lg:mt-6">
              <Media work={headerLogo} onOpen={() => openWork(headerLogo)} sizes="384px" />
              <figcaption className="mt-2 text-sm text-muted">{say(page.header.headerLogo?.caption, locale)}</figcaption>
            </figure>
          )}
        </div>
      </header>

      {hero && (
        <figure className="mt-10">
          <Media work={hero} onOpen={() => openWork(hero)} priority sizes="(min-width: 1152px) 1152px, 100vw" />
          {say(page.header.heroCaption, locale) && <figcaption className="mt-3 text-sm text-muted">{say(page.header.heroCaption, locale)}</figcaption>}
        </figure>
      )}

      {page.blocks.map((b) => (
        <div key={b.id} data-block={b.id}>
          <PageBlock block={b} get={get} openWork={openWork} />
        </div>
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

      {quote && <div className="mt-24">{quote}</div>}

      {(ctaTitle.length > 0 || say(page.cta.kicker, locale)) && (
        <aside className="mt-24 flex flex-col gap-6 border-t border-border pt-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={kickerClass}>{say(page.cta.kicker, locale)}</p>
            <h2 className={titleClass}>
              <Lines text={ctaTitle} />
            </h2>
          </div>
          <Link
            href={href(locale, "/contact")}
            className="inline-flex shrink-0 self-start rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 sm:self-auto"
          >
            {t(locale, { fr: "Parlons de ton projet ↗", en: "Let's talk about your project ↗" })}
          </Link>
        </aside>
      )}

      <Lightbox works={ordered} streamerNames={{ [works[0]?.streamer ?? ""]: streamerName }} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </>
  );
}

// Visuels d'un bloc présents dans le projet, avec leur légende
function pieces(slots: Slot[], get: Ctx["get"]) {
  return slots.flatMap((s) => {
    const w = get(s.work);
    return w ? [{ w, s }] : [];
  });
}

function Heading({ block: b }: { block: Block }) {
  const locale = useLocale();
  const kicker = say(b.kicker, locale);
  const title = lines(b.title, locale);
  return (
    <>
      {kicker && <p className={kickerClass}>{kicker}</p>}
      {title.length > 0 && (
        <h2 className={titleClass}>
          <Lines text={title} />
        </h2>
      )}
    </>
  );
}

function Text({ block: b }: { block: Block }) {
  const locale = useLocale();
  const text = say(b.text, locale);
  return text ? <p className="mt-4 whitespace-pre-line text-muted">{text}</p> : null;
}

function Caption({ slot, className = "mt-3" }: { slot: Slot; className?: string }) {
  const locale = useLocale();
  const c = say(slot.caption, locale);
  return c ? <figcaption className={`${className} text-sm text-muted`}>{c}</figcaption> : null;
}

export function PageBlock({ block: b, get, openWork }: { block: Block } & Ctx) {
  const locale = useLocale();
  const items = pieces(b.slots, get);
  const [main, side] = items;

  if (b.layout === "signature") {
    return (
      <section className="mt-24">
        <Heading block={b} />
        <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
          {main && (
            <div className="lg:col-span-8">
              <Media work={main.w} onOpen={() => openWork(main.w)} sizes="(min-width: 1024px) 760px, 100vw" />
            </div>
          )}
          {side && (
            <figure className="mx-auto w-2/3 max-w-xs sm:w-1/2 lg:col-span-4 lg:w-full">
              <div className="overflow-hidden rounded-full">
                <Media work={side.w} onOpen={() => openWork(side.w)} aspect="aspect-square" sizes="320px" />
              </div>
              <Caption slot={side.s} className="mt-4 text-center" />
            </figure>
          )}
        </div>
      </section>
    );
  }

  if (b.layout === "scenes") return <ScenesBlock block={b} items={items} openWork={openWork} />;

  if (b.layout === "detail") {
    const small = items.slice(2);
    const subtitle = lines(b.subtitle, locale);
    const tall = Boolean(main?.s.aspect);
    return (
      <section className="mt-24">
        <Heading block={b} />
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {main && (
            <figure className={tall ? "lg:col-span-5" : "lg:col-span-7"}>
              <Media work={main.w} onOpen={() => openWork(main.w)} image={main.s.image} aspect={main.s.aspect} sizes="(min-width: 1024px) 660px, 100vw" />
              <Caption slot={main.s} />
            </figure>
          )}
          <div className={tall ? "lg:col-span-7" : "lg:col-span-5"}>
            {subtitle.length > 0 && (
              <h3 className="font-display text-2xl font-bold leading-tight">
                <Lines text={subtitle} />
              </h3>
            )}
            {side && (
              <figure className={subtitle.length ? "mt-6" : ""}>
                <Media work={side.w} onOpen={() => openWork(side.w)} image={side.s.image} aspect={side.s.aspect} sizes="(min-width: 1024px) 460px, 100vw" />
                <Caption slot={side.s} />
              </figure>
            )}
            {small.length > 0 && (
              <ul className={`mt-6 grid gap-4 ${small.length > 1 ? "grid-cols-2" : ""}`}>
                {small.map(({ w, s }) => (
                  <li key={w.id}>
                    <Media work={w} onOpen={() => openWork(w)} image={s.image} aspect={s.aspect} sizes="(min-width: 1024px) 460px, 50vw" />
                    {say(s.caption, locale) && <p className="mt-2 text-sm text-muted">{say(s.caption, locale)}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (b.layout === "emotes") {
    if (!main) return null;
    const work = main.w;
    const emotes = (work.emotes ?? []).slice(0, 12);
    return (
      <section className="mt-24 grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Heading block={b} />
          <Text block={b} />
        </div>
        <div className="lg:col-span-8">
          {emotes.length ? (
            <button
              type="button"
              onClick={() => openWork(work)}
              aria-label="Voir toutes les emotes en grand"
              className="protected-media relative block w-full cursor-zoom-in select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent [-webkit-touch-callout:none]"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {emotes.map((e) => (
                  <li key={e.name} className="relative aspect-square">
                    <Image src={e.src} alt={e.name} fill sizes="120px" draggable={false} unoptimized={e.animated} className="object-contain" />
                  </li>
                ))}
              </ul>
            </button>
          ) : (
            <Media work={work} onOpen={() => openWork(work)} sizes="(min-width: 1024px) 760px, 100vw" />
          )}
        </div>
      </section>
    );
  }

  if (b.layout === "wide") {
    return (
      <section className="mt-24 grid items-end gap-8 lg:grid-cols-12">
        <div className="lg:col-span-3 lg:pb-6">
          <Heading block={b} />
          <Text block={b} />
        </div>
        {main && (
          <div className="lg:col-span-9">
            <Media work={main.w} onOpen={() => openWork(main.w)} sizes="(min-width: 1024px) 860px, 100vw" />
          </div>
        )}
      </section>
    );
  }

  if (b.layout === "media-text" || b.layout === "text-media") {
    const flip = b.layout === "text-media";
    return (
      <section className="mt-24 grid items-center gap-8 lg:grid-cols-12">
        {main && (
          <figure className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
            <Media work={main.w} onOpen={() => openWork(main.w)} image={main.s.image} aspect={main.s.aspect} sizes="(min-width: 1024px) 660px, 100vw" />
            <Caption slot={main.s} />
          </figure>
        )}
        <div className={`lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
          <Heading block={b} />
          <Text block={b} />
          {items.slice(1).map(({ w, s }) => (
            <figure key={w.id} className="mt-6">
              <Media work={w} onOpen={() => openWork(w)} sizes="(min-width: 1024px) 460px, 100vw" />
              <Caption slot={s} className="mt-2" />
            </figure>
          ))}
        </div>
      </section>
    );
  }

  if (b.layout === "duo" || b.layout === "gallery") {
    return (
      <section className="mt-24">
        <Heading block={b} />
        <div className="max-w-2xl">
          <Text block={b} />
        </div>
        <ul className={`mt-8 grid gap-6 sm:grid-cols-2 ${b.layout === "gallery" ? "lg:grid-cols-3" : ""}`}>
          {items.map(({ w, s }) => (
            <li key={w.id}>
              <figure>
                <Media work={w} onOpen={() => openWork(w)} image={s.image} aspect={s.aspect} sizes={b.layout === "gallery" ? "(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 560px, 100vw"} />
                <Caption slot={s} />
              </figure>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // full : un grand visuel sous le titre
  return (
    <section className="mt-24">
      <Heading block={b} />
      {main && (
        <figure className="mt-8">
          <Media work={main.w} onOpen={() => openWork(main.w)} image={main.s.image} aspect={main.s.aspect} sizes="(min-width: 1152px) 1152px, 100vw" />
          <Caption slot={main.s} />
        </figure>
      )}
    </section>
  );
}

// Une grande scène, et les noms des autres scènes en dessous pour passer de l'une à l'autre.
function ScenesBlock({ block: b, items, openWork }: { block: Block; items: { w: Work; s: Slot }[]; openWork: Ctx["openWork"] }) {
  const [current, setCurrent] = useState(0);
  const locale = useLocale();
  if (!items.length) return null;
  const active = items[Math.min(current, items.length - 1)];
  return (
    <section className="mt-24 grid items-end gap-8 lg:grid-cols-12">
      <div className="lg:col-span-4 lg:pb-12">
        <Heading block={b} />
        <Text block={b} />
      </div>
      <div className="lg:col-span-8">
        {/* key : relance l'aperçu vidéo au changement de scène */}
        <Media key={active.w.id} work={active.w} onOpen={() => openWork(active.w)} image={active.s.image} aspect={active.s.aspect} sizes="(min-width: 1024px) 760px, 100vw" />
        {items.length > 1 && (
          <div role="tablist" aria-label={t(locale, { fr: "Scènes", en: "Scenes" })} className="mt-3 flex flex-wrap justify-between gap-2">
            {items.map((s, i) => (
              <button
                key={s.w.id}
                type="button"
                role="tab"
                aria-selected={s === active}
                onClick={() => setCurrent(i)}
                className={`rounded-full px-3 py-1 text-sm transition ${s === active ? "bg-surface-2 font-semibold text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {say(s.s.caption, locale) || s.w.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
