import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/portfolio";
import { portfolioPageFields, resolveHome } from "@/lib/home-content";
import { getStore } from "@/lib/store";
import { moveStreamerAction, savePortfolioPageAction, saveStreamerAction } from "../../portfolio-actions";

export const metadata: Metadata = { title: "Portfolio" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

// Liste des projets, dans l'ordre de la page Portfolio ; chaque projet se modifie sur sa fiche.
export default async function AdminPortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const { enregistre, erreur } = await searchParams;
  const store = getStore();
  const [{ streamers, works }, stored] = await Promise.all([store.getPortfolio(), store.getHomeContent()]);
  const texts = resolveHome(stored);
  const customTexts = portfolioPageFields.some((f) => stored && typeof stored === "object" && f.key in stored);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Portfolio</h1>
      <p className="mt-2 text-sm text-muted">Les projets s&apos;affichent sur le site dans cet ordre. Clique sur un projet pour le modifier.</p>
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

      <section className={`mt-6 ${card}`} aria-labelledby="textes-page">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="textes-page" className="font-semibold">
            Textes de la page Portfolio
          </h2>
          <Link href="/portfolio" target="_blank" className="text-sm text-accent hover:underline">
            Voir la page ↗
          </Link>
        </div>
        <p className="mt-1 text-xs text-muted">En-tête de la page et lien affiché sur chaque carte projet. Un texte vidé reprend sa version d&apos;origine.</p>
        <form action={savePortfolioPageAction} className="mt-4 space-y-4">
          {portfolioPageFields.map((f) => (
            <label key={f.key} className="block">
              <span className="mb-1 block text-xs text-muted">{f.label}</span>
              {f.kind === "long" ? (
                <textarea name={`h:${f.key}`} defaultValue={texts.text(f.key)} rows={3} maxLength={1200} className={input} />
              ) : (
                <input name={`h:${f.key}`} defaultValue={texts.text(f.key)} maxLength={f.max ?? 1200} className={input} />
              )}
            </label>
          ))}
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
            Enregistrer les textes
          </button>
        </form>
        {customTexts && (
          <form action={savePortfolioPageAction} className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <input type="hidden" name="reset" value="1" />
            <label className="flex items-center gap-1">
              <input type="checkbox" name="confirm" required /> confirmer
            </label>
            <button type="submit" className="rounded-full border border-border px-3 py-1.5 hover:text-foreground">
              Revenir aux textes d&apos;origine
            </button>
          </form>
        )}
      </section>

      <h2 className="mt-10 font-semibold">Projets</h2>

      {streamers.length === 0 ? (
        <p className="mt-10 text-muted">Aucun projet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="w-12 px-4 py-3 font-medium">#</th>
                <th scope="col" className="px-4 py-3 font-medium">Projet</th>
                <th scope="col" className="px-4 py-3 font-medium">Réalisations</th>
                <th scope="col" className="px-4 py-3 font-medium">Types</th>
                <th scope="col" className="px-4 py-3 font-medium">Ordre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {streamers.map((s, si) => {
                const own = works.filter((w) => w.streamer === s.id);
                const cover = own.find((w) => w.image);
                const types = categories.filter((c) => own.some((w) => w.category === c.id)).map((c) => c.label);
                return (
                  <tr key={s.id} className="relative hover:bg-surface/60">
                    <td className="px-4 py-3 text-muted">{si + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cover?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.image} alt="" className="h-10 w-16 shrink-0 rounded-md bg-background object-cover" />
                        ) : (
                          <span className="h-10 w-16 shrink-0 rounded-md bg-background" />
                        )}
                        <div className="min-w-0">
                          <Link href={`/admin/portfolio/projet/${s.id}`} className="font-medium after:absolute after:inset-0 hover:text-accent">
                            {s.name}
                          </Link>
                          {s.description && <p className="truncate text-xs text-muted">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{own.length}</td>
                    <td className="px-4 py-3 text-muted">{types.join(", ") || "—"}</td>
                    <td className="relative z-10 px-4 py-3">
                      <form action={moveStreamerAction} className="flex gap-1">
                        <input type="hidden" name="id" value={s.id} />
                        <button name="dir" value="up" disabled={si === 0} aria-label={`Monter le projet ${s.name}`} className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">
                          ↑
                        </button>
                        <button name="dir" value="down" disabled={si === streamers.length - 1} aria-label={`Descendre le projet ${s.name}`} className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">
                          ↓
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className={`${card} mt-8`}>
        <h2 className="font-semibold">Nouveau projet</h2>
        <form action={saveStreamerAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_1.4fr_auto] sm:items-end">
          <input name="name" placeholder="Nom" required aria-label="Nom" className={input} />
          <input name="description" placeholder="Courte description" aria-label="Description" className={input} />
          <input name="url" placeholder="https://… (optionnel)" aria-label="Lien de la chaîne" className={input} />
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
            Ajouter
          </button>
        </form>
      </section>
    </>
  );
}
