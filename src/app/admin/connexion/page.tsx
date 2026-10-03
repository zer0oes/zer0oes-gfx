import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdmin } from "@/lib/auth";
import { devLoginAllowed, supabaseAuthConfigured } from "@/lib/env";
import { devLoginAction } from "../actions";

export const metadata: Metadata = { title: "Connexion" };

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/connexion">) {
  if (await getAdmin()) redirect("/admin");
  const { erreur } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <h1 className="font-display text-2xl font-bold">Admin zer0oes gfx</h1>
        {erreur && (
          <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            Lien invalide, expiré ou adresse non autorisée.
          </p>
        )}
        {supabaseAuthConfigured() ? (
          <LoginForm />
        ) : (
          <p className="mt-4 text-sm text-muted">
            La connexion par lien magique nécessite Supabase (voir README).
          </p>
        )}
        {devLoginAllowed() && (
          <form action={devLoginAction} className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-xs text-amber-200">Développement uniquement : désactivé en production.</p>
            <button type="submit" className="w-full rounded-full border border-amber-500/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-500/10">
              Connexion de développement
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
