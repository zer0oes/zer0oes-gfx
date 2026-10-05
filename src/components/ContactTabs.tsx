"use client";

import Link from "next/link";
import { useState } from "react";

// Contenu qui change avec l'onglet : il glisse vers la droite en allant sur « Message simple »
// (onglet de droite), vers la gauche en revenant sur « Projet sur-mesure ». Pas d'animation
// au premier affichage de la page.
export function TabSlide({ tab, children }: { tab: string; children: React.ReactNode }) {
  const [last, setLast] = useState(tab);
  const [moved, setMoved] = useState(false);
  if (last !== tab) {
    setLast(tab);
    setMoved(true);
  }
  return (
    <div className="overflow-x-clip">
      <div key={tab} className={moved ? (tab === "message" ? "slide-from-left" : "slide-from-right") : undefined}>
        {children}
      </div>
    </div>
  );
}

// Sélecteur d'onglets de /contact : la pastille violette glisse vers l'onglet choisi
// dès le clic, sans attendre le chargement du formulaire
export function ContactTabs({ tabs, active }: { tabs: readonly { id: string; label: string; href: string }[]; active: string }) {
  const [chosen, setChosen] = useState(active);
  const [synced, setSynced] = useState(active);
  if (synced !== active) {
    // Navigation arrière / avant du navigateur : on suit l'onglet affiché
    setSynced(active);
    setChosen(active);
  }
  const index = Math.max(0, tabs.findIndex((t) => t.id === chosen));

  return (
    <nav aria-label="Type de demande" className="relative mb-4 inline-grid grid-cols-2 rounded-full border border-border bg-surface p-1">
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-accent transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          scroll={false}
          onClick={() => setChosen(t.id)}
          aria-current={active === t.id ? "page" : undefined}
          className={`relative whitespace-nowrap rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors duration-300 sm:px-5 ${
            chosen === t.id ? "text-background" : "text-muted hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
