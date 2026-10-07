import Image from "next/image";
import { t, type Locale } from "@/lib/i18n";
import type { Option } from "@/lib/pricing";

export function ProductCompatibility({ option, locale }: { option: Option; locale: Locale }) {
  const overlay = /overlay/i.test(option.id + option.name);
  if (!overlay && !/widget|alerte|alert/i.test(option.id + option.name)) return null;
  const platforms = [
    ...(overlay ? [{ id: "obs", name: "OBS" }] : []),
    { id: "streamelements", name: "StreamElements" },
    { id: "streamlabs", name: "Streamlabs" },
  ];
  return <ul aria-label={t(locale, { fr: "Compatible avec", en: "Compatible with" })} className="flex items-center gap-3">
    {platforms.map((platform) => <li key={platform.id} title={platform.name} className="flex h-8 items-center justify-center"><Image src={`/icons/platforms/${platform.id === "streamelements" ? "streamelements-mark" : platform.id}.svg`} alt={platform.name} width={24} height={24} className="h-6 w-auto object-contain" /></li>)}
  </ul>;
}
