import type { Metadata } from "next";
import { asLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { legalDocument } from "@/lib/legal-content";

export async function generateMetadata({ params }: PageProps<"/[lang]/cgv">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/cgv", {
    fr: { title: "Conditions générales de vente", description: "Conditions générales de vente des prestations de création graphique zer0oes gfx." },
    en: { title: "Terms of sale", description: "Terms of sale for zer0oes gfx graphic design services." },
  });
}

export default async function CgvPage({ params }: PageProps<"/[lang]/cgv">) {
  const locale = asLocale((await params).lang);
  const store = getStore();
  const [catalog, stored] = await Promise.all([store.getCatalog(), store.getHomeContent()]);
  return legalDocument("cgv", locale, catalog.settings, stored).content;
}
