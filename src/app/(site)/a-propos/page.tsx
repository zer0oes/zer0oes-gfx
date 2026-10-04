import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { mediaUrl } from "@/lib/media";

export const metadata: Metadata = {
  title: "À propos",
  description: "Aurore, Graphic & Web Designer : identités visuelles, overlays, emotes et animations pour streamers et créateurs de contenu.",
};

// Petit détail graphique propre à chaque chapitre (décoratif)
function Pixels() {
  const on = [1, 1, 0, 1, 0, 1, 1, 1, 0];
  const colors = ["var(--accent-3)", "var(--accent)", "var(--accent-2)"];
  return (
    <div className="grid w-16 grid-cols-3 gap-1.5" aria-hidden>
      {on.map((v, i) => (
        <span key={i} className="aspect-square rounded-[3px]" style={{ background: v ? colors[i % 3] : "transparent", border: v ? undefined : "1px solid var(--border)" }} />
      ))}
    </div>
  );
}

function WebToLive() {
  return (
    <div className="flex items-center gap-2 font-mono text-sm" aria-hidden>
      <span className="rounded-md border border-border px-2 py-1 text-accent-2">&lt;/&gt;</span>
      <span className="h-px w-8 bg-gradient-to-r from-accent-2 to-accent-3" />
      <span className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs font-semibold tracking-wider">
        <span className="size-2 animate-pulse rounded-full bg-red-500" />
        REC
      </span>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-bold tracking-wider text-background">LIVE</span>
      <span className="text-2xl text-accent-3">✦</span>
      <span className="text-sm text-accent-2">✦</span>
    </div>
  );
}

function NoCopyPaste() {
  return (
    <div className="relative inline-flex items-center rounded-md border border-dashed border-border px-3 py-1.5 font-mono text-xs text-muted" aria-hidden>
      Ctrl+C / Ctrl+V
      <span className="absolute inset-x-1 top-1/2 h-0.5 -rotate-6 rounded-full bg-accent-3" />
    </div>
  );
}

function Rings() {
  return (
    <div className="relative size-16" aria-hidden>
      <span className="absolute inset-0 rounded-full border-2 border-accent/30" />
      <span className="absolute inset-2.5 rounded-full border-2 border-accent/60" />
      <span className="absolute inset-5 rounded-full bg-accent shadow-[0_0_24px_var(--accent)]" />
    </div>
  );
}

const chapters = [
  {
    title: "Moi, en quelques pixels",
    text: "Je suis Aurore, Graphic & Web Designer, passionnée par les univers visuels forts, cohérents et pensés pour vivre vraiment à l’écran.",
    Detail: Pixels,
  },
  {
    title: "Du web au broadcast",
    text: "Mon parcours mêle design graphique, développement front-end, web et broadcast. J’aime autant réfléchir à l’esthétique qu’à la manière dont une création va être utilisée.",
    Detail: WebToLive,
  },
  {
    title: "Aujourd’hui, je crée pour les créateurs",
    text: "J’accompagne principalement les streamers, créateurs de contenu et projets gaming avec des identités visuelles, overlays, interfaces, emotes et animations.",
    Detail: LiveBadge,
  },
  {
    title: "Pas de recette toute faite",
    text: "Chaque projet commence par ton univers, tes références et ce que tu veux raconter. Pas de style plaqué ni de formule copiée-collée.",
    Detail: NoCopyPaste,
  },
  {
    title: "Une identité qui reste en tête",
    text: "Mon objectif : créer quelque chose de reconnaissable, cohérent et suffisamment fort pour qu’on sache que c’est toi avant même de lire ton pseudo.",
    Detail: Rings,
  },
];

export default function AboutPage() {

  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-30 blur-3xl"
        style={{ background: "radial-gradient(40% 50% at 25% 30%, var(--accent-3), transparent), radial-gradient(40% 50% at 75% 20%, var(--accent-2), transparent)" }}
      />
      <div className="relative mx-auto max-w-5xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">À propos</p>

        <ol className="mt-10">
          {chapters.map(({ title, text, Detail }, i) => (
            <li key={title} className={`border-t border-border/60 py-14 first:border-t-0 first:pt-0 sm:py-20 ${i === 0 ? "" : i % 2 ? "md:pl-[16%]" : "md:pr-[16%]"}`}>
              <div className="grid items-start gap-6 md:grid-cols-[9rem_1fr] md:gap-10">
                <div className="flex items-center gap-5 md:flex-col md:items-start">
                  <span className="font-display text-5xl font-bold text-gradient">0{i + 1}</span>
                  <Detail />
                </div>
                <div className={i === 0 ? "grid items-center gap-10 sm:grid-cols-[1fr_auto]" : ""}>
                  <div>
                    <h2 className={`font-display font-bold leading-tight tracking-tight ${i === 0 ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl"}`}>{title}</h2>
                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{text}</p>
                  </div>
                  {i === 0 && (
                    <figure className="relative w-56 sm:w-60">
                      <div aria-hidden className="absolute -inset-3 rounded-[2rem] opacity-50 blur-2xl" style={{ background: "linear-gradient(135deg, var(--accent-3), var(--accent), var(--accent-2))" }} />
                      <Image
                        src={mediaUrl("/a-propos/aurore.webp")}
                        alt="Aurore, alias zer0oes, à son poste de stream"
                        width={800}
                        height={1000}
                        priority
                        sizes="240px"
                        className="relative aspect-[4/5] rounded-3xl border border-border object-cover"
                      />
                      <figcaption className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 text-xs font-semibold backdrop-blur">
                        <span className="size-2 rounded-full bg-red-500" aria-hidden />
                        En live
                      </figcaption>
                    </figure>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-col items-start gap-4 rounded-3xl border border-border bg-surface p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold">On crée ton univers ?</h2>
            <p className="mt-1 text-muted">Raconte-moi ta chaîne, je te réponds sous 48 h ouvrées.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/contact" className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110">
              Parlons de ton projet
            </Link>
            <Link href="/portfolio" className="text-sm text-muted hover:text-foreground">
              Voir le portfolio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
