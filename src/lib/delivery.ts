// Livraison d'une commande : liens (partage d'overlay StreamElements…) et fichiers
// (zip Streamlabs, visuels, guide), consultables par le client via un lien privé.

// 500 Mo : limite du bucket privé « livrables »
export const DELIVERABLE_MAX_BYTES = 500 * 1024 * 1024;

// Jeton du lien privé de livraison (192 bits aléatoires, en hexadécimal)
export function newDeliveryToken() {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isDeliveryToken(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{48}$/.test(v);
}

// Seuls les liens https sont acceptés (pas de javascript:, data:, http: en clair…)
export function checkDeliveryLink(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  return u.protocol === "https:" && u.hostname.includes(".") ? u.toString() : null;
}

// Nom de fichier sûr pour le stockage (le nom d'origine reste affiché au client)
export function safeFilename(raw: string) {
  const name = raw.split(/[\\/]/).pop() ?? "";
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) : "";
  return `${base || "fichier"}${ext ? `.${ext}` : ""}`;
}

export function deliverablePath(orderId: string, filename: string, unique: string) {
  return `${orderId}/${unique}-${safeFilename(filename)}`;
}

// « 12,4 Mo »
export function formatBytes(n?: number) {
  if (!n) return "";
  const units = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: i ? 1 : 0 })} ${units[i]}`;
}

export function deliveryEmail({ offerName, url, links, files }: { offerName: string; url: string; links: number; files: number }) {
  const parts = [links ? `${links} lien${links > 1 ? "s" : ""} d'import` : "", files ? `${files} fichier${files > 1 ? "s" : ""}` : ""].filter(Boolean);
  return {
    subject: `Ta livraison zer0oes gfx est prête — ${offerName}`,
    text: [
      "Bonjour,",
      "",
      `Ta commande « ${offerName} » est prête ! Tout est réuni sur ta page de livraison${parts.length ? ` (${parts.join(" et ")})` : ""} :`,
      url,
      "",
      "Tu y trouveras les liens pour importer tes overlays sur StreamElements en un clic, et les fichiers pour Streamlabs et OBS.",
      "Garde ce lien pour toi : il donne accès à tes fichiers.",
      "",
      "Une question, une correction ? Réponds simplement à cet e-mail.",
      "",
      "À très vite en live,",
      "Aurore — zer0oes gfx",
    ].join("\n"),
  };
}

// Remarques du client sur un fichier livré (page /livraison/<jeton>)
export const MAX_NOTES = 30;
export const NOTE_MAX_CHARS = 2000;

export function cleanNote(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const body = raw.replace(/\r/g, "").trim().slice(0, NOTE_MAX_CHARS);
  return body || null;
}
