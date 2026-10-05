"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Animation des blocs des pages publiques (main.reveal-page) : chaque section,
// visuel (figure), encart, élément data-reveal ou bloc de texte d'un article (pages légales).
// - Au chargement, ce qui est à l'écran apparaît en fondu léger (pure CSS, voir globals.css :
//   pas de clignotement en attendant le JavaScript).
// - Au scroll, le reste glisse vers le haut en fondu quand il entre à l'écran.
// Sans JavaScript, tout reste affiché.
// Une section qui contient des blocs data-reveal n'est pas animée d'un bloc : ses blocs le sont
const SELECTOR = ".reveal-page :is(header, figure, aside, [data-reveal], section:not(:has([data-reveal])), article > *)";

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const all = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
    if (!all.length) return;
    // On n'anime que le bloc le plus extérieur (pas une section dans une section)
    const targets = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          // Éléments voisins qui apparaissent ensemble (cartes d'une grille) : léger décalage
          const siblings = entries.filter((e) => e.isIntersecting && e.target.parentElement === el.parentElement);
          el.style.animationDelay = `${Math.min(siblings.indexOf(entry), 4) * 90}ms`;
          el.classList.replace("reveal-wait", "reveal-in");
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight) continue; // déjà animé au chargement
      el.classList.add("reveal-wait");
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      // Rien ne doit rester caché si on quitte la page avant d'avoir tout vu
      document.querySelectorAll(".reveal-wait").forEach((el) => el.classList.remove("reveal-wait"));
    };
  }, [pathname]);

  return null;
}
