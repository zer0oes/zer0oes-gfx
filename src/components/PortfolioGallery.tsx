"use client";

import { useState } from "react";
import { categories, streamers, works, type Category, type Streamer } from "@/data/portfolio";
import { Lightbox } from "./Lightbox";
import { WorkCard } from "./WorkCard";

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-4 py-2 text-sm transition ${
            value === o.id
              ? "border-accent bg-accent font-semibold text-background"
              : "border-border text-muted hover:border-accent/60 hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PortfolioGallery() {
  const [type, setType] = useState<Category | "all">("all");
  const [streamer, setStreamer] = useState<string>("all");

  const shownStreamers = streamers.filter((s) => streamer === "all" || s.id === streamer);
  const sections = shownStreamers
    .map((s) => ({
      streamer: s,
      groups: categories
        .filter((c) => type === "all" || c.id === type)
        .map((c) => ({ category: c, works: works.filter((w) => w.streamer === s.id && w.category === c.id) }))
        .filter((g) => g.works.length > 0),
    }))
    .filter((s) => s.groups.length > 0);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Chips
          label="Filtrer par type"
          options={[{ id: "all" as const, label: "Tout" }, ...categories]}
          value={type}
          onChange={setType}
        />
        {streamers.length > 1 && (
          <Chips
            label="Filtrer par streameur"
            options={[{ id: "all", label: "Tous les streameurs" }, ...streamers.map((s) => ({ id: s.id, label: s.name }))]}
            value={streamer}
            onChange={setStreamer}
          />
        )}
      </div>

      {sections.length === 0 && <p className="mt-12 text-center text-muted">Aucune réalisation pour ce filtre.</p>}

      {sections.map((s) => (
        <StreamerSection key={s.streamer.id} streamer={s.streamer} groups={s.groups} />
      ))}
    </>
  );
}

function StreamerSection({
  streamer,
  groups,
}: {
  streamer: Streamer;
  groups: { category: { id: Category; label: string }; works: typeof works }[];
}) {
  // La visionneuse parcourt toutes les réalisations affichées de ce streameur, dans l'ordre des types.
  const list = groups.flatMap((g) => g.works);
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mt-14" aria-labelledby={`streamer-${streamer.id}`}>
      <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id={`streamer-${streamer.id}`} className="font-display text-3xl font-bold">
            {streamer.name}
          </h2>
          <p className="mt-1 text-muted">{streamer.description}</p>
        </div>
        {streamer.url && (
          <a
            href={streamer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-sm text-accent hover:underline"
          >
            Voir la chaîne →
          </a>
        )}
      </header>

      {groups.map((g) => (
        <div key={g.category.id} className="mt-8">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-accent">{g.category.label}</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {g.works.map((w) => (
              <WorkCard key={w.id} work={w} showStreamer={false} onOpen={() => setOpen(list.indexOf(w))} />
            ))}
          </div>
        </div>
      ))}

      <Lightbox works={list} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </section>
  );
}
