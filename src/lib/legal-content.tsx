import { LegalNoticeEn, MentionsLegalesFr } from "@/components/legal/legal-notice";
import { PrivacyFr } from "@/components/legal/privacy-fr";
import { PrivacyEn } from "@/components/legal/privacy-en";
import { CgvEn, CgvFr } from "@/components/legal/terms";
import { editableDocument } from "@/lib/editable-document";
import type { Locale } from "@/lib/i18n";
import type { PricingSettings } from "@/lib/pricing";
import { trDeep } from "@/lib/translations-en";

export const legalPages = [
  { id: "mentions-legales", title: "Mentions légales" },
  { id: "confidentialite", title: "Confidentialité" },
  { id: "cgv", title: "CGV" },
] as const;
export type LegalPage = typeof legalPages[number]["id"];
export function isLegalPage(value: unknown): value is LegalPage {
  return legalPages.some((page) => page.id === value);
}

export function legalDocument(page: LegalPage, locale: Locale, settings: PricingSettings, stored: unknown = null) {
  const localizedSettings = trDeep(locale, settings);
  const tree = page === "mentions-legales" ? locale === "fr" ? MentionsLegalesFr() : LegalNoticeEn()
    : page === "confidentialite" ? locale === "fr" ? PrivacyFr() : PrivacyEn()
    : locale === "fr" ? CgvFr({ settings: localizedSettings }) : CgvEn({ settings: localizedSettings });
  return editableDocument(tree, stored, page, locale);
}
