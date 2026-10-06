import Image from "next/image";
import Link from "next/link";
import { I18nProvider } from "@/components/I18nProvider";
import { PortalLanguageSwitch } from "@/components/PortalLanguageSwitch";
import { ProtectionProvider } from "@/components/protection";
import { site } from "@/data/site";
import { href, t } from "@/lib/i18n";
import { requestLocale } from "@/lib/request-locale";
import { getStore } from "@/lib/store";

// Habillage de l'espace client privé (page de livraison) : en-tête et pied de page réduits,
// sans navigation commerciale. Langue : choix mémorisé (FR / EN) ou langue du navigateur.
export default async function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const [protection, locale] = await Promise.all([getStore().getProtection(), requestLocale()]);
  const to = (path: string) => href(locale, path);
  return (
    <I18nProvider locale={locale}>
      <ProtectionProvider value={protection}>
        <header className="border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href={to("/")} className="shrink-0">
              <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} priority className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <PortalLanguageSwitch locale={locale} />
              <Link href={to("/")} className="text-sm text-muted transition hover:text-foreground">
                {t(locale, { fr: "← Retour au site", en: "← Back to the website" })}
              </Link>
            </div>
          </div>
        </header>
        <main lang={locale} className="flex-1">
          {children}
        </main>
        <footer className="border-t border-border/60">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-muted sm:px-6">
            <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} className="h-6 w-auto opacity-80" />
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href={`mailto:${site.email}`} className="hover:text-foreground">
                {site.email}
              </a>
              <Link href={to("/mentions-legales")} className="hover:text-foreground">
                {t(locale, { fr: "Mentions légales", en: "Legal notice" })}
              </Link>
              <Link href={to("/confidentialite")} className="hover:text-foreground">
                {t(locale, { fr: "Confidentialité", en: "Privacy" })}
              </Link>
            </div>
          </div>
        </footer>
      </ProtectionProvider>
    </I18nProvider>
  );
}
