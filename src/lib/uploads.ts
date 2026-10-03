// Règles d'envoi des médias du portfolio (vérifiées côté serveur ; le bucket
// Supabase « portfolio » applique aussi une limite de 20 Mo et une liste de types).

export type MediaKind = "image" | "video" | "emote";

export const uploadRules: Record<MediaKind, { types: string[]; maxBytes: number; label: string }> = {
  image: { types: ["image/webp", "image/png", "image/jpeg", "image/gif"], maxBytes: 5 * 1024 * 1024, label: "image (WebP, PNG, JPEG, GIF, 5 Mo max)" },
  video: { types: ["video/mp4", "video/webm"], maxBytes: 20 * 1024 * 1024, label: "vidéo (MP4 ou WebM, 20 Mo max)" },
  emote: { types: ["image/webp", "image/png", "image/gif"], maxBytes: 2 * 1024 * 1024, label: "emote (WebP, PNG ou GIF, 2 Mo max)" },
};

const extensions: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

export function checkUpload(kind: MediaKind, type: string, size: number): string | null {
  const rule = uploadRules[kind];
  if (!rule) return "Type d'envoi inconnu.";
  if (!rule.types.includes(type)) return `Format refusé : ${rule.label}.`;
  if (size <= 0 || size > rule.maxBytes) return `Fichier trop lourd : ${rule.label}.`;
  return null;
}

// Vérifie la signature binaire réelle du fichier (pas seulement le type annoncé).
export function sniffType(bytes: Uint8Array): string | null {
  const b = (i: number) => bytes[i];
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (b(0) === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (ascii(0, 4) === "GIF8") return "image/gif";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp") return "video/mp4";
  if (b(0) === 0x1a && b(1) === 0x45 && b(2) === 0xdf && b(3) === 0xa3) return "video/webm";
  return null;
}

// Chemin de stockage : dossier par streameur, nom normalisé et horodaté.
export function storagePath(folder: string, filename: string, type: string) {
  const base =
    filename
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "media";
  const safeFolder = folder.toLowerCase().replace(/[^a-z0-9-]/g, "") || "divers";
  return `${safeFolder}/${base}-${Date.now().toString(36)}.${extensions[type] ?? "bin"}`;
}
