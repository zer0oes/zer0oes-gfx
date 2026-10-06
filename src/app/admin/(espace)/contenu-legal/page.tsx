import type { Metadata } from "next";
import Link from "next/link";
import { PageContentEditor } from "@/components/admin/PageContentEditor";
import { isLegalPage, legalDocument, legalPages } from "@/lib/legal-content";
import { getStore } from "@/lib/store";
import { savePageContentAction } from "../../content-actions";

export const metadata: Metadata = { title: "Contenu légal" };

export default async function AdminLegalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { onglet, enregistre, erreur } = await searchParams;
  const page = isLegalPage(onglet) ? onglet : "mentions-legales";
  const store = getStore();
  const [catalog, stored] = await Promise.all([store.getCatalog(), store.getHomeContent()]);
  const defaults = { fr: legalDocument(page, "fr", catalog.settings).fields, en: legalDocument(page, "en", catalog.settings).fields };
  return <>
    <h1 className="font-display text-3xl font-bold">Contenu légal</h1>
    <p className="mt-2 text-sm text-muted">Modifie et traduis les titres, paragraphes, listes et tableaux de chaque page. Un champ vidé reprend son texte d’origine.</p>
    <nav aria-label="Pages légales" className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
      {legalPages.map((item) => <Link key={item.id} href={`/admin/contenu-legal?onglet=${item.id}`} aria-current={page === item.id ? "page" : undefined}
        className={`rounded-lg px-4 py-2 text-sm ${page === item.id ? "is-active bg-accent/10 font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground"}`}>{item.title}</Link>)}
    </nav>
    {enregistre && <p role="status" className="mt-4 text-sm text-emerald-300">Enregistré.</p>}
    {typeof erreur === "string" && <p role="alert" className="mt-4 text-sm text-red-300">{erreur}</p>}
    <PageContentEditor key={page} page={page} defaults={defaults} stored={stored} action={savePageContentAction} formatted />
  </>;
}
