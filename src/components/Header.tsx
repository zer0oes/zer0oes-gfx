"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { splitLocale, t } from "@/lib/i18n";
import { LanguageSwitch, useHref, useLocale } from "./I18nProvider";

export function Header() {
  const locale = useLocale();
  const to = useHref();
  const { path: pathname } = splitLocale(usePathname());
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/portfolio", label: "Portfolio" },
    { href: "/offres", label: t(locale, { fr: "Offres", en: "Pricing" }) },
    { href: "/a-propos", label: t(locale, { fr: "À propos", en: "About" }) },
  ];
  const cta = t(locale, { fr: "Parlons de ton projet ↗", en: "Let's talk about your project ↗" });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={to("/")} className="shrink-0" onClick={() => setOpen(false)}>
          <Image src="/logo-zeroes-gfx.png" alt="zer0oes gfx" width={1400} height={250} priority className="h-9 w-auto sm:h-10" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label={t(locale, { fr: "Navigation principale", en: "Main navigation" })}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={to(l.href)}
              className={`text-sm transition-colors hover:text-foreground ${
                pathname.startsWith(l.href) ? "text-foreground" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <LanguageSwitch />
          <Link
            href={to("/contact")}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background transition hover:brightness-110"
          >
            {cta}
          </Link>
        </nav>

        <button
          type="button"
          className="md:hidden rounded-md p-2 text-muted hover:text-foreground"
          aria-expanded={open}
          aria-label={t(locale, { fr: "Ouvrir le menu", en: "Open menu" })}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="border-t border-border/60 px-4 pb-4 md:hidden" aria-label={t(locale, { fr: "Navigation mobile", en: "Mobile navigation" })}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={to(l.href)}
              onClick={() => setOpen(false)}
              className="block py-3 text-muted hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Link
              href={to("/contact")}
              onClick={() => setOpen(false)}
              className="inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background"
            >
              {cta}
            </Link>
            <LanguageSwitch />
          </div>
        </nav>
      )}
    </header>
  );
}
