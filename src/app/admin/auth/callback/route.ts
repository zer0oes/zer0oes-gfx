import { NextResponse, type NextRequest } from "next/server";
import { supabaseAuthClient } from "@/lib/auth";
import { isAdminEmail } from "@/lib/env";

// Retour du lien magique Supabase : ouvre la session, uniquement pour un e-mail admin.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const login = new URL("/admin/connexion", request.url);
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
  return NextResponse.redirect(new URL("/admin", request.url));
}
