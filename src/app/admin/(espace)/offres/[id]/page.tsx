import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmDelete } from "@/components/admin/Drawer";
import { compositionOptions, PackForm } from "@/components/admin/PackForm";
import { TranslationTabs } from "@/components/admin/TranslationTabs";
import { translationValues } from "@/lib/admin-translations";
import { getStore } from "@/lib/store";
import { archivePackAction, deletePackAction } from "../../../offres-actions";

export const metadata: Metadata = { title: "Offre" };

const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";

export default async function PackEditPage({ params, searchParams }: PageProps<"/admin/offres/[id]">) {
  const { id } = await params;
  const { enregistre, erreur } = await searchParams;
  const store = getStore();
  const [{ packs, options, categories = [] }, content] = await Promise.all([store.getCatalog(), store.getHomeContent()]);
  const pack = packs.find((p) => p.id === decodeURIComponent(id));
  if (!pack) notFound();
  const formId = `offre-form-${pack.id}`;

  return (
    <>
      <Link href="/admin/offres" className="text-sm text-muted hover:text-foreground">← Offres</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{pack.name}</h1>
          <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${pack.archived ? "border-border text-muted" : pack.checkout ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-violet-400/40 bg-violet-400/10 text-violet-300"}`}>{pack.archived ? "Archivée" : pack.checkout ? "En ligne" : "Sur devis"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConfirmDelete action={deletePackAction} id={pack.id} label="Supprimer l'offre" question={`Es-tu sûre de vouloir supprimer « ${pack.name} » ? (si elle a des commandes, elle sera archivée)`} />
          <form action={archivePackAction}>
            <input type="hidden" name="id" value={pack.id} />
            {pack.archived && <input type="hidden" name="restore" value="1" />}
            <button type="submit" className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">{pack.archived ? "Remettre en ligne" : "Archiver"}</button>
          </form>
          <button type="submit" form={formId} className={save}>Enregistrer l&apos;offre</button>
        </div>
      </div>
      {enregistre && <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Enregistré.</p>}
      {typeof erreur === "string" && <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{erreur}</p>}
      <TranslationTabs stored={translationValues(content)}>
        <PackForm pack={pack} formId={formId} options={compositionOptions(options, categories)} content={content} />
      </TranslationTabs>
    </>
  );
}
