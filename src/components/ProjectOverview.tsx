import type { Work } from "@/data/portfolio";
import { categories } from "@/data/portfolio";
import { t, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/translations-en";

export function ProjectOverview({ works, locale }: { works: Work[]; locale: Locale }) {
  const scope = categories.filter((c) => works.some((w) => w.category === c.id));
  return (
    <ul className="mt-5 flex flex-wrap gap-2" aria-label={t(locale, { fr: "Ce qui a été créé", en: "What was created" })}>
      {scope.map((c) => (
        <li key={c.id} className="rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium text-foreground">{tr(locale, c.label)}</li>
      ))}
    </ul>
  );
}