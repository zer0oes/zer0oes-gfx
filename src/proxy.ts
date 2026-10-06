import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, defaultLocale, isLocale, preferredLocale, splitLocale } from "@/lib/i18n";
import { isBot } from "@/lib/stats";

// Proxy :
// - en production, force HTTPS et l'adresse canonique (NEXT_PUBLIC_SITE_URL, ex. www.)
//   derrière un hébergeur qui transmet x-forwarded-proto (Heroku) ;
// - pages publiques : langue (français sans préfixe, anglais sous /en), voir localeRouting ;
// - sur /admin, rafraîchit la session Supabase et interdit l'indexation.
// Le contrôle d'accès admin est fait côté serveur dans chaque page et action.
export async function proxy(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  const localized = localeRouting(request);
  if (localized) return withSecurityHeaders(localized);

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

// Pages publiques du site (hors admin, API, espace client et fichiers)
function isPublicPage(pathname: string) {
  return !/^\/(admin|api|commande|livraison|_next)(\/|$)/.test(pathname) && !/\.[a-z0-9]+$/i.test(pathname);
}

// Langue des pages publiques :
// - /fr/… redirige vers l'adresse sans préfixe (le français est la langue par défaut) ;
// - /en/… est servi tel quel ;
// - sans préfixe : un visiteur dont le navigateur n'est pas en français (ou qui a choisi l'anglais
//   avec le sélecteur) est envoyé sur /en/… ; sinon la page française est servie (réécriture
//   interne vers /fr/…, l'adresse ne change pas). Les robots et la navigation interne ne sont
//   jamais redirigés.
function localeRouting(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!isPublicPage(pathname)) return null;
  const { locale, path } = splitLocale(pathname);
  const prefixed = pathname !== path;

  if (prefixed && locale === defaultLocale) {
    return NextResponse.redirect(new URL(path + search, request.url), 308);
  }
  if (prefixed) return NextResponse.next({ request });

  const chosen = request.cookies.get(LOCALE_COOKIE)?.value;
  const navigation = request.method === "GET" && !request.headers.has("rsc") && !request.headers.has("next-action");
  const wanted = isLocale(chosen) ? chosen : navigation && !isBot(request.headers.get("user-agent")) ? preferredLocale(request.headers.get("accept-language")) : defaultLocale;
  if (wanted !== defaultLocale && navigation) {
    const res = NextResponse.redirect(new URL(`/${wanted}${path === "/" ? "" : path}${search}`, request.url), 307);
    res.headers.set("Vary", "Accept-Language, Cookie");
    return res;
  }
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request });
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
