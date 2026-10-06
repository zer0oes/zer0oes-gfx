import Link from "next/link";
import { href, t, type Locale } from "@/lib/i18n";

export function OfferGuide({ locale }: { locale: Locale }) {
  return (
      <p className="mt-6 text-center text-sm text-muted">{t(locale, { fr: "Tu hésites ou tu as besoin d’autre chose ? Décris ton besoin en quelques mots, sans choisir ni payer un pack.", en: "Unsure or need something else? Describe what you need in a few words, without choosing or paying for a package." })} <Link href={href(locale, "/contact")} className="text-accent underline underline-offset-4">{t(locale, { fr: "Aide-moi à choisir →", en: "Help me choose →" })}</Link></p>
  );
}
