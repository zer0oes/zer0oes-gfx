import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  assertNotProduction,
  devLoginAllowed,
  isAdminEmail,
  supabaseAuthConfigured,
  supabasePublishableKey,
  supabaseUrl,
} from "@/lib/env";

// Client Supabase lié aux cookies de la requête (session de l'admin connecté).
export async function supabaseAuthClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl()!, supabasePublishableKey()!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Appel depuis un composant serveur : le proxy se charge du rafraîchissement.
        }
      },
    },
  });
}

// Connexion de développement (sans Supabase) : cookie signé, refusée en production.
const DEV_COOKIE = "zgfx_dev_admin";
let devSecret: string | null = null;
function devSign(value: string) {
  assertNotProduction("La connexion admin de développement");
  devSecret ??= process.env.ADMIN_SESSION_SECRET || randomBytes(32).toString("hex");
  return createHmac("sha256", devSecret).update(value).digest("hex");
}

export async function devLogin(email: string) {
  if (!devLoginAllowed()) throw new Error("Connexion de développement désactivée.");
  const store = await cookies();
  store.set(DEV_COOKIE, `${email}.${devSign(email)}`, { httpOnly: true, sameSite: "lax", path: "/admin", maxAge: 60 * 60 * 8 });
}

async function devAdmin(): Promise<string | null> {
  if (!devLoginAllowed()) return null;
  const raw = (await cookies()).get(DEV_COOKIE)?.value;
  if (!raw) return null;
  const i = raw.lastIndexOf(".");
  const email = raw.slice(0, i);
  const sig = Buffer.from(raw.slice(i + 1));
  const expected = Buffer.from(devSign(email));
  return sig.length === expected.length && timingSafeEqual(sig, expected) && isAdminEmail(email) ? email : null;
}

export type Admin = { email: string; via: "supabase" | "dev" };

// Admin connecté, ou null. Toujours vérifié côté serveur (pages et actions).
export async function getAdmin(): Promise<Admin | null> {
  const dev = await devAdmin();
  if (dev) return { email: dev, via: "dev" };
  if (!supabaseAuthConfigured()) return null;
  const { data } = await (await supabaseAuthClient()).auth.getUser();
  const email = data.user?.email;
  return email && isAdminEmail(email) ? { email, via: "supabase" } : null;
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/connexion");
  return admin;
}

export async function logout() {
  const store = await cookies();
  store.delete({ name: DEV_COOKIE, path: "/admin" });
  if (supabaseAuthConfigured()) await (await supabaseAuthClient()).auth.signOut();
}
