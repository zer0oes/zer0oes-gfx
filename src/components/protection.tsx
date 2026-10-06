"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLocale } from "./I18nProvider";
import { defaultProtection, type ProtectionSettings } from "@/lib/protection";

// Mesures dissuasives sur les médias du portfolio. Rien n'empêche totalement une
// capture d'écran : le but est de décourager la récupération des fichiers et de
// signer chaque visuel (filigrane).

const ProtectionContext = createContext<ProtectionSettings>(defaultProtection);

export function ProtectionProvider({ value, children }: { value: ProtectionSettings; children: React.ReactNode }) {
  return <ProtectionContext.Provider value={value}>{children}</ProtectionContext.Provider>;
}

// Filigrane superposé (logo blanc), pour les vidéos : les images, elles, ont le
// filigrane incrusté dans le fichier à l'envoi.
export function Watermark({ active = true, sheet = false }: { active?: boolean; sheet?: boolean }) {
  const { watermark } = useContext(ProtectionContext);
  if (watermark === "off") return null;
  if (sheet) {
    // Planche d'emotes : un seul logo discret dans le coin (chaque emote a déjà le sien, incrusté)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-zeroes-gfx.png"
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute bottom-3 right-4 z-[2] h-auto w-28 sm:w-36"
        style={{ opacity: 0.5 }}
      />
    );
  }
  const fade = `transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0"}`;
  if (watermark === "mosaique") {
    return (
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-[2] ${fade}`}
        style={{ backgroundImage: "url(/logo-zeroes-gfx.png)", backgroundSize: "16% auto", backgroundRepeat: "space", opacity: active ? 0.16 : 0 }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-zeroes-gfx.png"
      alt=""
      aria-hidden
      draggable={false}
      className={`pointer-events-none absolute z-[2] h-auto ${
        watermark === "visible" ? "left-1/2 top-1/2 w-[42%] -translate-x-1/2 -translate-y-1/2" : "bottom-[3%] right-[2.5%] w-[16%]"
      } ${fade}`}
      style={{ opacity: active ? (watermark === "visible" ? 0.32 : 0.55) : 0 }}
    />
  );
}

// Enveloppe d'un média : calque transparent au-dessus (clic droit / glisser /
// appui long sans effet sur le fichier), filigrane, et cible du flou de protection.
export function ProtectedMedia({
  children,
  className = "",
  watermark = false,
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
  const locale = useLocale();

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
        // Dès Win/Cmd + Maj, avant la 3e touche (Win+Maj+S, Cmd+Maj+3/4/5)
        (e.shiftKey && e.metaKey) ||
        ((e.key === "Meta" || e.key === "OS") && e.shiftKey) ||
        (e.key === "Shift" && e.metaKey) ||
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
      {hidden ? (locale === "en" ? "Protected content" : "Contenu protégé") : ""}
    </div>
  );
}
