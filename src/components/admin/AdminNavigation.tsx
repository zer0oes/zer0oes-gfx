"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";

const nav: { href: string; label: string; icon: MaterialIconName }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
  { href: "/admin/commandes", label: "Commandes", icon: "shopping_bag" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "assessment" },
  { href: "/admin/accueil", label: "Page d'accueil", icon: "home" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "collections" },
  { href: "/admin/offres", label: "Offres et réglages", icon: "tune" },
  { href: "/admin/a-propos", label: "À propos", icon: "person" },
  { href: "/admin/contenu-legal", label: "Contenu légal", icon: "gavel" },
];

export function AdminNavigation({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  return (
    <nav id="admin-navigation" className="flex gap-1 overflow-x-auto pb-2 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto" aria-label="Admin">
      <div role="separator" className="mb-2 hidden shrink-0 border-t border-border md:block" />
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        return (
          <Fragment key={item.href}>
          {item.href === "/admin/accueil" && <div role="separator" className="my-2 shrink-0 border-l border-border md:border-l-0 md:border-t" />}
          <Link href={item.href} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined}
            className={`flex shrink-0 items-center whitespace-nowrap rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${collapsed ? "mx-2 size-11 justify-center p-0 md:mx-auto" : "mx-2 gap-3 px-3 py-2.5 md:mx-3"} ${active ? "is-active bg-gradient-to-r from-accent-3/25 via-accent/25 to-accent-2/25 font-medium text-white ring-1 ring-inset ring-white/30" : "text-muted hover:bg-surface-2 hover:text-foreground"}`}>
            <MaterialIcon name={item.icon} /><span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
          </Link>
          </Fragment>
        );
      })}
      <div role="separator" className="my-2 shrink-0 border-l border-border md:border-l-0 md:border-t" />
      <Link href="/" target="_blank" rel="noopener noreferrer" title={collapsed ? "Voir le site" : undefined}
        className={`flex shrink-0 items-center whitespace-nowrap rounded-lg text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent ${collapsed ? "mx-2 size-11 justify-center p-0 md:mx-auto" : "mx-2 gap-3 px-3 py-2.5 md:mx-3"}`}>
        <MaterialIcon name="open_in_new" /><span className={collapsed ? "sr-only" : undefined}>Voir le site</span>
      </Link>
    </nav>
  );
}
