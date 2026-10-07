import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { href, t, type Locale } from "@/lib/i18n";

export function Footer({ locale }: { locale: Locale }) {
  const to = (path: string) => href(locale, path);
  const links = [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/offres", label: t(locale, { fr: "Packs & à la carte", en: "Packages & à la carte" }) },
    { href: "/a-propos", label: t(locale, { fr: "À propos", en: "About" }) },
    { href: "/contact", label: t(locale, { fr: "Demander un devis", en: "Request a quote" }) },
    { href: "/contact?onglet=message", label: t(locale, { fr: "Poser une question", en: "Ask a question" }) },
    { href: "/mentions-legales", label: t(locale, { fr: "Mentions légales", en: "Legal notice" }) },
    { href: "/confidentialite", label: t(locale, { fr: "Confidentialité", en: "Privacy" }) },
    { href: "/cgv", label: t(locale, { fr: "CGV", en: "Terms of sale" }) },
  ];
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} className="h-9 w-auto" />
          <p className="mt-2 text-sm text-muted">{t(locale, { fr: site.tagline, en: "Custom visual identities and stream overlays" })}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-muted" aria-label={t(locale, { fr: "Pied de page", en: "Footer" })}>
          {links.map((l) => (
            <Link key={l.href} href={to(l.href)} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 text-sm text-muted">
          <a href={`mailto:${site.email}`} className="hover:text-foreground">{site.email}</a>
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              {s.label}
            </a>
          ))}
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted/70">
        © {new Date().getFullYear()} {site.name}. {t(locale, { fr: "Tous droits réservés.", en: "All rights reserved." })}
      </p>
    </footer>
  );
}
