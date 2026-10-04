import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/portfolio";
import { getStore } from "@/lib/store";
import { moveStreamerAction, saveStreamerAction } from "../../portfolio-actions";

export const metadata: Metadata = { title: "Portfolio" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

// Liste des projets, dans l'ordre de la page Portfolio ; chaque projet se modifie sur sa fiche.
export default async function AdminPortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const { enregistre, erreur } = await searchParams;
  const { streamers, works } = await getStore().getPortfolio();

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
