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
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Logo · Overlays · Emotes</p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl xl:text-7xl">
              Un stream qui <span className="text-gradient">te ressemble</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted lg:mx-0">{site.description}</p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/offres" className="rounded-full bg-accent px-7 py-3 text-center font-semibold text-background transition hover:brightness-110">
                Voir les offres
              </Link>
              <Link href="/portfolio" className="rounded-full border border-border bg-background/40 px-7 py-3 text-center font-semibold transition hover:border-accent">
                Découvrir le portfolio
              </Link>
            </div>
          </div>
          {hero?.image && (
            <Link href="/portfolio" className="group relative block">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-3xl opacity-60 blur-2xl transition group-hover:opacity-80"
                style={{ background: "linear-gradient(135deg, var(--accent-3), var(--accent), var(--accent-2))" }}
              />
              <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
                <ProtectedMedia>
                <Image
                  draggable={false}
                  src={hero.image}
                  alt={`${hero.title} — ${heroStreamer}`}
                  width={1600}
                  height={900}
                  priority
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="h-auto w-full"
                />
                </ProtectedMedia>
              </div>
              <p className="relative mt-3 text-center text-xs text-muted lg:text-right">
                {hero.title} · {heroStreamer}
              </p>
            </Link>
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
          <div className="mt-24 grid items-center gap-8 lg:grid-cols-12">
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
          <div className="mt-24 grid items-center gap-8 lg:grid-cols-12">
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

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">Les offres</h2>
          <Link href="/offres" className="text-sm text-accent hover:underline">Détail des offres →</Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {packs.map((p) => (
            <PackCard key={p.id} pack={p} settings={settings} />
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
