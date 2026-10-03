import Image from "next/image";
import Link from "next/link";
import { PackCard } from "@/components/PackCard";
import { WorkGrid } from "@/components/WorkGrid";
import { packs } from "@/data/packs";
import { getStreamer, works } from "@/data/portfolio";
import { site } from "@/data/site";

const steps = [
  { title: "Vous choisissez", text: "Une offre prête à commander, ou une demande sur mesure." },
  { title: "Vous briefez", text: "Univers, couleurs, références et overlays choisis : un formulaire simple juste après la commande." },
  { title: "Je crée", text: `Premières maquettes, retours, ajustements. Livraison en ${site.deliveryDays} jours ouvrés.` },
  { title: "Vous streamez", text: "Des visuels prêts à utiliser, avec fond transparent lorsque nécessaire." },
];

export default function Home() {
  const featured = works.filter((w) => w.featured);
  // Visuel du hero : première réalisation mise en avant
  const hero = featured[0];
  const heroStreamer = hero && getStreamer(hero.streamer)?.name;

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
              Un stream qui <span className="text-gradient">vous ressemble</span>
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
                <Image
                  src={hero.image}
                  alt={`${hero.title} — ${heroStreamer}`}
                  width={1600}
                  height={900}
                  priority
                  sizes="(min-width: 1024px) 560px, 100vw"
                  className="h-auto w-full"
                />
              </div>
              <p className="relative mt-3 text-center text-xs text-muted lg:text-right">
                {hero.title} · {heroStreamer}
              </p>
            </Link>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-bold">Réalisations phares</h2>
          <Link href="/portfolio" className="text-sm text-accent hover:underline">Tout voir →</Link>
        </div>
        <div className="mt-8">
          <WorkGrid works={featured} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-bold">Comment ça marche</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-surface p-6">
              <span className="font-display text-3xl font-bold text-gradient">0{i + 1}</span>
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
            <PackCard key={p.id} pack={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-surface-2 p-10 text-center">
          <h2 className="font-display text-3xl font-bold">Un projet plus spécifique ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Widget interactif, refonte complète, identité pour un événement : parlons-en et je vous fais un devis.
          </p>
          <Link href="/contact" className="mt-8 inline-block rounded-full bg-foreground px-7 py-3 font-semibold text-background transition hover:brightness-90">
            Demander un devis
          </Link>
        </div>
      </section>
    </>
  );
}
