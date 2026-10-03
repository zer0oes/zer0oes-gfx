import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProtectionProvider } from "@/components/protection";
import { getStore } from "@/lib/store";

// Habillage des pages publiques (l'admin a le sien).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const protection = await getStore().getProtection();
  return (
    <ProtectionProvider value={protection}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </ProtectionProvider>
  );
}
