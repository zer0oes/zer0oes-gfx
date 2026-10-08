"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GlossaryHint } from "@/lib/glossary";
import { useLocale } from "./I18nProvider";

const WIDTH = 256;
const MARGIN = 12;

// Bulle « ? » à côté d'un terme technique : s'ouvre au survol, au clavier ou au toucher, se ferme avec Échap.
// Bulle rendue dans <body> (portail), en position fixe calculée à l'ouverture : la bulle n'est jamais coupée par un tableau qui défile ni par le bord de l'écran.
export function Hint({ hint }: { hint?: GlossaryHint }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null);
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLSpanElement>(null);
  const locale = useLocale();

  useLayoutEffect(() => {
    if (!open || !button.current) return;
    const place = () => {
      const r = button.current!.getBoundingClientRect();
      // Bouton masqué (onglet changé) : la bulle se ferme
      if (!r.width) return setOpen(false);
      const width = Math.min(WIDTH, window.innerWidth - 2 * MARGIN);
      const left = Math.max(MARGIN, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - MARGIN - width));
      const height = box.current?.offsetHeight ?? 120;
      const above = r.top - height - 8 > MARGIN;
      setPos({ left, top: above ? r.top - 8 : r.bottom + 8, above });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [open]);

  if (!hint) return null;
  return (
    <span
      ref={root}
      className="ml-1.5 inline-flex align-middle"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
    >
      <button
        ref={button}
        type="button"
        aria-label={locale === "en" ? `What is: ${hint.term}?` : `C'est quoi : ${hint.term} ?`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex size-[18px] shrink-0 cursor-help items-center justify-center rounded-full border border-border text-[11px] font-bold leading-none text-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-expanded:border-accent aria-expanded:text-accent"
      >
        ?
      </button>
      {open && createPortal(
        <span
          ref={box}
          id={id}
          role="tooltip"
          style={{
            left: pos?.left ?? 0,
            top: pos?.top ?? 0,
            width: `min(${WIDTH}px, calc(100vw - ${2 * MARGIN}px))`,
            transform: pos?.above === false ? undefined : "translateY(-100%)",
            visibility: pos ? "visible" : "hidden",
          }}
          className="fixed z-[70] rounded-xl font-sans border border-border bg-surface-2 p-3 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-foreground shadow-xl"
        >
          <span className="mb-1 block font-semibold text-accent">{hint.term}</span>
          {hint.text}
        </span>,
        document.body,
      )}
    </span>
  );
}
