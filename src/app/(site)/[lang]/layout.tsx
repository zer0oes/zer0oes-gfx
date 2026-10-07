import { notFound } from "next/navigation";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { AnnouncementBanners } from "@/components/AnnouncementBanners";
import { I18nProvider } from "@/components/I18nProvider";
import { ProtectionProvider } from "@/components/protection";
import { ScrollReveal } from "@/components/ScrollReveal";
import { isLocale, locales } from "@/lib/i18n";
import { getStore } from "@/lib/store";

// Pages publiques régénérées au plus toutes les 5 minutes : une modification de la base faite
// hors de l'admin (ex. npm run db:portfolio) finit par apparaître sans redéploiement.
// Les enregistrements faits dans l'admin, eux, rafraîchissent le site immédiatement.
export const revalidate = 300;

// Deux langues seulement : /fr/… (servi sans préfixe par le proxy) et /en/…
export const dynamicParams = false;
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

// Habillage des pages publiques (l'admin a le sien).
export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const [protection, banners] = await Promise.all([getStore().getProtection(), getStore().listBanners()]);
  return (
    <I18nProvider locale={lang}>
      <ProtectionProvider value={protection}>
        <Header />
        <AnnouncementBanners banners={banners} locale={lang} />
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
