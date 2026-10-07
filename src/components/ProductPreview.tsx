import type { CSSProperties } from "react";
import { t, type Locale } from "@/lib/i18n";
import { animatedOption, optionThemeColors } from "@/lib/option-products";
import { optionCategory, type Option } from "@/lib/pricing";

// Neutral wireframes describe a service, without displaying a creator's finished artwork.
export function ProductPreview({ option, locale }: { option: Option; locale: Locale }) {
  const category = optionCategory(option);
  const name = option.id + option.name;
  const emote = category === "emotes";
  const panels = /panneau|panel/i.test(name);
  const banner = /banni|banner/i.test(name);
  const avatar = /avatar/i.test(name);
  const logo = /logo/i.test(name);
  const widget = /widget/i.test(name);
  const alert = /alerte|alert/i.test(name);
  return <figure style={{ "--product-color": optionThemeColors[category], background: "linear-gradient(135deg, color-mix(in srgb, var(--product-color) 14%, var(--background)), var(--background) 55%, color-mix(in srgb, var(--product-color) 7%, var(--background)))" } as CSSProperties} className="relative m-0">
    <div className="flex h-36 items-center justify-center overflow-hidden p-4">
    <div aria-hidden="true" className={`w-full max-w-40 text-[var(--product-color)] ${animatedOption(option) ? "product-preview-animated" : ""}`}>
      {emote ? <div className="flex justify-center gap-3">{[0, 1, 2].map((i) => <svg key={i} viewBox="0 0 64 64" className={`w-14 ${i === 1 ? "-translate-y-3" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="58" height="58" rx="16" strokeDasharray="4 4" /><circle cx="32" cy="32" r="18" /><path d="M24 27h2m12 0h2M24 37q8 9 16 0" /></svg>)}</div> : panels ? <div className="grid grid-cols-3 gap-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="rounded-md border border-current p-3"><span className="block h-1 rounded-full bg-current opacity-50" /></div>)}</div> : avatar ? <div className="mx-auto flex size-20 items-center justify-center rounded-full border-2 border-dashed border-current"><svg viewBox="0 0 48 48" className="size-16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="24" cy="17" r="8" /><path d="M10 40c0-15 28-15 28 0" /></svg></div> : logo ? <div className="mx-auto flex size-20 items-center justify-center"><svg viewBox="0 0 64 64" className="size-16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M32 8 54 21v22L32 56 10 43V21Z" /><path d="m32 18 13 23H19Z" /><path d="M25 34h14" /></svg></div> : banner ? <div className="flex h-20 items-center gap-4 rounded-lg border-2 border-dashed border-current px-5"><span className="size-9 rounded-full border border-current" /><span className="h-2 flex-1 rounded-full bg-current opacity-40" /></div> : widget || alert ? <div className="mx-auto max-w-40 rounded-xl border-2 border-dashed border-current p-3"><span className="mx-auto mb-2 block size-6 rounded-full border border-current" /><span className="block h-2 rounded-full bg-current opacity-40" /><span className="mt-2 block h-1 w-2/3 rounded-full bg-current opacity-20" /></div> : <div className="relative aspect-video rounded-lg border-2 border-dashed border-current p-3"><span className="block h-1.5 w-1/3 rounded-full bg-current opacity-40" /><span className="absolute bottom-3 left-3 h-14 w-20 rounded border border-current" /><span className="absolute bottom-3 right-3 top-6 w-12 rounded border border-current opacity-50" /></div>}
    </div>
    </div>
    {animatedOption(option) && <span className="absolute right-2 top-2 rounded-full border border-[var(--product-color)] bg-[var(--product-color)] px-2 py-0.5 text-[10px] font-semibold text-background shadow-sm">{t(locale, { fr: "Animation sur mesure", en: "Custom animation" })}</span>}
  </figure>;
}
