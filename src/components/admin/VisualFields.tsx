"use client";

import { useState, type CSSProperties } from "react";
import { MAX_CSS, MAX_MARKUP, starterVisual, type ProductVisual } from "@/lib/product-visuals";
import { ProductVisualView } from "@/components/ProductVisualView";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const codeInput = `${input} font-mono text-xs leading-relaxed`;

// Cadre d'aperçu : mêmes couleurs que la carte du site (couleur de la catégorie)
export function VisualFrame({ children, color = "#A78BFA", label }: { children: React.ReactNode; color?: string; label?: string }) {
  return (
    <figure style={{ "--product-color": color, background: "linear-gradient(135deg, color-mix(in srgb, var(--product-color) 14%, var(--background)), var(--background) 55%, color-mix(in srgb, var(--product-color) 7%, var(--background)))" } as CSSProperties} className="relative m-0 overflow-hidden rounded-xl border border-border">
      <div className="flex h-36 items-center justify-center p-4">{children}</div>
      {label && <figcaption className="absolute left-2 top-2 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted">{label}</figcaption>}
    </figure>
  );
}

// Champs d'un visuel (nom, dessin, CSS de l'animation) avec l'aperçu statique et animé en direct
export function VisualFields({ visual }: { visual?: ProductVisual }) {
  const [markup, setMarkup] = useState(visual?.markup ?? starterVisual.markup);
  const [css, setCss] = useState(visual?.css ?? starterVisual.css);
  const draft = { id: `apercu-${visual?.id ?? "nouveau"}`, markup, css };
  return (
    <>
      <label className="grid gap-1.5 text-sm font-medium">Nom<input name="name" defaultValue={visual?.name} required maxLength={80} className={input} /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <VisualFrame label="Statique"><ProductVisualView visual={draft} animated={false} className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>
        <VisualFrame label="Animée"><ProductVisualView visual={draft} animated className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Dessin (SVG ou HTML)
        <span className="text-xs font-normal text-muted">Dessine en currentColor : la couleur suit la catégorie du produit. Ajoute class=&quot;piece&quot; aux éléments à animer.</span>
        <textarea name="markup" value={markup} onChange={(e) => setMarkup(e.target.value)} rows={12} maxLength={MAX_MARKUP} spellCheck={false} className={codeInput} />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        CSS de l&apos;animation
        <span className="text-xs font-normal text-muted">Utilisé seulement pour la variante « Animée ». :scope désigne le visuel entier ; donne un nom unique à tes @keyframes.</span>
        <textarea name="css" value={css} onChange={(e) => setCss(e.target.value)} rows={8} maxLength={MAX_CSS} spellCheck={false} className={codeInput} />
      </label>
    </>
  );
}

// Choix du visuel dans la fiche d'un produit, avec son aperçu
export function VisualPicker({ visuals, defaultValue, color, animated }: { visuals: ProductVisual[]; defaultValue: string; color: string; animated: boolean }) {
  const [id, setId] = useState(defaultValue);
  const visual = visuals.find((v) => v.id === id);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid content-start gap-1.5 text-sm font-medium">
        Visuel
        <span className="text-xs font-normal text-muted">Dessin de la carte. Les visuels se gèrent dans l&apos;onglet « Visuels ».</span>
        <select name="visual" value={id} onChange={(e) => setId(e.target.value)} className={input}>
          {visuals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      {visual && <VisualFrame color={color}><ProductVisualView visual={visual} animated={animated} className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>}
    </div>
  );
}
