import type { Streamer, Work } from "@/data/portfolio";
import { categories } from "@/data/portfolio";
import { t, type Locale } from "@/lib/i18n";
import { tr } from "@/lib/translations-en";
import { WorkGrid } from "./WorkGrid";

export function ProjectOverview({ streamer, works, locale, quote }: { streamer: Streamer; works: Work[]; locale: Locale; quote: React.ReactNode }) {
  // Les démonstrations et le périmètre viennent des réalisations du projet, sans
  // inventer de brief client, de statistiques ou de résultat commercial.
  const scope = categories.filter((c) => works.some((w) => w.category === c.id));
  const demos = works.filter((w) => w.video).slice(0, 3);
  return (
    <section className="mt-8 space-y-8 rounded-2xl border border-border bg-surface p-5 sm:p-8" aria-label={t(locale, { fr: "Le projet en bref", en: "Project at a glance" })}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl font-bold">{t(locale, { fr: "Le contexte", en: "The context" })}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">{streamer.description}</p>
          {streamer.url && <a href={streamer.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-accent underline underline-offset-4">{t(locale, { fr: "Découvrir la chaîne →", en: "Visit the channel →" })}</a>}
        </div>
        <div>
          <h2 className="font-display text-xl font-bold">{t(locale, { fr: "Ce qui a été créé", en: "What was created" })}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">{scope.map((c) => <li key={c.id} className="rounded-full border border-border px-3 py-1 text-sm">{tr(locale, c.label)}</li>)}</ul>
        </div>
      </div>
      {demos.length > 0 && <div>
        <h2 className="font-display text-xl font-bold">{t(locale, { fr: "Voir l’univers en mouvement", en: "See the universe in motion" })}</h2>
        <p className="mb-5 mt-2 text-sm text-muted">{t(locale, { fr: "Ouvre un aperçu pour lire la démonstration. Captures dans StreamerLab, avec événements de chat et d’alertes simulés.", en: "Open a preview to play the demonstration. Captured in StreamerLab, with simulated chat and alert events." })}</p>
        <WorkGrid works={demos} showStreamer={false} />
      </div>}
      {quote && <div className="border-t border-border pt-6"><h2 className="mb-5 font-display text-xl font-bold">{t(locale, { fr: "Le retour du client", en: "Client feedback" })}</h2>{quote}</div>}
    </section>
  );
}
