import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProtectionProvider } from "@/components/protection";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getStore } from "@/lib/store";

// Pages publiques régénérées au plus toutes les 5 minutes : une modification de la base faite
// hors de l'admin (ex. npm run db:portfolio) finit par apparaître sans redéploiement.
// Les enregistrements faits dans l'admin, eux, rafraîchissent le site immédiatement.
export const revalidate = 300;

// Habillage des pages publiques (l'admin a le sien).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const protection = await getStore().getProtection();
  return (
    <ProtectionProvider value={protection}>
      <Header />
      {/* reveal-page : blocs animés au chargement et au scroll sur toutes les pages (voir ScrollReveal) */}
      <main className="reveal-page flex-1">{children}</main>
      <Footer />
      <ScrollReveal />
      <Analytics />
    </ProtectionProvider>
  );
}
