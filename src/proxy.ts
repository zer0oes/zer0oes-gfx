import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Proxy :
// - en production, force HTTPS et l'adresse canonique (NEXT_PUBLIC_SITE_URL, ex. www.)
//   derrière un hébergeur qui transmet x-forwarded-proto (Heroku) ;
// - sur /admin, rafraîchit la session Supabase et interdit l'indexation.
// Le contrôle d'accès admin est fait côté serveur dans chaque page et action.
export async function proxy(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  let response = NextResponse.next({ request });
  if (!request.nextUrl.pathname.startsWith("/admin")) return withSecurityHeaders(response);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          for (const { name, value } of list) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of list) response.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getUser();
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return withSecurityHeaders(response);
}

function canonicalRedirect(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  let target: URL | null = null;
  if (site) {
    const canonical = new URL(site);
    // Domaine nu ↔ www : on renvoie vers l'adresse canonique (même domaine seulement)
    const bare = (h: string) => h.replace(/^www\./, "");
    if (host && host !== canonical.host && bare(host) === bare(canonical.host)) {
      target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
    }
  }
  // HTTPS forcé derrière l'hébergeur (pas en local : Next y renseigne lui-même « http »)
  const local = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
  if (!target && proto === "http" && !local) {
    target = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${host}`);
  }
  return target ? NextResponse.redirect(target, 308) : null;
}

function withSecurityHeaders(response: NextResponse) {
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  // Toutes les pages, sauf l'API (webhook Stripe) et les fichiers statiques
  matcher: ["/((?!api/|_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|portfolio/.*\\.|uploads/|icons/|logo-).*)"],
};
