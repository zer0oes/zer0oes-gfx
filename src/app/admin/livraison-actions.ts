"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { checkDeliveryLink, DELIVERABLE_MAX_BYTES, deliverablePath, pendingPreview, previewsEmail, isDeliverableType, mediaKind, newDeliveryToken } from "@/lib/delivery";
import { notify, sendToCustomer } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import { s3Configured, s3DeliverableDelete, s3DeliverableUpload } from "@/lib/s3";
import { getStore } from "@/lib/store";

// Fichiers livrés stockés dans S3 : supprimés du bucket avec l'élément (ou à son remplacement)
async function removeFromBucket(...paths: (string | undefined)[]) {
  if (!s3Configured()) return;
  for (const p of paths) if (p) await s3DeliverableDelete(p).catch((e) => console.error(e));
}

function back(orderId: string, message?: { error?: string; ok?: string }): never {
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/commande/[token]", "page");
  const q = message?.error ? `erreur=${encodeURIComponent(message.error)}` : `enregistre=${encodeURIComponent(message?.ok ?? "1")}`;
  redirect(`/admin/commandes/${orderId}?${q}#livraison`);
}

function text(formData: FormData, name: string, max: number) {
  return (formData.get(name)?.toString() ?? "").trim().slice(0, max);
}

// Lien d'import (ex. overlay StreamElements partagé)
export async function addDeliveryLinkAction(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId", 60);
  const label = text(formData, "label", 120);
  const url = checkDeliveryLink(text(formData, "url", 2000));
  if (!label) back(orderId, { error: "Donne un nom au lien (ex. « Overlay Starting — StreamElements »)." });
  if (!url) back(orderId, { error: "Le lien doit commencer par https://." });
  if (!(await getStore().getOrder(orderId))) back(orderId, { error: "Commande introuvable." });
  const targetId = text(formData, "targetId", 60);
  if (targetId) {
    const store = getStore();
    const item = (await store.listDeliverables(orderId)).find((d) => d.id === targetId);
    if (!item) back(orderId, { error: "Livrable introuvable." });
    await store.updateDeliverable(item.id, { finalAssets: [...(item.finalAssets ?? []), { label, url }] });
  } else await getStore().addDeliverable({ orderId, kind: "lien", label, url });
  back(orderId, { ok: "Lien ajouté." });
}

export type DeliveryUploadTicket =
  | { mode: "signed"; path: string; token: string }
  | { mode: "s3"; path: string; uploadUrl: string; contentType: string }
  | { mode: "direct" }
  | { mode: "error"; message: string };

// Étape 1 d'un envoi de fichier : contrôle puis URL d'envoi signée vers le stockage privé
export async function prepareDeliverableUpload(input: { orderId: string; filename: string; size: number; type?: string }): Promise<DeliveryUploadTicket> {
  await requireAdmin();
  const store = getStore();
  if (!(await store.getOrder(input.orderId))) return { mode: "error", message: "Commande introuvable." };
  if (input.size <= 0 || input.size > DELIVERABLE_MAX_BYTES) return { mode: "error", message: "Fichier vide ou trop lourd (500 Mo maximum)." };
  // Bucket S3 : le navigateur envoie le fichier directement dans le dossier privé (lien signé)
  if (s3Configured()) {
    const path = deliverablePath(input.orderId, input.filename, randomUUID().slice(0, 8));
    const contentType = /^[\w.+-]+\/[\w.+-]+$/.test(input.type ?? "") ? input.type! : "application/octet-stream";
    return { mode: "s3", path, uploadUrl: await s3DeliverableUpload(path, contentType), contentType };
  }
  if (store.createDeliverableUpload) {
    const path = deliverablePath(input.orderId, input.filename, randomUUID().slice(0, 8));
    const { token } = await store.createDeliverableUpload(path);
    return { mode: "signed", path, token };
  }
  if (store.saveDeliverableFile) return { mode: "direct" };
  return { mode: "error", message: "Aucun stockage configuré (voir README)." };
}

