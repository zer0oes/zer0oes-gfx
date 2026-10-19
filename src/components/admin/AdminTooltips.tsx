"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MARGIN = 8;
const DELAY = 350;
// Champs de formulaire exclus : leur title sert aussi au message de validation du navigateur
const SKIP = "input, select, textarea, iframe, option";

// Infobulles de l'admin harmonisées : chaque attribut title est affiché dans une bulle au style de l'admin
// (même fond, bordure et ombre que les bulles « ? » et celles des graphiques) au lieu de l'infobulle grise du navigateur.
// Le texte passe de title à data-admin-tip pour que le navigateur n'affiche pas la sienne en plus.
export function AdminTooltips() {
  const [tip, setTip] = useState<{ text: string; rect: DOMRect } | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: HTMLElement | null = null;
    const target = (node: EventTarget | null) => {
      const el = node instanceof Element ? node.closest<HTMLElement>("[title], [data-admin-tip]") : null;
      if (!el || el.matches(SKIP) || el instanceof SVGElement) return null;
      const title = el.getAttribute("title");
      if (title !== null) {
        el.removeAttribute("title");
        el.dataset.adminTip = title;
        // Bouton icône sans autre nom accessible : le texte de la bulle lui sert de nom
        if (!el.hasAttribute("aria-label") && !el.hasAttribute("aria-labelledby") && !el.textContent?.trim()) el.setAttribute("aria-label", title);
      }
      // data-tip-if-truncated : bulle seulement quand le texte est coupé (« … »)
      if (el.hasAttribute("data-tip-if-truncated") && el.scrollWidth <= el.clientWidth) return null;
      return el.dataset.adminTip ? el : null;
    };
    const hide = () => {
      clearTimeout(timer);
      current = null;
      setTip(null);
      setPos(null);
    };
    const show = (el: HTMLElement, delay: number) => {
      clearTimeout(timer);
      current = el;
      timer = setTimeout(() => {
        if (current === el && el.isConnected) setTip({ text: el.dataset.adminTip!, rect: el.getBoundingClientRect() });
      }, delay);
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = target(e.target);
      if (el === current) return;
      if (el) show(el, DELAY);
      else hide();
    };
    const focus = (e: FocusEvent) => {
      const el = target(e.target);
      if (el && (e.target as Element).matches(":focus-visible")) show(el, 0);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && hide();
    document.addEventListener("pointerover", over);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide);
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide);
      document.removeEventListener("keydown", key);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Au-dessus de l'élément s'il y a la place, sinon en dessous ; jamais coupée par le bord de l'écran
  useLayoutEffect(() => {
    if (!tip || !box.current) return;
    const { offsetWidth: w, offsetHeight: h } = box.current;
    const left = Math.max(MARGIN, Math.min(tip.rect.left + tip.rect.width / 2 - w / 2, window.innerWidth - MARGIN - w));
    const top = tip.rect.top - h - 6 > MARGIN ? tip.rect.top - h - 6 : tip.rect.bottom + 6;
    setPos({ left, top });
  }, [tip]);

  if (!tip) return null;
  return createPortal(
    <div ref={box} role="tooltip" style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
      className="pointer-events-none fixed z-[80] max-w-64 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-sans text-xs font-normal normal-case leading-snug tracking-normal text-foreground shadow-xl">
      {tip.text}
    </div>,
    document.body,
  );
}
