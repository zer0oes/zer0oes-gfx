import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

// Habillage des pages publiques (l'admin a le sien).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
