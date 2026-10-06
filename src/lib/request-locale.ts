import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, isLocale, preferredLocale, type Locale } from "@/lib/i18n";

// Langue d'une page sans préfixe /en (espace client privé) : choix mémorisé avec le
// sélecteur FR / EN, sinon langue du navigateur.
export async function requestLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;
  return preferredLocale((await headers()).get("accept-language"));
}
