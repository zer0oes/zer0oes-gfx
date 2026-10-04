import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaInput } from "@/components/admin/MediaInput";
import { categories, emoteGroups, type Work } from "@/data/portfolio";
import { supabasePublishableKey, supabaseUrl } from "@/lib/env";
import { getStore } from "@/lib/store";
import { deleteWorkAction, saveWorkAction } from "../../../portfolio-actions";

export const metadata: Metadata = { title: "Réalisation" };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";

export default async function WorkEditPage({ params, searchParams }: PageProps<"/admin/portfolio/[id]">) {
  const { id } = await params;
  const { streamer: streamerParam, enregistre, erreur } = await searchParams;
  const { streamers, works } = await getStore().getPortfolio();
  const isNew = id === "nouveau";
  const work: Work | undefined = isNew
    ? {
        id: "",
        streamer: typeof streamerParam === "string" ? streamerParam : (streamers[0]?.id ?? ""),
        category: "overlays",
        title: "",
        description: "",
        colors: ["#7c3aed", "#06b6d4"],
      }
    : works.find((w) => w.id === id);
  if (!work) notFound();

  const media = { folder: work.streamer, supabaseUrl: supabaseUrl(), supabaseKey: supabasePublishableKey() };
  // Emotes existantes + 3 lignes vides pour en ajouter
  const emoteRows = [...(work.emotes ?? []), undefined, undefined, undefined];

  return (
    <>
      <Link href={`/admin/portfolio/projet/${work.streamer}`} className="text-sm text-muted hover:text-foreground">
        ← {streamers.find((s) => s.id === work.streamer)?.name ?? "Portfolio"}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">{isNew ? "Nouvelle réalisation" : work.title}</h1>
      {enregistre && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Enregistré.{" "}
          <Link href={`/portfolio/${work.streamer}?type=${work.category}`} className="underline">
            Voir sur le site
          </Link>
        </p>
      )}
      {typeof erreur === "string" && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <form action={saveWorkAction} className={`${card} mt-6 space-y-5`}>
        <input type="hidden" name="isNew" value={isNew ? "1" : ""} />
        <input type="hidden" name="id" value={work.id} />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-3">
            <span className="mb-1 block text-sm font-medium">Titre</span>
            <input name="title" defaultValue={work.title} required className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Streameur</span>
            <select name="streamer" defaultValue={work.streamer} className={input}>
              {streamers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Type</span>
            <select name="category" defaultValue={work.category} className={input}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={work.featured} className="accent-[var(--accent)]" />
            Mise en avant sur l&apos;accueil
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Description</span>
          <textarea name="description" rows={2} defaultValue={work.description} className={input} />
        </label>
        <div className="grid gap-6 lg:grid-cols-2">
          <MediaInput name="image" kind="image" label="Image (vignette et affiche)" defaultValue={work.image} {...media} />
          <MediaInput name="video" kind="video" label="Vidéo en boucle (optionnelle)" defaultValue={work.video} {...media} />
        </div>

        {work.category === "emotes" && (
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Emotes</legend>
            <p className="text-xs text-muted">Une ligne par emote. Les lignes sans image ou sans nom sont ignorées.</p>
            {emoteRows.map((e, i) => (
              <div key={i} className="grid items-start gap-3 rounded-xl border border-border p-3 lg:grid-cols-[2fr_1fr_1fr_auto]">
                <MediaInput name={`emote_src_${i}`} kind="emote" label={e ? e.name : "Nouvelle emote"} defaultValue={e?.src} {...media} />
                <input name={`emote_name_${i}`} defaultValue={e?.name} placeholder="Nom (ex. HYPE)" aria-label="Nom de l'emote" className={input} />
                <select name={`emote_group_${i}`} defaultValue={e?.group ?? "abonne"} aria-label="Groupe" className={input}>
                  {emoteGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <div className="space-y-1 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="checkbox" name={`emote_animated_${i}`} defaultChecked={e?.animated} /> animée
                  </label>
                  {e && (
                    <label className="flex items-center gap-1 text-red-300">
                      <input type="checkbox" name={`emote_delete_${i}`} /> supprimer
                    </label>
                  )}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted">Enregistre pour ajouter d&apos;autres lignes.</p>
          </fieldset>
        )}

        <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">
          {isNew ? "Créer la réalisation" : "Enregistrer"}
        </button>
      </form>

      {!isNew && (
        <form action={deleteWorkAction} className="mt-6 flex items-center gap-3 text-sm text-muted">
          <input type="hidden" name="id" value={work.id} />
          <label className="flex items-center gap-1">
            <input type="checkbox" name="confirm" /> confirmer
          </label>
          <button type="submit" className="rounded-full border border-red-500/40 px-4 py-1.5 text-red-300 hover:bg-red-500/10">
            Supprimer cette réalisation
          </button>
        </form>
      )}
    </>
  );
}
