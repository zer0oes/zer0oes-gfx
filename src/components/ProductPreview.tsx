import type { CSSProperties } from "react";
import { t, type Locale } from "@/lib/i18n";
import { animatedOption, optionThemeColors } from "@/lib/option-products";
import { optionCategory, type Option } from "@/lib/pricing";
import type { ProductVisual } from "@/lib/product-visuals";
import { ProductVisualView } from "./ProductVisualView";

// Neutral wireframes describe a service, without displaying a creator's finished artwork.
// Dessin : le visuel associé au produit dans l'admin (bibliothèque « Visuels »).
export function ProductPreview({ option, visual, locale, animated = animatedOption(option) }: { option: Option; visual: ProductVisual; locale: Locale; animated?: boolean }) {
  const category = optionCategory(option);
  return <figure style={{ "--product-color": optionThemeColors[category], background: "linear-gradient(135deg, color-mix(in srgb, var(--product-color) 14%, var(--background)), var(--background) 55%, color-mix(in srgb, var(--product-color) 7%, var(--background)))" } as CSSProperties} className="relative m-0">
    <div className="flex h-36 items-center justify-center overflow-hidden p-4">
      <ProductVisualView visual={visual} animated={animated} className="h-full w-full max-w-40 text-[var(--product-color)]" />
    </div>
    {animated && <span className="absolute right-2 top-2 rounded-full border border-[var(--product-color)] bg-[var(--product-color)] px-2 py-0.5 text-[10px] font-semibold text-background shadow-sm">{t(locale, { fr: "Animation sur mesure", en: "Custom animation" })}</span>}
  </figure>;
}
