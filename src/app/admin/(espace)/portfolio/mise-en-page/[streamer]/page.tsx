import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { starterPage } from "@/lib/page-builder";
import { projectPage } from "@/lib/project-page";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Mise en page du projet" };

// Constructeur de la page projet : blocs, dispositions, visuels et textes, avec aperçu en direct
export default async function ProjectLayoutPage({ params }: PageProps<"/admin/portfolio/mise-en-page/[streamer]">) {
  const id = decodeURIComponent((await params).streamer);
  const { streamers, works } = await getStore().getPortfolio();
  const streamer = streamers.find((s) => s.id === id);
  if (!streamer) notFound();
  const own = works.filter((w) => w.streamer === id);
  const current = await projectPage(id);
  const page = current?.page ?? starterPage(streamer.name, streamer.description, own.map((w) => w.id));

  return (
    <>
      <Link href={`/admin/portfolio/projet/${encodeURIComponent(id)}`} className="text-sm text-muted hover:text-foreground">
        ← {streamer.name}
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Mise en page — {streamer.name}</h1>
        <Link href={`/portfolio/${encodeURIComponent(id)}`} target="_blank" className="text-sm text-accent hover:underline">
          Voir la page publique ↗
        </Link>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        Glisse les blocs pour les réordonner, choisis la disposition de chacun, ses visuels et ses textes. L&apos;aperçu se met à jour
        en direct ; rien n&apos;est publié avant « Enregistrer ».
        {!current && " Ce projet n'a pas encore de page dédiée : voici une base à partir de ses réalisations."}
      </p>
      {own.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Ajoute d&apos;abord des réalisations à ce projet.</p>
      ) : (
        <PageBuilder
          streamerId={id}
          streamerName={streamer.name}
          initial={page}
          custom={current?.custom ?? false}
          works={own.map((w) => ({ id: w.id, title: w.title, image: w.image, category: w.category, emotes: Boolean(w.emotes?.length) }))}
        />
      )}
    </>
  );
}
