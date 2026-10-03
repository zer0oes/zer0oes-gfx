import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/portfolio";
import { getStore } from "@/lib/store";
import { deleteStreamerAction, moveWorkAction, saveStreamerAction } from "../../portfolio-actions";

export const metadata: Metadata = { title: "Portfolio" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function AdminPortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const { enregistre, erreur } = await searchParams;
  const { streamers, works } = await getStore().getPortfolio();

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Portfolio</h1>
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

      <div className="mt-8 space-y-8">
        {streamers.map((s) => {
          const own = works.filter((w) => w.streamer === s.id);
          return (
            <section key={s.id} className={card}>
              <form action={saveStreamerAction} className="grid gap-3 sm:grid-cols-[1fr_2fr_1.4fr_auto] sm:items-end">
                <input type="hidden" name="id" value={s.id} />
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">Nom</span>
                  <input name="name" defaultValue={s.name} required className={`${input} font-semibold`} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">Description</span>
                  <input name="description" defaultValue={s.description} className={input} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-muted">Lien de la chaîne</span>
                  <input name="url" defaultValue={s.url} placeholder="https://…" className={input} />
                </label>
                <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">
                  Enregistrer
                </button>
              </form>

              <div className="mt-6 space-y-5">
                {categories.map((c) => {
                  const list = own.filter((w) => w.category === c.id);
                  if (!list.length) return null;
                  return (
                    <div key={c.id}>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">{c.label}</h3>
                      <ul className="divide-y divide-border rounded-xl border border-border">
                        {list.map((w, i) => (
                          <li key={w.id} className="flex items-center gap-3 p-3">
                            {w.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={w.image} alt="" className="h-12 w-20 shrink-0 rounded-md bg-background object-cover" />
                            ) : (
                              <span className="h-12 w-20 shrink-0 rounded-md bg-background" />
                            )}
                            <Link href={`/admin/portfolio/${w.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-accent">
                              {w.title}
                              {w.featured && <span className="ml-2 text-xs text-accent">★ accueil</span>}
                              {w.video && <span className="ml-2 text-xs text-muted">vidéo</span>}
                              {w.emotes && <span className="ml-2 text-xs text-muted">{w.emotes.length} emotes</span>}
                            </Link>
                            <form action={moveWorkAction} className="flex gap-1">
                              <input type="hidden" name="id" value={w.id} />
                              <button name="dir" value="up" disabled={i === 0} aria-label={`Monter ${w.title}`} className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">
                                ↑
                              </button>
                              <button name="dir" value="down" disabled={i === list.length - 1} aria-label={`Descendre ${w.title}`} className="rounded-md border border-border px-2 py-1 text-xs disabled:opacity-30">
                                ↓
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link href={`/admin/portfolio/nouveau?streamer=${s.id}`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
                  + Ajouter une réalisation
                </Link>
                <form action={deleteStreamerAction} className="flex items-center gap-2 text-xs text-muted">
                  <input type="hidden" name="id" value={s.id} />
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name="confirm" /> confirmer
                  </label>
                  <button type="submit" className="rounded-full border border-red-500/40 px-3 py-1.5 text-red-300 hover:bg-red-500/10">
                    Supprimer {s.name} et ses réalisations
                  </button>
                </form>
              </div>
            </section>
          );
        })}

        <section className={card}>
          <h2 className="font-semibold">Nouveau streameur</h2>
          <form action={saveStreamerAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_1.4fr_auto] sm:items-end">
            <input name="name" placeholder="Nom" required aria-label="Nom" className={input} />
            <input name="description" placeholder="Courte description" aria-label="Description" className={input} />
            <input name="url" placeholder="https://… (optionnel)" aria-label="Lien de la chaîne" className={input} />
            <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
              Ajouter
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
