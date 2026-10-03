"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultProtection, type ProtectionSettings } from "@/lib/protection";

// Mesures dissuasives sur les médias du portfolio. Rien n'empêche totalement une
// capture d'écran : le but est de décourager la récupération des fichiers et de
// signer chaque visuel (filigrane).

const ProtectionContext = createContext<ProtectionSettings>(defaultProtection);

export function ProtectionProvider({ value, children }: { value: ProtectionSettings; children: React.ReactNode }) {
  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}

const mark = (opacity: number, size: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size * 2.6}' height='${size * 1.6}'><text x='50%' y='55%' text-anchor='middle' font-family='Arial,sans-serif' font-weight='700' font-size='${size / 4.2}' fill='white' fill-opacity='${opacity}' transform='rotate(-24 ${size * 1.3} ${size * 0.8})'>zer0oes gfx</text></svg>`,
  )}")`;

function Watermark() {
  const { watermark } = useContext(ProtectionContext);
  if (watermark === "off") return null;
  if (watermark === "mosaique") {
    return <span aria-hidden className="pointer-events-none absolute inset-0 z-[2]" style={{ backgroundImage: mark(0.16, 120) }} />;
  }
  if (watermark === "visible") {
    return (
      <span aria-hidden className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
        <span className="select-none font-display text-[clamp(1rem,6cqw,3.5rem)] font-bold text-white/30 [text-shadow:0_1px_6px_rgb(0_0_0/0.5)]">
          zer0oes gfx
        </span>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-2 right-3 z-[2] select-none font-display text-xs font-bold text-white/45 [text-shadow:0_1px_3px_rgb(0_0_0/0.6)] sm:text-sm"
    >
      zer0oes gfx
    </span>
  );
}

// Enveloppe d'un média : calque transparent au-dessus (clic droit / glisser /
// appui long sans effet sur le fichier), filigrane, et cible du flou de protection.
export function ProtectedMedia({
  children,
  className = "",
  watermark = true,
}: {
  children: React.ReactNode;
  className?: string;
  watermark?: boolean;
}) {
  return (
    <div
      className={`protected-media ${className.split(" ").some((c) => c === "absolute" || c === "fixed") ? "" : "relative"} select-none [container-type:inline-size] [-webkit-touch-callout:none] ${className}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {children}
      {watermark && <Watermark />}
      {/* Calque transparent : c'est lui qui reçoit le clic droit ou l'appui long, pas l'image */}
      <span aria-hidden className="absolute inset-0 z-[1]" />
    </div>
  );
}

// Flou de protection : la fenêtre perd le focus, la souris la quitte, ou une
// touche de capture d'écran est détectée. Uniquement sur les pages portfolio.
export function ScreenShield() {
  const { blur } = useContext(ProtectionContext);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!blur) return;
    const root = document.documentElement;
    const resumable = new Set<HTMLVideoElement>();

    const hide = () => {
      root.dataset.shield = "on";
      setHidden(true);
      document.querySelectorAll<HTMLVideoElement>(".protected-media video").forEach((v) => {
        if (!v.paused) {
          resumable.add(v);
          v.pause();
        }
      });
    };
    const show = () => {
      if (root.dataset.shield !== "on") return;
      delete root.dataset.shield;
      setHidden(false);
      resumable.forEach((v) => v.play().catch(() => {}));
      resumable.clear();
    };

    const onVisibility = () => (document.visibilityState === "hidden" ? hide() : show());
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) hide(); // la souris sort de la fenêtre
    };
    const isCapture = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      return (
        e.key === "PrintScreen" ||
        // Windows : Win+Maj+S ; macOS : Cmd+Maj+3/4/5
        (e.shiftKey && e.metaKey && ["s", "3", "4", "5"].includes(k))
      );
    };
    const onKey = (e: KeyboardEvent) => {
      if (isCapture(e)) {
        hide();
        if (e.key === "PrintScreen") navigator.clipboard?.writeText("").catch(() => {});
      } else if (e.type === "keydown" && !["Shift", "Meta", "Control", "Alt", "OS"].includes(e.key)) {
        show();
      }
    };

    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("pointermove", show);
    document.addEventListener("touchstart", show, { passive: true });
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("pointermove", show);
      document.removeEventListener("touchstart", show);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKey);
      delete root.dataset.shield;
    };
  }, [blur]);

  if (!blur) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm backdrop-blur transition-opacity motion-reduce:transition-none ${
        hidden ? "opacity-100" : "opacity-0"
      }`}
    >
      {hidden ? "Contenu protégé" : ""}
    </div>
  );
}
