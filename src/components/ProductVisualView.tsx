import { cleanMarkup, scopeVisualCss, type ProductVisual } from "@/lib/product-visuals";

// Un visuel de la bibliothèque (dessin en code) : statique, ou avec le CSS de sa version animée
export function ProductVisualView({ visual, animated, className = "" }: { visual: Pick<ProductVisual, "id" | "markup" | "css">; animated: boolean; className?: string }) {
  return (
    <>
      {animated && visual.css.trim() && <style>{scopeVisualCss(visual.css, visual.id)}</style>}
      <div aria-hidden="true" data-visuel={visual.id} data-anime={animated ? "" : undefined} className={`product-visual ${className}`} dangerouslySetInnerHTML={{ __html: cleanMarkup(visual.markup) }} />
    </>
  );
}
