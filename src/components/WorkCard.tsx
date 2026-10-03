import Image from "next/image";
import { categories, type Work } from "@/data/portfolio";

export function WorkCard({ work }: { work: Work }) {
  const category = categories.find((c) => c.id === work.category)?.label;
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1 hover:border-accent/60">
      <div className="relative aspect-video overflow-hidden">
        {work.image ? (
          <Image
            src={work.image}
            alt={work.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          // Vignette provisoire tant qu'aucun visuel n'est fourni
          <div
            className="flex h-full items-center justify-center transition duration-500 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${work.colors[0]}, ${work.colors[1]})` }}
            aria-hidden
          >
            <span className="font-display text-2xl font-bold text-white/90 drop-shadow">{work.title}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
          {category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold">{work.title}</h3>
        <p className="mt-1 text-sm text-muted">{work.description}</p>
        <p className="mt-3 text-xs text-muted/70">Pour {work.client}</p>
      </div>
    </article>
  );
}
