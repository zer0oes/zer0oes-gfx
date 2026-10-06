import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/data/site";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { TestimonialQuote, testimonialImage } from "@/components/TestimonialQuote";
import { HoverVideo } from "@/components/HoverVideo";
import { projectHref, type Work } from "@/data/portfolio";
import { resolveHome } from "@/lib/home-content";
import { activePacks } from "@/lib/pricing";
import { ProtectedMedia } from "@/components/protection";
import { getStore } from "@/lib/store";
import { mediaUrl } from "@/lib/media";
import { asLocale, href, t } from "@/lib/i18n";
import { trDeep } from "@/lib/translations-en";

// Rendu à la demande : éviter de servir une page 404 précompilée sur Heroku.
export const dynamic = "force-dynamic";

const kickerClass = "text-xs font-semibold uppercase tracking-[0.2em] text-accent";
const titleClass = "mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl";

// Grand visuel cliquable vers sa page projet (aperçu animé au survol s'il y en a un)
function Showcase({ work, href, sizes }: { work: Work; href: string; sizes: string }) {
  return (
    <Link href={href} data-hover-root className="group block overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <ProtectedMedia className="aspect-video">
        <Image src={work.image!} alt={work.title} fill draggable={false} sizes={sizes} className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        {work.video && <HoverVideo src={work.video} autoPlayOnTouch={false} />}
      </ProtectedMedia>
    </Link>
  );
}

// Titre sur plusieurs lignes (une ligne par retour à la ligne saisi dans l'admin)
function Lines({ lines }: { lines: string[] }) {
  return lines.map((l, i) => (
    <span key={i}>
      {i > 0 && <br />}
      {l}
    </span>
  ));
}

// Taille du grand titre : réduite quand une ligne dépasse 12 caractères, pour ne jamais passer sous le visuel
function heroTitleSize(...lines: string[]) {
  const longest = Math.max(...lines.map((l) => l.length));
  if (longest <= 12) return "text-6xl sm:text-7xl xl:text-[5.5rem]";
  if (longest <= 15) return "text-5xl sm:text-6xl xl:text-[4.5rem]";
  return "text-4xl sm:text-5xl xl:text-6xl";
}

