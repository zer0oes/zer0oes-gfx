import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { asLocale, t } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/merci/solde">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  return { title: t(lang, { fr: "Solde réglé", en: "Balance paid" }), robots: { index: false } };
}

export default async function BalanceThanksPage({ params, searchParams }: PageProps<"/[lang]/merci/solde">) {
  const lang = asLocale((await params).lang);
  const { demo } = await searchParams;
  return (
    <PageHeader eyebrow={t(lang, { fr: "Paiement reçu", en: "Payment received" })} title={t(lang, { fr: "Merci !", en: "Thank you!" })}>
      {t(lang, {
        fr: "Le solde de ta commande est réglé. Je t'envoie tes fichiers définitifs très vite.",
        en: "The balance of your order is paid. I'll send you your final files very soon.",
      })}
      {demo === "1" && (
        <span className="mt-4 block text-sm text-amber-200">{t(lang, { fr: "Mode démo : aucun paiement réel.", en: "Demo mode: no real payment." })}</span>
      )}
    </PageHeader>
  );
}
