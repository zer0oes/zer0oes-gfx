"use server";

import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAB_MAX_BYTES, newLabContent, parseLabContent } from "@/lib/custom-lab/model";
import { LabConflictError, saveLabDocument } from "@/lib/custom-lab/store";
import { LabStorageError } from "@/lib/custom-lab/errors";

export async function createLabAction(form: FormData) {
  await requireAdmin();
  let id: string;
  try {
    const document = await saveLabDocument(newLabContent(form.get("kind") === "alertbox" ? "alertbox" : "widget"));
    id = document.id;
  } catch (error) {
    redirect(`/admin/streamerlab?error=${error instanceof LabStorageError && error.reason === "setup" ? "setup" : "create"}`);
  }
  revalidatePath("/admin/streamerlab");
  redirect(`/admin/streamerlab/${id}`);
}

export async function importLabAction(form: FormData) {
  await requireAdmin();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > LAB_MAX_BYTES) redirect("/admin/streamerlab?error=import");
  let id: string;
  try {
    const document = await saveLabDocument(parseLabContent(JSON.parse(await file.text())));
    id = document.id;
  } catch (error) { redirect(`/admin/streamerlab?error=${error instanceof LabStorageError ? error.reason === "setup" ? "setup" : "storage" : "import"}`); }
  revalidatePath("/admin/streamerlab");
  redirect(`/admin/streamerlab/${id}`);
}

export async function saveLabAction(id: string, revision: number, raw: unknown): Promise<{ ok: true; revision: number } | { ok: false; message: string }> {
  await requireAdmin();
  try {
    const content = parseLabContent(raw);
    const document = await saveLabDocument(content, { id, revision });
    revalidatePath("/admin/streamerlab");
    return { ok: true, revision: document.revision };
  } catch (error) {
    return { ok: false, message: error instanceof LabConflictError || error instanceof LabStorageError ? error.message : "Enregistrement impossible. Vérifie les JSON et la configuration du stockage." };
  }
}
