import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { supabaseConfigured, supabaseSecretKey, supabaseUrl } from "@/lib/env";
import { mediaBaseUrl } from "@/lib/media";
import { s3Configured, s3Delete, s3SignedUpload } from "@/lib/s3";
import { LabStorageError } from "./errors";

// Médias du Laboratoire : fichiers dans le bucket S3 (dossier public « laboratoire/ », adresses https stables
// utilisables sur StreamElements et Streamlabs), liste dans la table privée custom_lab_media.
// Les pages et actions doivent vérifier requireAdmin avant tout appel.

export type LabMedia = { id: string; name: string; path: string; url: string; contentType: string; sizeBytes: number; createdAt: string };

// Formats acceptés (contrôlés aussi par le type déclaré au moment de l'envoi signé)
export const LAB_MEDIA_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "video/webm": "webm",
  "video/mp4": "mp4",
};
export const LAB_MEDIA_MAX_BYTES = 30 * 1024 * 1024;

export function labMediaCheck(type: string, size: number): string | null {
  if (!LAB_MEDIA_TYPES[type]) return "Format non accepté : images (PNG, JPG, WebP, GIF, SVG), sons (MP3, OGG, WAV) ou vidéos (WebM, MP4).";
  if (!Number.isSafeInteger(size) || size <= 0 || size > LAB_MEDIA_MAX_BYTES) return "Fichier trop lourd : 30 Mo maximum.";
  return null;
}

// Chemin de stockage : identifiant unique + nom lisible (sans caractères spéciaux)
export function labMediaPath(filename: string, type: string) {
  const base = filename.replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "media";
  return `laboratoire/${randomUUID().slice(0, 8)}-${base}.${LAB_MEDIA_TYPES[type]}`;
}

// Adresse publique d'un média (même règle que les fichiers du portfolio dans S3)
export const labMediaUrl = (path: string) => `${mediaBaseUrl()}/portfolio/${path}`;

const database = () => createClient(supabaseUrl()!, supabaseSecretKey()!, { auth: { persistSession: false, autoRefreshToken: false } });
const fromRow = (r: Record<string, unknown>): LabMedia => ({
  id: r.id as string,
  name: r.name as string,
  path: r.path as string,
  url: r.url as string,
  contentType: r.content_type as string,
  sizeBytes: r.size_bytes as number,
  createdAt: r.created_at as string,
});

export function labMediaAvailable() {
  return supabaseConfigured() && s3Configured();
}

export async function listLabMedia(): Promise<LabMedia[]> {
  if (!labMediaAvailable()) return [];
  const { data, error } = await database().from("custom_lab_media").select("*").order("created_at", { ascending: false });
  if (error) throw new LabStorageError(error.code);
  return data.map(fromRow);
}

export async function signLabMediaUpload(filename: string, type: string) {
  const path = labMediaPath(filename, type);
  const { uploadUrl, publicUrl } = await s3SignedUpload(path, type);
  return { path, uploadUrl, url: publicUrl };
}

export async function addLabMedia(media: Omit<LabMedia, "id" | "createdAt">): Promise<LabMedia> {
  const { data, error } = await database()
    .from("custom_lab_media")
    .insert({ name: media.name, path: media.path, url: media.url, content_type: media.contentType, size_bytes: media.sizeBytes })
    .select()
    .single();
  if (error) throw new LabStorageError(error.code);
  return fromRow(data);
}

export async function deleteLabMedia(id: string) {
  const db = database();
  const { data, error } = await db.from("custom_lab_media").select("path").eq("id", id).maybeSingle();
  if (error) throw new LabStorageError(error.code);
  if (!data) return;
  await s3Delete(data.path as string);
  const removed = await db.from("custom_lab_media").delete().eq("id", id);
  if (removed.error) throw new LabStorageError(removed.error.code);
}
