"use server";

import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAB_MAX_BYTES, newLabContent, parseLabContent } from "@/lib/custom-lab/model";
import { LabConflictError, saveLabDocument } from "@/lib/custom-lab/store";
import { LabStorageError } from "@/lib/custom-lab/errors";
import { createLabProject, deleteLabProject, updateLabProject } from "@/lib/custom-lab/projects";
import { addLabMedia, deleteLabMedia, labMediaAvailable, labMediaCheck, labMediaUrl, listLabMedia, signLabMediaUpload, type LabMedia } from "@/lib/custom-lab/media";

export async function createLabAction(form: FormData) {
  await requireAdmin();
  let id: string;
  try {
    const document = await saveLabDocument(newLabContent(form.get("kind") === "alertbox" ? "alertbox" : form.get("kind") === "overlay" ? "overlay" : "widget"));
    id = document.id;
  } catch (error) {
    redirect(`/admin/laboratoire?error=${error instanceof LabStorageError && error.reason === "setup" ? "setup" : "create"}`);
  }
  revalidatePath("/admin/laboratoire");
  redirect(`/admin/laboratoire/${id}`);
}

export async function importLabAction(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > LAB_MAX_BYTES) redirect("/admin/laboratoire?error=import");
  let id: string;
  try {
    const document = await saveLabDocument(parseLabContent(JSON.parse(await file.text())));
    id = document.id;
  } catch (error) { redirect(`/admin/laboratoire?error=${error instanceof LabStorageError ? error.reason === "setup" ? "setup" : "storage" : "import"}`); }
  revalidatePath("/admin/laboratoire");
  redirect(`/admin/laboratoire/${id}`);
}

export async function saveLabAction(id: string, revision: number, raw: unknown): Promise<{ ok: true; revision: number } | { ok: false; message: string }> {
  await requireAdmin();
  try {
    const content = parseLabContent(raw);
    const document = await saveLabDocument(content, { id, revision });
    revalidatePath("/admin/laboratoire");
    return { ok: true, revision: document.revision };
  } catch (error) {
    return { ok: false, message: error instanceof LabConflictError || error instanceof LabStorageError ? error.message : "Enregistrement impossible. Vérifie les JSON et la configuration du stockage." };
  }
}

// --- Médias du Laboratoire -------------------------------------------------------

export async function listLabMediaAction(): Promise<{ ok: true; media: LabMedia[] } | { ok: false; message: string }> {
  await requireAdmin();
  if (!labMediaAvailable()) return { ok: false, message: "Les médias nécessitent Supabase et le bucket S3 configurés." };
  try {
    return { ok: true, media: await listLabMedia() };
  } catch (error) {
    return { ok: false, message: error instanceof LabStorageError ? error.message : "Médias indisponibles." };
  }
}

// Étape 1 : contrôle puis lien d'envoi signé vers S3 (le navigateur envoie le fichier directement)
export async function prepareLabMediaAction(input: { filename: string; type: string; size: number }) {
  await requireAdmin();
  if (!labMediaAvailable()) return { ok: false as const, message: "Les médias nécessitent Supabase et le bucket S3 configurés." };
  const error = labMediaCheck(input.type, input.size);
  if (error) return { ok: false as const, message: error };
  return { ok: true as const, ...(await signLabMediaUpload(String(input.filename).slice(0, 200), input.type)) };
}

// Étape 2 : le fichier est dans S3, on l'ajoute à la liste
export async function finalizeLabMediaAction(input: { name: string; path: string; type: string; size: number }) {
  await requireAdmin();
  if (!/^laboratoire\/[\w-]+\.[a-z0-9]+$/.test(input.path) || labMediaCheck(input.type, input.size)) return { ok: false as const, message: "Fichier invalide." };
  try {
    const media = await addLabMedia({ name: input.name.slice(0, 200) || input.path, path: input.path, url: labMediaUrl(input.path), contentType: input.type, sizeBytes: input.size });
    return { ok: true as const, media };
  } catch (error) {
    return { ok: false as const, message: error instanceof LabStorageError ? error.message : "Enregistrement du média impossible." };
  }
}

export async function deleteLabMediaAction(id: string) {
  await requireAdmin();
  try {
    await deleteLabMedia(id);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: error instanceof LabStorageError ? error.message : "Suppression impossible." };
  }
}

// --- Projets du Laboratoire --------------------------------------------------------

const labText = (form: FormData, key: string, max: number) => (form.get(key)?.toString() ?? "").trim().slice(0, max);

export async function saveLabProjectAction(form: FormData) {
  await requireAdmin();
  const id = labText(form, "id", 60);
  const name = labText(form, "name", 120);
  if (!name) redirect("/admin/laboratoire?error=projet");
  try {
    if (id) await updateLabProject(id, { name, description: labText(form, "description", 500), archived: form.get("archived") === "on" });
    else await createLabProject(name, labText(form, "description", 500));
  } catch {
    redirect("/admin/laboratoire?error=projet");
  }
  revalidatePath("/admin/laboratoire");
  redirect("/admin/laboratoire");
}

export async function deleteLabProjectAction(form: FormData) {
  await requireAdmin();
  try {
    await deleteLabProject(labText(form, "id", 60));
  } catch {
    redirect("/admin/laboratoire?error=projet");
  }
  revalidatePath("/admin/laboratoire");
  redirect("/admin/laboratoire");
}
