import type { Metadata } from "next";
import { asLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { legalDocument } from "@/lib/legal-content";

export async function generateMetadata({ params }: PageProps<"/[lang]/mentions-legales">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/mentions-legales", {
    fr: { title: "Mentions légales", description: "Mentions légales du site zer0oes gfx : éditeur, hébergement, propriété intellectuelle." },
    en: { title: "Legal notice", description: "Legal notice of the zer0oes gfx website: publisher, hosting, intellectual property." },
  });
}

export default async function MentionsLegalesPage({ params }: PageProps<"/[lang]/mentions-legales">) {
  const locale = asLocale((await params).lang);
  const store = getStore();
  const [catalog, stored] = await Promise.all([store.getCatalog(), store.getHomeContent()]);
  return legalDocument("mentions-legales", locale, catalog.settings, stored).content;
}
