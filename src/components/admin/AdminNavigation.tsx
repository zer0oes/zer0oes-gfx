"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";

const nav: { href: string; label: string; icon: MaterialIconName }[] = [
  { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
  { href: "/admin/devis", label: "Devis", icon: "shopping_bag" },
  { href: "/admin/commandes", label: "Commandes", icon: "shopping_bag" },
  { href: "/admin/statistiques", label: "Statistiques", icon: "assessment" },
  { href: "/admin/accueil", label: "Page d'accueil", icon: "home" },
  { href: "/admin/portfolio", label: "Portfolio", icon: "collections" },
  { href: "/admin/offres", label: "Offres et réglages", icon: "tune" },
  { href: "/admin/a-propos", label: "À propos", icon: "person" },
  { href: "/admin/contenu-legal", label: "Contenu légal", icon: "gavel" },
];

export function AdminNavigation({ collapsed = false, initialPendingOrders = 0, initialPendingQuotes = 0 }: { collapsed?: boolean; initialPendingOrders?: number; initialPendingQuotes?: number }) {
  const pathname = usePathname();
  const [pendingOrders, setPendingOrders] = useState(initialPendingOrders);
  const [pendingQuotes, setPendingQuotes] = useState(initialPendingQuotes);
  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    async function refreshCount() {
      if (document.visibilityState === "hidden" || loading) return;
      loading = true;
      try {
        const response = await fetch("/admin/commandes/en-attente", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (Number.isInteger(data.count) && data.count >= 0 && !controller.signal.aborted) setPendingOrders(data.count);
        if (Number.isInteger(data.quotes) && data.quotes >= 0 && !controller.signal.aborted) setPendingQuotes(data.quotes);
      } catch {
        // Conserver le dernier compteur connu en cas de coupure réseau.
      } finally {
        loading = false;
      }
    }
    void refreshCount();
    const interval = window.setInterval(() => void refreshCount(), 15_000);
    const refresh = () => void refreshCount();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname, initialPendingOrders, initialPendingQuotes]);
  return (
    <nav id="admin-navigation" className="flex gap-1 overflow-x-auto pb-2 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto" aria-label="Admin">
      <div role="separator" className="mb-2 hidden shrink-0 border-t border-border md:block" />
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
        const count = item.href === "/admin/devis" ? pendingQuotes : item.href === "/admin/commandes" ? pendingOrders : 0;
        return (
          <Fragment key={item.href}>
          {item.href === "/admin/accueil" && <div role="separator" className="my-2 shrink-0 border-l border-border md:border-l-0 md:border-t" />}
          <Link href={item.href} aria-current={active ? "page" : undefined} title={collapsed ? item.label : undefined}
            style={{ position: "relative" }}
            className={`flex shrink-0 items-center whitespace-nowrap rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent ${collapsed ? "mx-2 size-11 justify-center p-0 md:mx-auto" : "mx-2 gap-3 px-3 py-2.5 md:mx-3"} ${active ? "is-active bg-accent/25 font-medium text-accent ring-1 ring-inset ring-accent/40" : "text-muted hover:bg-surface-2 hover:text-foreground"}`}>
            <MaterialIcon name={item.icon} /><span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
            {count > 0 && (
              <span className={`flex h-4 min-w-4 items-center justify-center rounded-full border px-1 text-[10px] font-bold leading-none tabular-nums ${active ? "border-accent bg-accent text-background" : "border-accent/40 bg-accent/15 text-accent"} ${collapsed ? "absolute -right-1 -top-1" : "ml-auto"}`}>
                <span aria-hidden="true">{count}</span>
                <span className="sr-only">{item.href === "/admin/devis" ? `${count} nouvelle${count > 1 ? "s" : ""} demande${count > 1 ? "s" : ""} de devis` : `${count} commande${count > 1 ? "s" : ""} en attente`}</span>
              </span>
            )}
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