// Étape 2 : enregistrement du fichier envoyé
export async function finalizeDeliverable(input: { orderId: string; label: string; path: string; size: number; targetId?: string }) {
  await requireAdmin();
  if (!input.path.startsWith(`${input.orderId}/`)) return { error: "Chemin de fichier invalide." };
  if (input.targetId) {
    const store = getStore();
    const item = (await store.listDeliverables(input.orderId)).find((d) => d.id === input.targetId);
    if (!item) return { error: "Livrable introuvable." };
    await store.updateDeliverable(item.id, { finalAssets: [...(item.finalAssets ?? []), { path: input.path, label: input.label.trim().slice(0, 120) || input.path.split("/").pop()! }] });
    revalidatePath(`/admin/commandes/${input.orderId}`);
    revalidatePath("/commande/[token]", "page");
    return { ok: true };
  }
  await getStore().addDeliverable({
    orderId: input.orderId,
    kind: "fichier",
    label: input.label.trim().slice(0, 120) || input.path.split("/").pop()!,
    storagePath: input.path,
    sizeBytes: input.size,
  });
  revalidatePath(`/admin/commandes/${input.orderId}`);
  revalidatePath("/commande/[token]", "page");
  return { ok: true };
}

// Envoi via le serveur (magasin local de développement uniquement)
export async function uploadDeliverableDirect(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const orderId = text(formData, "orderId", 60);
  const file = formData.get("file");
  if (!store.saveDeliverableFile) return { error: "Envoi direct indisponible." };
  if (!(file instanceof File) || file.size <= 0 || file.size > DELIVERABLE_MAX_BYTES) return { error: "Fichier vide ou trop lourd." };
  const path = deliverablePath(orderId, file.name, randomUUID().slice(0, 8));
  const previewFor = text(formData, "previewFor", 60);
  if (previewFor && !mediaKind(path)) return { error: "L'aperçu doit être une image ou une vidéo." };
  await store.saveDeliverableFile(path, new Uint8Array(await file.arrayBuffer()));
  if (previewFor) return attachDeliverablePreview({ orderId, id: previewFor, path });
  const targetId = text(formData, "targetId", 60);
  if (targetId) return finalizeDeliverable({ orderId, targetId, label: text(formData, "label", 120) || file.name, path, size: file.size });
  await store.addDeliverable({ orderId, kind: "fichier", label: text(formData, "label", 120) || file.name, storagePath: path, sizeBytes: file.size });
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/commande/[token]", "page");
  return { ok: true };
}

export async function deleteDeliverableAction(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId", 60);
  const id = text(formData, "id", 60);
  const items = await getStore().listDeliverables(orderId);
  const item = items.find((d) => d.id === id);
  if (!item) back(orderId, { error: "Élément introuvable." });
  await getStore().deleteDeliverable(id);
  await removeFromBucket(item.storagePath, item.previewPath);
  await removeFromBucket(...(item.previewVersions ?? []).map((v) => v.path));
  await removeFromBucket(...(item.finalAssets ?? []).map((asset) => asset.path));
  back(orderId, { ok: "Élément retiré." });
}

