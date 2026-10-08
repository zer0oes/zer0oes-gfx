"use client";

import { useEffect } from "react";

export function DisclosureAnimations() {
  useEffect(() => {
    const active = new Map<HTMLDetailsElement, { animation: Animation; opening: boolean; height: string; overflow: string }>();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || motion.matches || !(event.target instanceof Element)) return;
      const summary = event.target.closest("summary");
      if (!summary || event.target.closest("a, button, input, select, textarea")) return;
      const details = summary.parentElement;
      if (!(details instanceof HTMLDetailsElement) || typeof details.animate !== "function") return;
      event.preventDefault();
      const previous = active.get(details);
      const opening = previous ? !previous.opening : !details.open;
      const start = details.getBoundingClientRect().height;
      const height = previous?.height ?? details.style.height;
      const overflow = previous?.overflow ?? details.style.overflow;
      previous?.animation.cancel();
      details.style.height = height;
      details.style.overflow = overflow;
      // Measure both native states so padding, borders and nested content count.
      details.open = opening;
      const end = details.getBoundingClientRect().height;
      details.open = true;
      details.style.overflow = "clip";
      const animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
        duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both",
      });
      active.set(details, { animation, opening, height, overflow });
      animation.onfinish = () => {
        if (active.get(details)?.animation !== animation) return;
        details.open = opening;
        animation.cancel();
        details.style.height = height;
        details.style.overflow = overflow;
        active.delete(details);
      };
    };
    document.addEventListener("click", click);
    return () => {
      document.removeEventListener("click", click);
      for (const [details, state] of active) {
        state.animation.cancel();
        details.open = state.opening;
        details.style.height = state.height;
        details.style.overflow = state.overflow;
      }
    };
  }, []);
  return null;
}
