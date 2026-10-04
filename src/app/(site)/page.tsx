import Image from "next/image";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { HoverVideo } from "@/components/HoverVideo";
import { projectHref, type Work } from "@/data/portfolio";
import { site } from "@/data/site";
import { activePacks } from "@/lib/pricing";
import { ProtectedMedia } from "@/components/protection";
import { getStore } from "@/lib/store";

const kickerClass = "text-xs font-semibold uppercase tracking-[0.2em] text-accent";
const titleClass = "mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl";

// Grand visuel cliquable vers sa page projet (aperçu animé au survol s'il y en a un)
function Showcase({ work, href, sizes }: { work: Work; href: string; sizes: string }) {
  return (
    <Link href={href} data-hover-root className="group block overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <ProtectedMedia className="aspect-video">
        <Image src={work.image!} alt={work.title} fill draggable={false} sizes={sizes} className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        {work.video && <HoverVideo src={work.video} />}
      </ProtectedMedia>
    </Link>
  );
}

// Emplacements des emotes autour du visuel du hero (légèrement en dehors du cadre)
const emoteSpots = [
  "-left-6 -top-8 h-20 w-20 -rotate-12 sm:-left-10 sm:h-28 sm:w-28",
  "-right-4 -top-10 h-16 w-16 rotate-12 sm:h-24 sm:w-24",
  "-bottom-8 -left-4 h-16 w-16 rotate-6 sm:h-24 sm:w-24",
  "-bottom-10 right-10 h-20 w-20 -rotate-6 sm:h-28 sm:w-28",
];

const steps = (deliveryDays: string) => [
  { title: "Tu choisis", text: "Une offre prête à commander, ou une demande sur mesure." },
  { title: "Tu briefes", text: "Univers, couleurs, références et overlays choisis : un formulaire simple juste après la commande." },
  { title: "Je crée", text: `Premières maquettes, retours, ajustements. Livraison en ${deliveryDays} jours ouvrés.` },
  { title: "Tu streames", text: "Des visuels prêts à utiliser, avec fond transparent lorsque nécessaire." },
];

