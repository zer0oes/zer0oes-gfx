import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} className="h-9 w-auto" />
          <p className="mt-2 text-sm text-muted">{site.tagline}</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-muted" aria-label="Pied de page">
          <Link href="/portfolio" className="hover:text-foreground">Portfolio</Link>
          <Link href="/offres" className="hover:text-foreground">Offres</Link>
          <Link href="/a-propos" className="hover:text-foreground">À propos</Link>
          <Link href="/contact" className="hover:text-foreground">Sur-mesure & contact</Link>
          <Link href="/mentions-legales" className="hover:text-foreground">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
          <Link href="/cgv" className="hover:text-foreground">CGV</Link>
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
        © {new Date().getFullYear()} {site.name}. Tous droits réservés.
      </p>
    </footer>
  );
}
