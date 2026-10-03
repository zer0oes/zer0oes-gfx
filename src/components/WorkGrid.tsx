"use client";

import { useState } from "react";
import { projectHref, type Work } from "@/data/portfolio";
import { Lightbox } from "./Lightbox";
import { WorkCard } from "./WorkCard";

// Grille de réalisations ; un clic ouvre la réalisation en grand.
export function WorkGrid({
  works,
  showStreamer = true,
  linkToProject = false,
  streamerNames = {},
}: {
  works: Work[];
  // Nom affiché de chaque streameur (id → nom)
  streamerNames?: Record<string, string>;
  showStreamer?: boolean;
  // Si vrai, les cartes mènent à la page projet au lieu d'ouvrir la visionneuse
  linkToProject?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((w, i) => (
          <WorkCard
            key={w.id}
            work={w}
            showStreamer={showStreamer}
            streamerName={streamerNames[w.streamer]}
            href={linkToProject ? projectHref(w.streamer, w.category) : undefined}
            onOpen={linkToProject ? undefined : () => setOpen(i)}
          />
        ))}
      </div>
      <Lightbox works={works} streamerNames={streamerNames} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </>
  );
}
