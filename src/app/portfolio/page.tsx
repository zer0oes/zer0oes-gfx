import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HoverVideo } from "@/components/HoverVideo";
import { PageHeader } from "@/components/ui";
import { categories, projectHref, streamers, works } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Les projets réalisés pour des streameurs : overlays, widgets, alertes et emotes.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Projets">
        Un projet par streameur : ouvre-le pour voir ses overlays, widgets, alertes et emotes.
      </PageHeader>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
        {streamers.map((s) => {
          const own = works.filter((w) => w.streamer === s.id);
          const cover = own.find((w) => w.category === "overlays") ?? own[0];
          const counts = categories
            .map((c) => {
              const items = own.filter((w) => w.category === c.id);
              // Pour les emotes, on compte les emotes de la planche plutôt que les planches
              const n = c.id === "emotes" ? items.reduce((sum, w) => sum + (w.emotes?.length ?? 1), 0) : items.length;
              const label = c.label.toLowerCase();
              return { ...c, n, label: n > 1 ? label : label.replace(/s$/, "") };
            })
            .filter((c) => c.n > 0);
          return (
            <Link
              key={s.id}
              href={projectHref(s.id)}
              data-hover-root
              className="group overflow-hidden rounded-3xl border border-border bg-surface transition hover:-translate-y-1 hover:border-accent/60 focus-visible:border-accent focus-visible:outline-none"
            >
              <div className="relative aspect-video overflow-hidden bg-background">
                {cover?.image && (
                  <Image
                    src={cover.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                {cover?.video && <HoverVideo src={cover.video} />}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-display text-2xl font-bold">{s.name}</h2>
                  <span className="text-sm text-accent transition group-hover:translate-x-1" aria-hidden>
                    Voir le projet →
                  </span>
                </div>
                <p className="mt-2 text-muted">{s.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Contenu du projet">
                  {counts.map((c) => (
                    <li key={c.id} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                      {c.n} {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
