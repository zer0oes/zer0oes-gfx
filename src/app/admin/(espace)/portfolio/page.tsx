import { TranslationTabs, TranslationInput } from "@/components/admin/TranslationTabs";
import { translationValues } from "@/lib/admin-translations";
import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/portfolio";
import { portfolioPageFields, homeDefaultsEn, resolveHome } from "@/lib/home-content";
import { getStore } from "@/lib/store";
import { deleteStreamerAction, reorderStreamersAction, savePortfolioPageAction, setFeaturedProjectAction, setStreamerDraftAction } from "../../portfolio-actions";
import { ClickableRow } from "@/components/admin/ClickableRow";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { RowActionsMenu } from "@/components/admin/RowActionsMenu";
import { SortHandle, SortableRows } from "@/components/admin/SortableRows";
import { featuredProjectId } from "@/lib/portfolio-featured";

export const metadata: Metadata = { title: "Portfolio" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

// Liste des projets, dans l'ordre de la page Portfolio ; chaque projet se modifie sur sa fiche.
export default async function AdminPortfolioPage({ searchParams }: PageProps<"/admin/portfolio">) {
  const { enregistre, erreur } = await searchParams;
  const store = getStore();
  const [{ streamers, works }, stored] = await Promise.all([store.getPortfolio(), store.getHomeContent()]);
  const texts = resolveHome(stored);
  const customTexts = portfolioPageFields.some((f) => stored && typeof stored === "object" && (f.key in stored || `en:${f.key}` in stored));

  const featured = featuredProjectId(stored);
  const translations = translationValues(stored);

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Portfolio</h1>
      <p className="mt-2 text-sm text-muted">Les projets s&apos;affichent sur le site dans l&apos;ordre du tableau : tire une ligne par sa poignée pour le changer. Clique sur un projet pour le modifier.</p>
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
        <p className="mb-2 mt-1 text-xs text-muted">En-tête de la page et lien affiché sur chaque carte projet. Un texte vidé reprend sa version d&apos;origine.</p>
        <TranslationTabs compact stored={translations}>
          <form action={savePortfolioPageAction} className="space-y-4">
            {portfolioPageFields.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-xs text-muted">{f.label}</span>
                {f.kind === "long" ? (
                  <TranslationInput multiline translationKey={`en:${f.key}`} englishDefault={homeDefaultsEn[f.key]} name={`h:${f.key}`} defaultValue={texts.text(f.key)} rows={3} maxLength={1200} className={input} />
                ) : (
                  <TranslationInput translationKey={`en:${f.key}`} englishDefault={homeDefaultsEn[f.key]} name={`h:${f.key}`} defaultValue={texts.text(f.key)} maxLength={f.max ?? 1200} className={input} />
                )}
              </label>
            ))}
            <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
              Enregistrer les textes
            </button>
          </form>
        </TranslationTabs>
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

      <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 className="font-semibold">Projets</h2>
        <Link href="/admin/portfolio/projet/nouveau" className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">+ Ajouter un projet</Link>
      </div>

      {streamers.length === 0 ? (
        <p className="mt-6 text-muted">Aucun projet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-border/50">
                <th scope="col" className="w-12 px-2 py-3"><span className="sr-only">Ordre</span></th>
                <th scope="col" className="px-4 py-3 font-medium">Projet</th>
                <th scope="col" className="px-4 py-3 font-medium">Réalisations</th>
                <th scope="col" className="px-4 py-3 font-medium">Types</th>
                <th scope="col" className="w-12"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <SortableRows onReorder={reorderStreamersAction}>
              {streamers.map((s) => {
                const own = works.filter((w) => w.streamer === s.id);
                const cover = own.find((w) => w.image);
                const types = categories.filter((c) => own.some((w) => w.category === c.id)).map((c) => c.label);
                const isFeatured = featured === s.id;
                return (
                  <ClickableRow key={s.id} href={`/admin/portfolio/projet/${s.id}`} data-sort-id={s.id}>
                    <td className="px-2 py-3"><SortHandle id={s.id} label={s.name} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {cover?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.image} alt="" className="h-10 w-16 shrink-0 rounded-md bg-background object-cover" />
                        ) : (
                          <span className="h-10 w-16 shrink-0 rounded-md bg-background" />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium">{s.name}</span>
                          {isFeatured && <span title="Mis en avant sur la page Portfolio" className="ml-2 inline-flex items-center gap-1 align-middle text-xs text-accent"><MaterialIcon name="star" className="size-3.5" />En avant</span>}
                          {s.draft && <span className="ml-2 text-xs text-amber-300">Brouillon</span>}
                          {s.description && <p className="truncate text-xs text-muted">{s.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{own.length}</td>
                    <td className="px-4 py-3 text-muted">{types.join(", ") || "—"}</td>
                    <td className="pr-2 text-right">
                      <RowActionsMenu id={s.id} name={s.name}
                        items={[
                          isFeatured ? { label: "Retirer la mise en avant", icon: "star_border", action: setFeaturedProjectAction, fields: { off: "1" } } : { label: "Mettre en avant", icon: "star", action: setFeaturedProjectAction },
                          s.draft ? { label: "Publier sur le site", icon: "visibility", action: setStreamerDraftAction, fields: { draft: "0", back: "liste" } } : { label: "Repasser en brouillon", icon: "visibility_off", action: setStreamerDraftAction, fields: { draft: "1", back: "liste" } },
                        ]}
                        deleteAction={deleteStreamerAction} deleteNote="Le projet et toutes ses réalisations seront supprimés." />
                    </td>
                  </ClickableRow>
                );
              })}
            </SortableRows>
          </table>
        </div>
      )}
    </>
  );
}
