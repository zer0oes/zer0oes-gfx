"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { AdminNavigation } from "./AdminNavigation";
import { MaterialIcon } from "./MaterialIcon";

export function AdminSidebar({ email, storeKind }: { email: string; storeKind: "supabase" | "local" | "static" }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleLabel = collapsed ? "Déplier le menu" : "Replier le menu";
  return (
    <aside className={`flex flex-col border-b border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none md:sticky md:top-0 md:h-dvh md:shrink-0 md:self-start md:border-b-0 md:border-r ${collapsed ? "md:w-20" : "md:w-64"}`}>
      <div className="shrink-0 p-3">
        <div className={`flex items-center gap-2 ${collapsed ? "md:flex-col" : "justify-between"}`}>
          <Link href="/admin" aria-label="Tableau de bord — zer0oes gfx" className="inline-flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
            <Image src="/favicon.ico" alt="" width={40} height={40} unoptimized className="size-10 shrink-0 object-contain" />
            <span className={collapsed ? "sr-only" : "font-display text-base font-bold"}>Administation</span>
          </Link>
          <button type="button" onClick={() => setCollapsed((value) => !value)} aria-label={toggleLabel} title={toggleLabel}
            aria-expanded={!collapsed} aria-controls="admin-navigation"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent">
            <MaterialIcon name={collapsed ? "chevron_right" : "chevron_left"} />
          </button>
        </div>
        <p className={collapsed ? "sr-only" : "mt-2 truncate text-xs text-muted"}>{email}</p>
      </div>
      <AdminNavigation collapsed={collapsed} />
      {storeKind !== "supabase" && (
        <p className={collapsed ? "sr-only" : "m-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200"}>
          {storeKind === "local" ? "Mode développement : données dans .data/dev-store.json (pas de Supabase)." : "Aucune base configurée : lecture seule."}
        </p>
      )}
      <form action={logoutAction} className={`mt-auto shrink-0 border-t border-border ${collapsed ? "p-2" : "p-3"}`}>
        <button type="submit" title={collapsed ? "Déconnexion" : undefined}
          className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent ${collapsed ? "justify-center px-2" : "px-3"}`}>
          <MaterialIcon name="logout" /><span className={collapsed ? "sr-only" : undefined}>Déconnexion</span>
        </button>
      </form>
    </aside>
  );
}
