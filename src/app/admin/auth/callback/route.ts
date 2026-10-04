import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthClient } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";
import { siteUrl } from "@/lib/site-url";

// Retour du lien magique Supabase : ouvre la session, uniquement pour un e-mail admin.
// Les redirections partent de l'adresse publique du site : derrière Heroku, request.url
// porte l'adresse interne (localhost:PORT).
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const base = await siteUrl();
  const login = new URL("/admin/connexion", base);
  // Lien refusé par Supabase (expiré, déjà utilisé…)
  if (request.nextUrl.searchParams.get("error")) {
    login.searchParams.set("erreur", "expire");
    return NextResponse.redirect(login);
  }
  if (!code) return NextResponse.redirect(login);

  const supabase = await supabaseAuthClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    login.searchParams.set("erreur", "1");
    return NextResponse.redirect(login);
  }
  return NextResponse.redirect(new URL("/admin", base));
}
