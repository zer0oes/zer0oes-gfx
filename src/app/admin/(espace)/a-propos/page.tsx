import type { Metadata } from "next";
import { PageContentEditor } from "@/components/admin/PageContentEditor";
import { aboutFields } from "@/lib/about-content";
import { getStore } from "@/lib/store";
import { savePageContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "À propos" };

export default async function AdminAboutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { enregistre, erreur } = await searchParams;
  const stored = await getStore().getHomeContent();
  return <>
    <h1 className="font-display text-3xl font-bold">À propos</h1>
    <p className="mt-2 text-sm text-muted">Portrait, titres, présentation, légende et liens de la page À propos. Envoie une image ou colle son URL. Un champ vidé reprend son contenu d’origine.</p>
    {enregistre && <p role="status" className="mt-4 text-sm text-emerald-300">Enregistré.</p>}
    {typeof erreur === "string" && <p role="alert" className="mt-4 text-sm text-red-300">{erreur}</p>}
    <PageContentEditor page="a-propos" defaults={{ fr: aboutFields("fr"), en: aboutFields("en") }} stored={stored} action={savePageContentAction} />
  </>;
}
