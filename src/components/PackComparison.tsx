import Link from "next/link";
import { glossaryEntry } from "@/lib/glossary";
import type { HomeContent } from "@/lib/home-content";
import { href, t, type Locale } from "@/lib/i18n";
import { packComparison } from "@/lib/pack-comparison";
import type { Pack, PricingSettings } from "@/lib/pricing";
import { trDeep } from "@/lib/translations-en";
import { Hint } from "./Hint";
import { OfferPrice } from "./ui";

// Tableau comparatif des packs (sous les cartes). Sur mobile, la colonne des critères reste fixe
// et les packs défilent horizontalement.
export function PackComparison({ packs, settings, texts, locale }: { packs: Pack[]; settings: PricingSettings; texts: HomeContent; locale: Locale }) {
  if (packs.length < 2) return null;
  const rows = packComparison(packs, settings, texts, locale);
  const names = packs.map((p) => trDeep(locale, p));
  const highlight = (i: number) => (packs[i].highlight ? "bg-accent/[0.07]" : "");

  return (
    <section data-reveal aria-labelledby="comparatif" className="mt-16">
      <h2 id="comparatif" className="text-center font-display text-2xl font-bold sm:text-3xl">
        {texts.text("compare.title")}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted">
        {texts.text("compare.intro")}
      </p>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">{t(locale, { fr: "Comparatif des packs", en: "Package comparison" })}</caption>
          <thead>
            <tr className="border-b border-border">
              <td className="sticky left-0 z-10 bg-surface p-4" />
              {names.map((p, i) => (
                <th key={p.id} scope="col" className={`p-4 text-center align-bottom ${highlight(i)}`}>
                  {p.highlight && texts.text("compare.badge") && (
                    <span className="mb-2 inline-block rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-background">
                      {texts.text("compare.badge")}
                    </span>
                  )}
                  <span className="block font-display text-base font-bold">{p.name}</span>
                  <span className="mt-1 block font-display text-xl font-bold">
                    <OfferPrice item={p} locale={locale} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <th scope="row" className="sticky left-0 z-10 bg-surface p-4 text-left font-medium">
                  <span className="inline-flex items-center">
                    {row.label}
                    {row.hint && <Hint hint={glossaryEntry(row.hint, texts)} />}
                  </span>
                </th>
                {row.cells.map((cell, i) => (
                  <td key={packs[i].id} className={`p-4 text-center ${highlight(i)}`}>
                    {cell === true ? (
                      <span className="text-accent-2" aria-label={t(locale, { fr: "Inclus", en: "Included" })}>✓</span>
                    ) : cell === false ? (
                      <span className="text-muted/60" aria-label={t(locale, { fr: "Non inclus", en: "Not included" })}>—</span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="sticky left-0 z-10 bg-surface p-4" />
              {packs.map((p, i) => (
                <td key={p.id} className={`p-4 text-center ${highlight(i)}`}>
                  <Link
                    href={p.checkout ? `#offre-${p.id}` : href(locale, `/contact?offre=${p.id}`)}
                    className="inline-block rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent"
                  >
                    {texts.text(p.checkout ? "compare.choose" : "compare.quote")}
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
