"use server";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { revalidatePath } from "next/cache";

export async function uploadBriefLogo(_state: { message: string }, form: FormData) {
  await requireAdmin();
  const id = form.get("orderId")?.toString() ?? "";
  const store = getStore();
  const order = await store.getOrder(id);
  const file = form.get("image");
  if (!order || !store.saveDeliverableFile) return { message: "Commande ou stockage indisponible." };
  if (!(file instanceof File) || file.size <= 0 || file.size > 5 * 1024 * 1024) return { message: "Choisis une image de moins de 5 Mo." };
  try {
    const bytes = await sharp(await file.arrayBuffer(), { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true }).webp().toBuffer();
    const path = `${id}/logo-preview-${randomUUID()}.webp`;
    await store.saveDeliverableFile(path, bytes);
    await store.updateOrder(id, { briefLogoPreview: path });
    revalidatePath(`/admin/commandes/${id}`);
    return { message: "Aperçu du logo enregistré." };
  } catch { return { message: "L’image n’a pas pu être enregistrée. Utilise un PNG, JPG ou WEBP." }; }
}