// Envoie au client le lien privé de sa page de livraison (créé au premier envoi).
export async function sendDeliveryAction(formData: FormData) {
  await requireAdmin();
  const store = getStore();
  const orderId = text(formData, "orderId", 60);
  const order = await store.getOrder(orderId);
  if (!order) back(orderId, { error: "Commande introuvable." });
  if (!order.customerEmail) back(orderId, { error: "Aucun e-mail client sur cette commande." });
  const items = await store.listDeliverables(orderId);
  if (!items.length) back(orderId, { error: "Ajoute au moins un lien ou un fichier avant d'envoyer." });
  const ready = items.filter((item) => pendingPreview(item));
  if (!ready.length) back(orderId, { ok: "Aucun nouvel aperçu à envoyer : ces versions ont déjà été notifiées." });
  const token = order.deliveryToken ?? newDeliveryToken();
  const url = `${await siteUrl()}/commande/${token}`;
  await store.updateOrder(orderId, { deliveryToken: token });
  for (const item of ready) {
    const publishedAt = new Date().toISOString();
    const path = pendingPreview(item)!;
    const versions = item.previewVersions ?? [];
    await store.updateDeliverable(item.id, { publishedAt, previewVersions: versions.at(-1)?.path === path ? versions : [...versions, { path, publishedAt }] });
  }
  const mail = previewsEmail({ offerName: order.offerName, url, labels: ready.map((item) => item.label), paid: order.amountPaid >= order.totalPrice });
  const key = createHash("sha256").update(JSON.stringify(ready.map((item) => [item.id, pendingPreview(item)]).sort())).digest("hex");
  const sent = await sendToCustomer({ to: order.customerEmail, subject: mail.subject, text: mail.text, idempotencyKey: `previews-${order.id}-${key}` });
  if (sent.sent) for (const item of ready) await store.updateDeliverable(item.id, { notifiedPreview: pendingPreview(item)! });
  await store.updateOrder(orderId, {
    deliveryToken: token,
    deliveredAt: new Date().toISOString(),
    ...(["payee", "brief_recu", "en_cours"].includes(order.status) ? { status: "livree" as const } : {}),
  });
  await notify({ subject: `[Aperçus envoyés] ${order.offerName} — ${order.customerEmail}`, fields: { Commande: order.id, Lien: url } });
  back(orderId, { ok: sent.sent ? "Aperçus envoyés au client." : "Lien de livraison créé (e-mail affiché dans les logs : Resend n'est pas configuré)." });
}

// --- Type d'élément et aperçu protégé (page de livraison) --------------------------------

export async function setDeliverableTypeAction(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId", 60);
  const id = text(formData, "id", 60);
  const type = formData.get("type");
  if (!isDeliverableType(type)) back(orderId, { error: "Type d'élément invalide." });
  if (!(await getStore().listDeliverables(orderId)).some((d) => d.id === id)) back(orderId, { error: "Élément introuvable." });
  const label = text(formData, "label", 120);
  await getStore().updateDeliverable(id, { itemType: type, ...(label ? { label } : {}) });
  back(orderId, { ok: "Type enregistré." });
}

// Aperçu envoyé (image ou vidéo basse résolution) : rattaché à l'élément livré
export async function attachDeliverablePreview(input: { orderId: string; id: string; path: string }) {
  await requireAdmin();
  if (!input.path.startsWith(`${input.orderId}/`)) return { error: "Chemin de fichier invalide." };
  const kind = mediaKind(input.path);
  if (!kind) return { error: "L'aperçu doit être une image (PNG, JPG, WEBP) ou une vidéo (MP4, WEBM)." };
  if (kind === "video") return { error: "Utilise une image d’aperçu : les vidéos doivent être transcodées avant publication." };
  const item = (await getStore().listDeliverables(input.orderId)).find((d) => d.id === input.id);
  if (!item) return { error: "Élément introuvable." };
  await getStore().updateDeliverable(input.id, { previewPath: input.path, previewType: kind, publishedAt: null });
  if (item.approvedAt) await getStore().setDeliverableApproval(item.id, false);
  revalidatePath(`/admin/commandes/${input.orderId}`);
  revalidatePath("/commande/[token]", "page");
  return { ok: true };
}

export async function removeDeliverablePreviewAction(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId", 60);
  const id = text(formData, "id", 60);
  const item = (await getStore().listDeliverables(orderId)).find((d) => d.id === id);
  if (!item) back(orderId, { error: "Élément introuvable." });
  await getStore().updateDeliverable(id, { previewPath: null, previewType: null, publishedAt: null });
  if (item.approvedAt) await getStore().setDeliverableApproval(item.id, false);
  back(orderId, { ok: "Aperçu retiré." });
}

// Lien de l'espace commande pour une commande qui n'en a pas encore (commandes antérieures)
export async function createPortalLinkAction(formData: FormData) {
  await requireAdmin();
  const orderId = text(formData, "orderId", 60);
  const order = await getStore().getOrder(orderId);
  if (!order) back(orderId, { error: "Commande introuvable." });
  if (!order.deliveryToken) await getStore().updateOrder(orderId, { deliveryToken: newDeliveryToken() });
  back(orderId, { ok: "Lien de l'espace commande créé." });
}
