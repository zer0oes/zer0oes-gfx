"use client";

import { useState } from "react";
import { categories, works, type Category } from "@/data/portfolio";
import { WorkCard } from "./WorkCard";

export function PortfolioGallery() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const shown = filter === "all" ? works : works.filter((w) => w.category === filter);
  const options = [{ id: "all" as const, label: "Tout" }, ...categories];

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les réalisations">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={filter === o.id}
            onClick={() => setFilter(o.id)}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              filter === o.id
                ? "border-accent bg-accent text-background font-semibold"
                : "border-border text-muted hover:border-accent/60 hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((w) => (
          <WorkCard key={w.id} work={w} />
        ))}
      </div>
    </>
  );
}