// Emplacements des emotes autour du visuel du hero (légèrement en dehors du cadre),
// de tailles différentes ; elles surgissent une à une après le bandeau
const emoteSpots = [
  "-left-5 -top-6 h-14 w-14 -rotate-12 sm:-left-8 sm:h-20 sm:w-20",
  "-right-3 -top-5 h-9 w-9 rotate-12 sm:h-12 sm:w-12",
  "-bottom-5 -left-3 h-12 w-12 rotate-6 sm:h-16 sm:w-16",
  "-bottom-8 right-10 h-16 w-16 -rotate-6 sm:h-24 sm:w-24",
];

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const meta = pageMetadata(lang, "/", {
    fr: { description: site.description },
    en: {
      description: "Custom logo, overlays, banner, avatar and emotes for Twitch, YouTube and Kick. A stream identity that looks like you.",
    },
  });
  return lang === "en" ? { ...meta, title: { absolute: `${site.name} — Custom visual identities and stream overlays` } } : meta;
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const lang = asLocale((await params).lang);
  const to = (path: string) => href(lang, path);
  const store = getStore();
  const [catalog, portfolio, stored, testimonials] = await Promise.all([
    store.getCatalog(),
    store.getPortfolio(),
    store.getHomeContent(),
    store.listTestimonials(),
  ]);
  const { works, streamers } = trDeep(lang, portfolio);
  // Textes et visuels choisis dans l'admin (Admin > Accueil), sinon contenu d'origine
  const c = resolveHome(stored, lang);
  // Visuel choisi : « - » masque la partie, vide = choix automatique
  const pick = (key: string) => {
    const id = c.text(key);
    return id === "-" ? null : id;
  };
  const { settings } = trDeep(lang, catalog);
  const packs = activePacks(catalog.packs);
  const featured = works.filter((w) => w.featured);
  const streamerNames = Object.fromEntries(streamers.map((s) => [s.id, s.name]));
  // Visuel du hero : celui choisi, sinon première réalisation mise en avant
  const hero = works.find((w) => w.id === pick("hero.work") && w.image) ?? featured[0];
  const heroStreamer = hero && streamerNames[hero.streamer];
  // Facettes montrées sous l'ouverture, sans répéter le visuel du hero
  const byId = (id: string | null) => works.find((w) => w.id === id && w.image && w.id !== hero?.id);
  const emoteWork = works.find((w) => w.id === pick("emotes.work") && w.emotes?.length);
  const emotes = (emoteWork?.emotes ?? []).slice(0, 12);
  // Quelques emotes qui débordent autour de la création du hero
  const originalEmoteWork = portfolio.works.find((work) => work.id === emoteWork?.id) ?? portfolio.works.find((work) => work.emotes?.length);
  const allEmotes = originalEmoteWork?.emotes ?? [];
  const heroEmotes = c
    .text("hero.emotes")
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .flatMap((n) => allEmotes.filter((e) => e.name.toLowerCase() === n))
    .slice(0, 4)
    .map((emote) => trDeep(lang, emote));
  const universeId = pick("universe.work");
  const universe =
    universeId === null ? undefined : (byId(universeId) ?? featured.find((w) => w.image && w.id !== hero?.id && w.streamer !== hero?.streamer));


  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(40% 50% at 20% 30%, var(--accent-3), transparent), radial-gradient(40% 50% at 80% 20%, var(--accent-2), transparent), radial-gradient(50% 50% at 50% 90%, var(--accent), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-10">
          <div className="text-center lg:col-span-6 lg:text-left">
            {/* Taille adaptée à la longueur du titre (ex. « Your universe. », plus long que « Ton univers. ») */}
            <h1 className={`relative z-10 font-display font-bold leading-[0.95] tracking-tight ${heroTitleSize(c.text("hero.title1"), c.text("hero.title2"))}`}>
              <span className="whitespace-nowrap">{c.text("hero.title1")}</span>
              <br />
              <span className="text-gradient whitespace-nowrap">{c.text("hero.title2")}</span>
            </h1>
            <p className="mx-auto mt-8 max-w-md text-lg text-muted lg:mx-0">{c.text("hero.text")}</p>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row lg:items-center">
              <Link href={to("/portfolio")} className="rounded-full bg-accent px-8 py-3.5 text-center font-semibold text-background transition hover:brightness-110">
                {c.text("hero.cta")}
              </Link>
              <Link href={to("/offres")} className="text-sm text-muted underline-offset-4 transition hover:text-foreground hover:underline">
                {c.text("hero.link")}
              </Link>
            </div>
          </div>
          {hero?.image && (
            // Création en grand, décalée vers la droite, avec quelques emotes qui débordent autour
            <div className="relative lg:col-span-6 lg:-mr-6 xl:-mr-14">
              <Link href={to(projectHref(hero.streamer))} data-hover-root className="group relative block">
                <div
                  aria-hidden
                  className="absolute -inset-4 rounded-3xl opacity-50 blur-2xl transition group-hover:opacity-70"
                  style={{ background: "linear-gradient(135deg, var(--accent-3), var(--accent), var(--accent-2))" }}
                />
                <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
                  <ProtectedMedia className="aspect-video">
                    <Image
                      draggable={false}
                      src={hero.image}
                      alt={`${hero.title} — ${heroStreamer}`}
                      fill
                      preload
                      sizes="(min-width: 1280px) 606px, (min-width: 1024px) 50vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
                      className="object-cover"
                    />
                    {hero.video && <HoverVideo src={hero.video} autoPlayOnTouch={false} />}
                  </ProtectedMedia>
                </div>
              </Link>
              {heroEmotes.map((e, i) => (
                <div
                  key={e.name}
                  aria-hidden
                  className={`emote-pop pointer-events-none absolute drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${emoteSpots[i]}`}
                  style={{ animationDelay: `${450 + i * 120}ms` }}
                >
                  <Image src={e.src} alt="" width={128} height={128} sizes="(min-width: 640px) 96px, 64px" draggable={false} unoptimized={e.animated} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Un projet distinct, puis une planche expressive avant les témoignages. */}
        {universe && (
          <div data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties} className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Showcase work={universe} href={to(projectHref(universe.streamer))} sizes="(min-width: 1152px) 644px, (min-width: 1024px) 58vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)" />
            </div>
            <div className="lg:col-span-5">
              <p className={kickerClass}>
                {c.text("universe.kicker")} · {streamerNames[universe.streamer]}
              </p>
              <h2 className={titleClass}>
                <Lines lines={c.lines("universe.title")} />
              </h2>
              <p className="mt-4 text-muted">{c.text("universe.text")}</p>
              <Link href={to(projectHref(universe.streamer))} className="mt-4 inline-block text-sm text-accent hover:underline">
                {c.text("universe.link")}
              </Link>

            </div>
          </div>
        )}

        {emoteWork && emotes.length > 0 && (
          <div data-reveal style={{ "--reveal-delay": "150ms" } as React.CSSProperties} className="mt-10 grid items-center gap-5 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5">
              <p className={kickerClass}>{c.text("emotes.kicker")}</p>
              <h2 className={`${titleClass} lg:text-3xl xl:text-4xl`}>
                <Lines lines={c.lines("emotes.title")} />
              </h2>
              <Link href={to(projectHref(emoteWork.streamer, "emotes"))} className="mt-4 inline-block text-sm text-accent hover:underline">
                {c.text("emotes.link")}
              </Link>
            </div>
            <ProtectedMedia className="lg:col-span-7">
              <ul className="grid w-full grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
                {emotes.map((e) => (
                  <li key={e.name} className="relative aspect-square">
                    <Image src={e.src} alt={e.name} fill sizes="(min-width: 1152px) 76px, (min-width: 1024px) 7vw, (min-width: 640px) 12vw, 19vw" draggable={false} unoptimized={e.animated} className="scale-80 object-contain" />
                  </li>
                ))}
              </ul>
            </ProtectedMedia>
          </div>
        )}

      </section>

      {/* Avis clients choisis pour l'accueil (publiés avec l'accord du client), les cinq plus récents en priorité */}
      {(() => {
        const reviews = testimonials
          .filter((review) => review.consent && review.onHome)
          .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
          .flatMap((r) => {
            const s = streamers.find((streamer) => streamer.id === r.streamerId);
            return s ? [{ r, s }] : [];
          })
          .slice(0, 5);

        if (!reviews.length) return null;

        return (
          <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="home-reviews-title">
            <p className={`${kickerClass} text-center`}>{c.text("reviews.kicker")}</p>
            <h2 id="home-reviews-title" className={`${titleClass} text-center`}>{c.text("reviews.title")}</h2>
            <div className="mt-6">
              <ReviewsCarousel>
                {reviews.map(({ r, s }) => (
                  <TestimonialQuote key={s.id} testimonial={r} locale={lang} href={to(projectHref(s.id))} projectName={s.name} image={testimonialImage(works, s.id)} />
                ))}

              </ReviewsCarousel>
            </div>
          </section>
        );
      })()}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={kickerClass}>{c.text("offers.kicker")}</p>
            <h2 className={titleClass}>{c.text("offers.title")}</h2>
          </div>
          <Link href={to("/offres")} className="text-sm text-accent hover:underline">
            {c.text("offers.link")}
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={settings} compact locale={lang} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Portrait cerclé de blanc, sur un halo violet */}
          <div className="relative mx-auto w-44 sm:w-52 lg:col-span-4 lg:w-56">
            <div
              aria-hidden
              className="absolute -inset-14 rounded-full blur-xl"
              style={{ background: "radial-gradient(circle, rgba(219,39,160,0.95) 0%, rgba(124,58,237,0.85) 45%, rgba(76,29,149,0.5) 62%, transparent 72%)" }}
            />
            <ProtectedMedia className="relative overflow-hidden rounded-full border-[3px] border-white/90 shadow-[0_0_24px_rgba(255,255,255,0.25)]">
              <Image src={mediaUrl("/a-propos/zer0oes-avatar.webp")} alt={t(lang, { fr: "Aurore, alias zer0oes", en: "Aurore, aka zer0oes" })} width={500} height={500} draggable={false} sizes="(min-width: 640px) 224px, 176px" className="aspect-square h-auto w-full object-cover" />
            </ProtectedMedia>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className={kickerClass}>{c.text("about.kicker")}</p>
            <h2 className={titleClass}>
              {c.text("about.title1")}
              <br />
              <span className="text-accent">{c.text("about.title2")}</span>
            </h2>
            {c.lines("about.paragraphs").map((t) => (
              <p key={t} className="mt-4 text-lg text-muted">
                {t}
              </p>
            ))}
            <Link href={to("/a-propos")} className="mt-6 inline-block text-sm text-accent hover:underline">
              {t(lang, { fr: "En savoir plus sur moi →", en: "More about me →" })}
            </Link>
          </div>
        </div>

      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className={kickerClass}>{c.text("steps.kicker")}</p>
        <h2 className={titleClass}>{c.text("steps.title")}</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} className="border-t border-border pt-5">
              <span className="font-display text-4xl font-bold text-gradient">0{n}</span>
              <h3 className="mt-3 font-semibold">{c.text(`steps.s${n}title`)}</h3>
              <p className="mt-1 text-sm text-muted">{c.text(`steps.s${n}text`).replaceAll("{delai}", lang === "en" ? settings.deliveryDays.replace(" à ", " to ") : settings.deliveryDays)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-surface-2 p-10 text-center">
          <h2 className="font-display text-3xl font-bold">{c.text("custom.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{c.text("custom.text")}</p>
          <Link href={to("/contact")} className="mt-8 inline-block rounded-full bg-foreground px-7 py-3 font-semibold text-background transition hover:brightness-90">
            {c.text("custom.button")}
          </Link>
        </div>
      </section>
    </>
  );
}
