import { notFound } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Announcements } from "@/components/Announcements";
import { I18nProvider } from "@/components/I18nProvider";
import { ProtectionProvider } from "@/components/protection";
import { ScrollReveal } from "@/components/ScrollReveal";
import { isLocale, locales } from "@/lib/i18n";
import { getStore } from "@/lib/store";

// Relire le quota et la date à chaque requête pour activer/arrêter l'offre programmée.
export const revalidate = 0;

// Deux langues seulement : /fr/… (servi sans préfixe par le proxy) et /en/…
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Habillage des pages publiques (l'admin a le sien).
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const protection = await getStore().getProtection();
  return (
    <I18nProvider locale={lang}>
      <ProtectionProvider value={protection}>
        <Header />
        <Announcements locale={lang} />
        {/* reveal-page : blocs animés au chargement et au scroll sur toutes les pages (voir ScrollReveal) */}
        <main lang={lang} className="reveal-page flex-1">
          {children}
        </main>
        <Footer locale={lang} />
        <ScrollReveal />
        <Analytics />
      </ProtectionProvider>
    </I18nProvider>
  );
}
