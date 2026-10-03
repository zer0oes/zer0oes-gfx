"use client";

import { useState } from "react";
import type { Work } from "@/data/portfolio";
import { Lightbox } from "./Lightbox";
import { WorkCard } from "./WorkCard";

// Grille de réalisations ; un clic ouvre la réalisation en grand.
export function WorkGrid({ works }: { works: Work[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((w, i) => (
          <WorkCard key={w.id} work={w} onOpen={() => setOpen(i)} />
        ))}
      </div>
      <Lightbox works={works} index={open} onClose={() => setOpen(null)} onNavigate={setOpen} />
    </>
  );
}
