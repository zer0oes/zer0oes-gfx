import Link from "next/link";
import { href, t, type Locale } from "@/lib/i18n";

export function OfferGuide({ locale }: { locale: Locale }) {
  return (
      <p className="mt-6 text-center text-sm"><Link href={href(locale, "/contact")} className="text-accent underline underline-offset-4">{t(locale, { fr: "Tu hésites ? Je t’aide à choisir →", en: "Unsure? Let me help you choose →" })}</Link></p>
  );
}
