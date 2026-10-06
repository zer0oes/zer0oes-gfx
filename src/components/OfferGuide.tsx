import Link from "next/link";
import { href, t, type Locale } from "@/lib/i18n";
import type { Pack } from "@/lib/pricing";
import { tr } from "@/lib/translations-en";
import { OfferPrice } from "./ui";

export function OfferGuide({ packs, locale }: { packs: Pack[]; locale: Locale }) {
  const needs: Record<string, { fr: string; en: string }> = {
    "premier-look": { fr: "Je lance ma chaîne", en: "I'm launching my channel" },
    "identite-signature": { fr: "Je veux une identité plus complète", en: "I want a fuller identity" },
    "univers-complet": { fr: "Je veux un univers animé", en: "I want an animated universe" },
  };
  return (
    <section aria-labelledby="offer-guide" className="mb-10 rounded-2xl border border-border bg-surface p-6">
      <h2 id="offer-guide" className="font-display text-2xl font-bold">{t(locale, { fr: "Quel pack pour ton projet ?", en: "Which package fits your project?" })}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {packs.map((pack) => (
          <Link key={pack.id} href={`#offre-${pack.id}`} className="rounded-xl border border-border p-4 transition hover:border-accent focus-visible:outline-2 focus-visible:outline-accent">
            <p className="font-semibold">{needs[pack.id] ? t(locale, needs[pack.id]) : tr(locale, pack.name)}</p>
            <p className="mt-2 text-sm text-muted">{tr(locale, pack.name)} · <OfferPrice item={pack} locale={locale} /></p>
            <p className="mt-3 text-sm text-accent">{t(locale, { fr: "Voir les inclusions et les options ↓", en: "See inclusions and add-ons ↓" })}</p>
          </Link>
        ))}
      </div>
      <p className="mt-5 text-sm text-muted">{t(locale, { fr: "Tu hésites ? Décris ton besoin en quelques mots, sans choisir ni payer un pack.", en: "Unsure? Describe what you need in a few words, without choosing or paying for a package." })} <Link href={href(locale, "/contact")} className="text-accent underline underline-offset-4">{t(locale, { fr: "Aide-moi à choisir →", en: "Help me choose →" })}</Link></p>
    </section>
  );
}
