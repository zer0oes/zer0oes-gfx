import Image from "next/image";
import { t, type Locale } from "@/lib/i18n";
import { platforms as all, type PlatformId } from "@/lib/option-content";

// Logos des outils compatibles, choisis dans la fiche de l'option (admin)
export function ProductCompatibility({ platforms, locale }: { platforms: PlatformId[]; locale: Locale }) {
  const list = all.filter((p) => platforms.includes(p.id));
  if (!list.length) return null;
  return <ul aria-label={t(locale, { fr: "Compatible avec", en: "Compatible with" })} className="flex items-center gap-3">
    {list.map((platform) => <li key={platform.id} title={platform.name} className="flex h-8 items-center justify-center"><Image src={`/icons/platforms/${platform.id === "streamelements" ? "streamelements-mark" : platform.id}.svg`} alt={platform.name} width={24} height={24} className="h-6 w-auto object-contain" /></li>)}
  </ul>;
}