export default async function Home() {
  const store = getStore();
  const [catalog, { works, streamers }] = await Promise.all([store.getCatalog(), store.getPortfolio()]);
  const { settings } = catalog;
  const packs = activePacks(catalog.packs);
  const featured = works.filter((w) => w.featured);
  const streamerNames = Object.fromEntries(streamers.map((s) => [s.id, s.name]));
  // Visuel du hero : première réalisation mise en avant
  const hero = featured[0];
  const heroStreamer = hero && streamerNames[hero.streamer];
  // Facettes montrées sous l'ouverture, sans répéter le visuel du hero
  const byId = (id: string) => works.find((w) => w.id === id && w.image && w.id !== hero?.id);
  const emotes = (byId("zer0oes-emotes")?.emotes ?? []).slice(0, 12);
  // Quelques emotes qui débordent autour de la création du hero
  const allEmotes = works.find((w) => w.id === "zer0oes-emotes")?.emotes ?? [];
  const heroEmotes = ["HYPE", "LOVE", "ACOOL", "GG"].flatMap((n) => allEmotes.filter((e) => e.name === n)).slice(0, 4);
  const universe = byId("tomavega-starting-screen") ?? featured.find((w) => w.image && w.id !== hero?.id && w.streamer !== hero?.streamer);
  const signature = byId("zer0oes-logo");
  const portrait = byId("zer0oes-avatar");

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
            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tight sm:text-7xl xl:text-[5.5rem]">
              <span className="whitespace-nowrap">Ton stream.</span>
              <br />
              <span className="text-gradient whitespace-nowrap">Ton univers.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-md text-lg text-muted lg:mx-0">Identités visuelles sur mesure pour les créateurs de live.</p>
            <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row lg:items-center">
              <Link href="/portfolio" className="rounded-full bg-accent px-8 py-3.5 text-center font-semibold text-background transition hover:brightness-110">
                Découvrir les projets
              </Link>
              <Link href="/offres" className="text-sm text-muted underline-offset-4 transition hover:text-foreground hover:underline">
                Voir les offres →
              </Link>
            </div>
          </div>
          {hero?.image && (
            // Création en grand, décalée vers la droite, avec quelques emotes qui débordent autour
            <div className="relative lg:col-span-6 lg:-mr-6 xl:-mr-14">
              <Link href={projectHref(hero.streamer)} data-hover-root className="group relative block">
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
                      priority
                      sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                    {hero.video && <HoverVideo src={hero.video} />}
                  </ProtectedMedia>
                </div>
              </Link>
              {heroEmotes.map((e, i) => (
                <div
                  key={e.name}
                  aria-hidden
                  className={`pointer-events-none absolute drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] ${emoteSpots[i]}`}
                >
                  <Image src={e.src} alt="" width={128} height={128} draggable={false} unoptimized={e.animated} className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {emotes.length > 0 && (
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className={kickerClass}>Emotes</p>
              <h2 className={titleClass}>
                Toutes les émotions
                <br />
                du live.
              </h2>
              <Link href={projectHref("zer0oes", "emotes")} className="mt-4 inline-block text-sm text-accent hover:underline">
                Voir la planche complète →
              </Link>
            </div>
            <ProtectedMedia className="lg:col-span-8">
              <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {emotes.map((e) => (
                  <li key={e.name} className="relative aspect-square">
                    <Image src={e.src} alt={e.name} fill sizes="120px" draggable={false} unoptimized={e.animated} className="object-contain" />
                  </li>
                ))}
              </ul>
            </ProtectedMedia>
          </div>
        )}

        {universe && (
          <div className="mt-16 grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Showcase work={universe} href={projectHref(universe.streamer)} sizes="(min-width: 1024px) 660px, 100vw" />
            </div>
            <div className="lg:col-span-5">
              <p className={kickerClass}>Univers · {streamerNames[universe.streamer]}</p>
              <h2 className={titleClass}>
                Chaque chaîne,
                <br />
                son caractère.
              </h2>
              <p className="mt-4 text-muted">Du minéral électrique au néon synthwave : chaque identité part de la personne qui streame.</p>
              <Link href={projectHref(universe.streamer)} className="mt-4 inline-block text-sm text-accent hover:underline">
                Découvrir le projet →
              </Link>
            </div>
          </div>
        )}

        {signature && (
          <div className="mt-16 grid items-center gap-8 lg:grid-cols-12">
            <div className="order-2 lg:order-1 lg:col-span-5">
              <p className={kickerClass}>Logo · {streamerNames[signature.streamer]}</p>
              <h2 className={titleClass}>
                Un trait.
                <br />
                Toute une identité.
              </h2>
              <Link href="/portfolio" className="mt-4 inline-block text-sm text-accent hover:underline">
                Tout le portfolio →
              </Link>
            </div>
            <div className="order-1 lg:order-2 lg:col-span-7">
              <Showcase work={signature} href={projectHref(signature.streamer)} sizes="(min-width: 1024px) 660px, 100vw" />
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pt-36">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {portrait?.image && (
            <ProtectedMedia className="mx-auto w-56 overflow-hidden rounded-full sm:w-72 lg:col-span-4 lg:w-full">
              <Image src={portrait.image} alt="Aurore, alias zer0oes" width={640} height={640} draggable={false} sizes="(min-width: 1024px) 360px, 288px" className="aspect-square h-auto w-full object-cover" />
            </ProtectedMedia>
          )}
          <div className={portrait?.image ? "lg:col-span-7 lg:col-start-6" : "lg:col-span-8"}>
            <p className={kickerClass}>Derrière l&apos;écran</p>
            <h2 className={titleClass}>
              {site.about.title[0]}
              <br />
              <span className="text-accent">{site.about.title[1]}</span>
            </h2>
            {site.about.paragraphs.map((t) => (
              <p key={t} className="mt-4 text-lg text-muted">
                {t}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className={kickerClass}>Comment ça marche</p>
        <h2 className={titleClass}>De ton idée à ton premier live.</h2>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps(settings.deliveryDays).map((s, i) => (
            <li key={s.title} className="border-t border-border pt-5">
              <span className="font-display text-4xl font-bold text-gradient">0{i + 1}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={kickerClass}>Les offres</p>
            <h2 className={titleClass}>Trois façons de commencer.</h2>
          </div>
          <Link href="/offres" className="text-sm text-accent hover:underline">Options et détail des offres →</Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={settings} compact />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-surface-2 p-10 text-center">
          <h2 className="font-display text-3xl font-bold">Un projet plus spécifique ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Widget interactif, refonte complète, identité pour un événement : parlons-en et je te fais un devis.
          </p>
          <Link href="/contact" className="mt-8 inline-block rounded-full bg-foreground px-7 py-3 font-semibold text-background transition hover:brightness-90">
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  );
}
