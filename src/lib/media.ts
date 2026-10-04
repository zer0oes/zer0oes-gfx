// Adresse publique des médias du site (portfolio, page À propos).
// Avec NEXT_PUBLIC_MEDIA_URL (ex. https://zer0oes-gfx.s3.eu-west-3.amazonaws.com), les chemins
// « /portfolio/… » et « /a-propos/… » pointent vers le bucket S3 ; sans, vers les fichiers du site.
// Utilisable côté serveur comme côté navigateur.

const PREFIXES = ["/portfolio/", "/a-propos/"];

export function mediaBaseUrl() {
  return (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
}

export function mediaUrl<T extends string | undefined>(path: T, base = mediaBaseUrl()): T {
  if (!path || !base || !PREFIXES.some((p) => path.startsWith(p))) return path;
  return `${base}${path}` as T;
}
