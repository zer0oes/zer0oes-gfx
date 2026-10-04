import Image from "next/image";
import Link from "next/link";
import { ProtectionProvider } from "@/components/protection";
import { site } from "@/data/site";
import { getStore } from "@/lib/store";

// Habillage de l'espace client privé (page de livraison) : en-tête et pied de page réduits,
// sans navigation commerciale.
export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const protection = await getStore().getProtection();
  return (
    <ProtectionProvider value={protection}>
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} priority className="h-8 w-auto" />
          </Link>
          <Link href="/" className="text-sm text-muted transition hover:text-foreground">
            ← Retour au site
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted sm:px-6">
          <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} className="h-6 w-auto opacity-80" />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href={`mailto:${site.email}`} className="hover:text-foreground">
              {site.email}
            </a>
            <Link href="/mentions-legales" className="hover:text-foreground">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-foreground">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </ProtectionProvider>
  );
}
