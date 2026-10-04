import type { Metadata } from "next";
import Link from "next/link";
import { categories } from "@/data/portfolio";
import { homeSections, resolveHome, type HomeField } from "@/lib/home-content";
import { getStore } from "@/lib/store";
import { saveHomeAction } from "../../portfolio-actions";

export const metadata: Metadata = { title: "Page d'accueil" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

// Visuels qu'on peut choisir : vide = automatique (ouverture, univers), « - » = partie masquée
const autoAllowed = new Set(["hero.work", "universe.work"]);

export default async function AdminHomePage({ searchParams }: PageProps<"/admin/accueil">) {
  const { enregistre, erreur } = await searchParams;
  const store = getStore();
  const [{ streamers, works }, stored] = await Promise.all([store.getPortfolio(), store.getHomeContent()]);
  const content = resolveHome(stored);
  const withImage = works.filter((w) => w.image);
  const emoteBoards = works.filter((w) => w.emotes?.length);
  const catLabel = (id: string) => categories.find((c) => c.id === id)?.label ?? id;

  const field = (f: HomeField) => {
    const value = content.text(f.key);
    const name = `h:${f.key}`;
    if (f.kind === "work" || f.kind === "emotes") {
      const chosen = works.find((w) => w.id === value);
      const list = f.kind === "emotes" ? emoteBoards : withImage;
      return (
        <div className="flex items-center gap-3">
          {chosen?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chosen.image} alt="" className="h-14 w-24 shrink-0 rounded-md bg-background object-cover" />
          ) : (
            <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-md bg-background text-[10px] text-muted">
              {value === "-" ? "masqué" : "auto"}
            </span>
          )}
          <select name={name} defaultValue={value} className={input}>
            {autoAllowed.has(f.key) && <option value="">Automatique (réalisation mise en avant)</option>}
            {!autoAllowed.has(f.key) && f.key !== "hero.work" && <option value="-">Ne pas afficher cette partie</option>}
            {streamers.map((s) => (
              <optgroup key={s.id} label={s.name}>
                {list
                  .filter((w) => w.streamer === s.id)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title} ({catLabel(w.category)})
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      );
    }
    const multi = f.kind === "lines" || f.kind === "paragraphs" || f.kind === "long";
    return multi ? (
      <textarea
        name={name}
        defaultValue={value}
        rows={f.kind === "paragraphs" ? 6 : f.kind === "lines" ? 2 : 3}
        maxLength={1200}
        className={input}
      />
    ) : (
      <input name={name} defaultValue={value} maxLength={f.max ?? 1200} className={input} />
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Page d&apos;accueil</h1>
        <Link href="/" target="_blank" className="text-sm text-accent hover:underline">
          Voir l&apos;accueil ↗
        </Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Textes et visuels de l&apos;accueil. Les visuels se choisissent parmi les réalisations du portfolio : pour une
        nouvelle image, ajoute-la d&apos;abord comme réalisation dans <Link href="/admin/portfolio" className="text-accent hover:underline">Portfolio</Link>.
        Un texte vidé reprend sa version d&apos;origine.
        {stored ? " Contenu personnalisé en place." : " Contenu d'origine en place."}
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

      <form action={saveHomeAction} className="mt-8 space-y-6">
        {homeSections.map((s, i) => (
          <section key={s.id} className={card}>
            <h2 className="font-semibold">
              <span className="mr-2 text-muted">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </h2>
            <div className="mt-4 space-y-4">
              {s.fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs text-muted">{f.label}</span>
                  {field(f)}
                  {f.hint && <span className="mt-1 block text-xs text-muted">{f.hint}</span>}
                </label>
              ))}
            </div>
          </section>
        ))}
        <div className="sticky bottom-4 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur">
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
            Enregistrer l&apos;accueil
          </button>
        </div>
      </form>
      {stored ? (
        <form action={saveHomeAction} className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted">
          <input type="hidden" name="reset" value="1" />
          <label className="flex items-center gap-1">
            <input type="checkbox" name="confirm" required /> confirmer
          </label>
          <button type="submit" className="rounded-full border border-border px-3 py-1.5 hover:text-foreground">
            Revenir à l&apos;accueil d&apos;origine
          </button>
        </form>
      ) : null}
    </>
  );
}
