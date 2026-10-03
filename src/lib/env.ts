// Détection de l'environnement et garde-fous.

// Production : build/serveur de prod, ou n'importe quel déploiement Vercel (preview compris).
export function isProductionLike(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "production" || Boolean(env.VERCEL_ENV) || Boolean(env.VERCEL);
}

// Outils de développement (magasin JSON local, connexion admin de dev) :
// refus dur en production, même si la variable d'activation est présente.
export function assertNotProduction(feature: string, env: NodeJS.ProcessEnv = process.env) {
  if (isProductionLike(env)) throw new Error(`${feature} est interdit en production.`);
}

export function localStoreAllowed(env: NodeJS.ProcessEnv = process.env) {
  return !isProductionLike(env) && env.LOCAL_STORE !== "0";
}

export function devLoginAllowed(env: NodeJS.ProcessEnv = process.env) {
  return !isProductionLike(env) && env.ADMIN_DEV_LOGIN === "1";
}

export function supabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function supabasePublishableKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Clé secrète (service_role) : uniquement côté serveur, jamais préfixée NEXT_PUBLIC_.
export function supabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function supabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseSecretKey());
}

export function supabaseAuthConfigured() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

// E-mails autorisés à se connecter à l'admin.
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "zer0oes.pro@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email) && adminEmails().includes(email!.trim().toLowerCase());
}
