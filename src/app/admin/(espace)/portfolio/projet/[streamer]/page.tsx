import { TranslationTabs, TranslationInput } from "@/components/admin/TranslationTabs";
import { translationValues } from "@/lib/admin-translations";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories } from "@/data/portfolio";
import { getStore } from "@/lib/store";
import { deleteStreamerAction, moveWorkAction, saveStreamerAction, saveTestimonialAction } from "../../../../portfolio-actions";

export const metadata: Metadata = { title: "Projet" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

// Fiche d'un projet : infos, réalisations par type, textes de la page projet
export default async function AdminProjectPage({ params, searchParams }: PageProps<"/admin/portfolio/projet/[streamer]">) {
  const { streamer: id } = await params;
  const { enregistre, erreur } = await searchParams;
  const store = getStore();
  const [{ streamers, works }, testimonials] = await Promise.all([store.getPortfolio(), store.listTestimonials()]);
  const s = streamers.find((x) => x.id === decodeURIComponent(id));
  if (!s) notFound();
  const own = works.filter((w) => w.streamer === s.id);
  const review = testimonials.find((x) => x.streamerId === s.id);

  const translationContent = await getStore().getHomeContent();

  return (
    <TranslationTabs stored={translationValues(translationContent)}>
      <Link href="/admin/portfolio" className="text-sm text-muted hover:text-foreground">
        ← Tous les projets
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{s.name}</h1>
        <Link href={`/portfolio/${s.id}`} target="_blank" className="text-sm text-accent hover:underline">
          Voir la page ↗
        </Link>
      </div>
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

      <div className="mt-8 space-y-6">
        <section className={card}>
          <h2 className="font-semibold">Informations</h2>
          <form action={saveStreamerAction} className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_1.4fr_auto] sm:items-end">
            <input type="hidden" name="id" value={s.id} />
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Nom</span>
              <TranslationInput translationKey={`translation:streamer:${s.id}:name`} name="name" defaultValue={s.name} required className={`${input} font-semibold`} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Description</span>
              <TranslationInput translationKey={`translation:streamer:${s.id}:description`} name="description" defaultValue={s.description} className={input} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Lien de la chaîne</span>
              <input name="url" defaultValue={s.url} placeholder="https://…" className={input} />
            </label>
            <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">
              Enregistrer
            </button>
          </form>
        </section>

        <section className={`${card} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <h2 className="font-semibold">Mise en page de la page projet</h2>
            <p className="mt-1 text-sm text-muted">Blocs, disposition, visuels et textes (FR et EN), avec aperçu en direct.</p>
          </div>
          <Link href={`/admin/portfolio/mise-en-page/${encodeURIComponent(s.id)}`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
            Mettre en page
          </Link>
        </section>

        <section className={card} aria-labelledby="avis">
          <h2 id="avis" className="font-semibold">
            Avis du client <span className="font-normal text-muted">(facultatif)</span>
          </h2>
          <p className="mt-1 text-sm text-muted">
            Une courte citation du client, affichée sur la page du projet, et sur l&apos;accueil si tu le coches. Elle n&apos;est
            publiée qu&apos;avec son accord.
          </p>
          <form action={saveTestimonialAction} className="mt-4 space-y-3">
            <input type="hidden" name="streamerId" value={s.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Nom ou pseudo du client *</span>
                <TranslationInput translationKey={`translation:review:${s.id}:author`} name="author" defaultValue={review?.author ?? s.name} maxLength={80} className={input} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-muted">Précision (facultatif, ex. « Streamer Twitch »)</span>
                <TranslationInput translationKey={`translation:review:${s.id}:role`} name="role" defaultValue={review?.role} maxLength={80} className={input} />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-muted">Avis (français) *</span>
              <TranslationInput multiline translationKey="unused" englishDefault={review?.quoteEn ?? review?.quote ?? ""} name="quote" defaultValue={review?.quote} rows={3} maxLength={600} className={input} />
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="consent" defaultChecked={review?.consent} className="mt-1 accent-[var(--accent)]" />
              <span>
                Le client a donné son accord pour publier cet avis
                <span className="block text-xs text-muted">Sans cette case, l&apos;avis est enregistré mais n&apos;apparaît pas sur le site.</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="onHome" defaultChecked={review?.onHome} className="accent-[var(--accent)]" />
              Afficher aussi sur l&apos;accueil
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
                Enregistrer l&apos;avis
              </button>
              {review && (
                <button type="submit" name="remove" value="1" formNoValidate className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
                  Supprimer l&apos;avis
                </button>
              )}
              {review && (
                <span className="text-xs text-muted">
                  {review.consent ? (review.onHome ? "Publié sur la page projet et l'accueil" : "Publié sur la page projet") : "Non publié (accord non coché)"}
                </span>
              )}
            </div>
          </form>
        </section>

        <section className={card}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Réalisations ({own.length})</h2>
            <Link href={`/admin/portfolio/nouveau?streamer=${s.id}`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">
              + Ajouter une réalisation
            </Link>
          </div>
          <div className="mt-5 space-y-5">
            {own.length === 0 && <p className="text-sm text-muted">Aucune réalisation pour l&apos;instant.</p>}
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
        </section>

        <form action={deleteStreamerAction} className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted">
          <input type="hidden" name="id" value={s.id} />
          <label className="flex items-center gap-1">
            <input type="checkbox" name="confirm" /> confirmer
          </label>
          <button type="submit" className="rounded-full border border-red-500/40 px-3 py-1.5 text-red-300 hover:bg-red-500/10">
            Supprimer {s.name} et ses réalisations
          </button>
        </form>
      </div>
    </TranslationTabs>
  );
}
