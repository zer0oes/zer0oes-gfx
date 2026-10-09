"use client";

import { useEffect, useRef, useState } from "react";
import { LAB_SIZE_PRESETS } from "@/lib/custom-lab/model";
import type { LabSize } from "@/lib/custom-lab/types";

// Zone d'aperçu à la taille réelle de la création, réduite pour tenir dans la largeur disponible (et 460 px de haut)
export function CustomLabSizedStage({ size, children }: { size: LabSize; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const scale = available ? Math.min(1, available / size.width, 460 / size.height) : 0;
  return (
    <div ref={box} className="w-full">
      <div className="relative mx-auto overflow-hidden" style={{ width: size.width * scale, height: size.height * scale }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: size.width, height: size.height, transform: `scale(${scale})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

const input = "w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm";

// Choix de la taille : formats courants ou largeur × hauteur libres
export function CustomLabSizeField({ size, onChange }: { size: LabSize; onChange: (size: LabSize) => void }) {
  const preset = LAB_SIZE_PRESETS.find(([w, h]) => w === size.width && h === size.height);
  const set = (key: keyof LabSize, raw: string) => {
    const v = Math.round(Number(raw));
    if (Number.isFinite(v) && v > 0) onChange({ ...size, [key]: Math.min(key === "width" ? 7680 : 4320, Math.max(20, v)) });
  };
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1 text-[11px] text-[var(--cl-muted)]">Taille (px)</legend>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Format" className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm" value={preset ? `${preset[0]}x${preset[1]}` : ""} onChange={(e) => { const [w, h] = e.target.value.split("x").map(Number); if (w && h) onChange({ width: w, height: h }); }}>
          {LAB_SIZE_PRESETS.map(([w, h]) => <option key={`${w}x${h}`} value={`${w}x${h}`}>{w} × {h}</option>)}
          <option value="">Personnalisée</option>
        </select>
        <input aria-label="Largeur" type="number" min={20} max={7680} className={input} value={size.width} onChange={(e) => set("width", e.target.value)} />
        <span className="text-[var(--cl-muted)]">×</span>
        <input aria-label="Hauteur" type="number" min={20} max={4320} className={input} value={size.height} onChange={(e) => set("height", e.target.value)} />
      </div>
    </fieldset>
  );
}
