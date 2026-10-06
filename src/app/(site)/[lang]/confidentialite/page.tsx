import type { Metadata } from "next";
import { asLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { legalDocument } from "@/lib/legal-content";

export async function generateMetadata({ params }: PageProps<"/[lang]/confidentialite">): Promise<Metadata> {
  return pageMetadata(asLocale((await params).lang), "/confidentialite", {
    fr: {
      title: "Politique de confidentialité",
      description: "Quelles données sont collectées sur zer0oes gfx, pourquoi, combien de temps elles sont conservées et comment exercer tes droits.",
    },
    en: {
      title: "Privacy policy",
      description: "What data zer0oes gfx collects, why, how long it is kept and how to exercise your rights.",
    },
  });
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/confidentialite">) {
  const locale = asLocale((await params).lang);
  const store = getStore();
  const [catalog, stored] = await Promise.all([store.getCatalog(), store.getHomeContent()]);
  return legalDocument("confidentialite", locale, catalog.settings, stored).content;
}
