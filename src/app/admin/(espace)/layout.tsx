import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { logoutAction } from "../actions";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/statistiques", label: "Statistiques" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/offres", label: "Offres et réglages" },
  { href: "/admin/accueil", label: "Page d'accueil" },
  { href: "/admin/portfolio", label: "Portfolio" },
];

// Toutes les pages de ce groupe exigent un admin connecté (contrôle côté serveur).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const store = getStore();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-border bg-surface md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-4 p-4 md:block">
          <Link href="/admin" className="font-display text-lg font-bold">
            Admin <span className="text-gradient">gfx</span>
          </Link>
          <p className="truncate text-xs text-muted md:mt-1">{admin.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3" aria-label="Admin">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
          <Link href="/" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-foreground">
            Voir le site ↗
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-foreground">
              Déconnexion
            </button>
          </form>
        </nav>
        {store.kind !== "supabase" && (
          <p className="m-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
            {store.kind === "local"
              ? "Mode développement : données dans .data/dev-store.json (pas de Supabase)."
              : "Aucune base configurée : lecture seule."}
          </p>
        )}
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
