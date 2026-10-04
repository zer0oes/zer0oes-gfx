import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { caseStudies } from "@/data/case-studies";
import { textGroups, withStoredTexts } from "@/lib/case-study-texts";
import { getStore } from "@/lib/store";
import { saveCaseStudyTextsAction } from "../../../../portfolio-actions";

export const metadata: Metadata = { title: "Textes du projet" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function CaseStudyTextsPage({ params, searchParams }: PageProps<"/admin/portfolio/textes/[streamer]">) {
  const { streamer: id } = await params;
  const { enregistre, erreur } = await searchParams;
  const base = caseStudies[id];
  if (!base || !("layout" in base)) notFound();
  const store = getStore();
  const [{ streamers, works }, stored] = await Promise.all([store.getPortfolio(), store.getCaseStudyTexts(id)]);
  const streamer = streamers.find((s) => s.id === id);
  if (!streamer) notFound();

  const study = withStoredTexts(base, stored);
  const title = (workId?: string) => works.find((w) => w.id === workId)?.title;
  const groups = textGroups(study, title);

  return (
    <>
      <Link href={`/admin/portfolio/projet/${id}`} className="text-sm text-muted hover:text-foreground">
        ← {streamer.name}
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Textes — {streamer.name}</h1>
        <Link href={`/portfolio/${id}`} target="_blank" className="text-sm text-accent hover:underline">
          Voir la page ↗
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Les visuels et la mise en page ne changent pas : seuls les textes sont modifiés. La page publique est mise à jour
        immédiatement.
        {stored ? " Textes personnalisés en place." : " Textes d'origine en place."}
      </p>
      {enregistre && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Enregistré.
        </p>
      )}
      {typeof erreur === "string" && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <form action={saveCaseStudyTextsAction} className="mt-8 space-y-6">
        <input type="hidden" name="streamer" value={id} />
        {groups.map((g) => (
          <section key={g.title} className={card}>
            <h2 className="font-semibold">{g.title}</h2>
            <div className="mt-4 space-y-4">
              {g.fields.map((f) => {
                const rows = f.kind === "lines" ? Math.max(2, f.value.split("\n").length) : f.value.length > 90 ? 3 : 1;
                return (
                  <label key={f.path} className="block">
                    <span className="mb-1 block text-xs text-muted">{f.label}</span>
                    {rows > 1 ? (
                      <textarea name={`t:${f.path}`} defaultValue={f.value} rows={rows} maxLength={600} className={input} />
                    ) : (
                      <input name={`t:${f.path}`} defaultValue={f.value} maxLength={600} className={input} />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        ))}
        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur">
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
            Enregistrer les textes
          </button>
        </div>
      </form>
      {stored ? (
        <form action={saveCaseStudyTextsAction} className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted">
          <input type="hidden" name="streamer" value={id} />
          <input type="hidden" name="reset" value="1" />
          <label className="flex items-center gap-1">
            <input type="checkbox" name="confirm" required /> confirmer
          </label>
          <button type="submit" className="rounded-full border border-border px-3 py-1.5 hover:text-foreground">
            Revenir aux textes d&apos;origine
          </button>
        </form>
      ) : null}
    </>
  );
}
