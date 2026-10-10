"use server";

import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { LAB_MAX_BYTES, newLabContent, parseLabContent } from "@/lib/custom-lab/model";
import { randomUUID } from "node:crypto";
import { getLabDocument, LabConflictError, listLabSources, saveLabDocument } from "@/lib/custom-lab/store";
import { labOverlayHtml, labPlatformZip, type LabExportFile } from "@/lib/custom-lab/export";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import { deliverablePath, deliveryLocked } from "@/lib/delivery";
import { s3Configured, s3DeliverableDelete } from "@/lib/s3";
import { getStore } from "@/lib/store";
import { orderStatuses } from "@/lib/store/types";
import { LabStorageError } from "@/lib/custom-lab/errors";
import { createLabProject, deleteLabProject, updateLabProject } from "@/lib/custom-lab/projects";
import { addLabMedia, deleteLabMedia, labMediaAvailable, labMediaCheck, labMediaUrl, listLabMedia, signLabMediaUpload, type LabMedia } from "@/lib/custom-lab/media";
import { LAB_TEXT_DEFAULTS, type LabTextKey } from "@/lib/custom-lab/lab-texts";

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

export async function createLabProjectInlineAction(name: string, description: string): Promise<{ ok: true; name: string } | { ok: false; message: string }> {
  await requireAdmin();
  if (typeof name !== "string" || !name.trim() || name.length > 120 || typeof description !== "string" || description.length > 500) return { ok: false, message: "Nom requis (120 caractères maximum) et description de 500 caractères maximum." };
  try {
    const project = await createLabProject(name, description.trim());
    revalidatePath("/admin/laboratoire");
    return { ok: true, name: project.name };
  } catch (error) {
    return { ok: false, message: error instanceof LabStorageError ? error.message : "Création impossible : vérifie que ce nom de projet n’est pas déjà utilisé." };
  }
}

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

// --- Livraison d'une création dans une commande -------------------------------------------

export type LabDeliveryTarget = { id: string; label: string; status: string; deliverables: { id: string; label: string }[] };

// Commandes pouvant recevoir un livrable : ni terminées, ni entièrement validées
export async function listLabDeliveryTargetsAction(): Promise<LabDeliveryTarget[]> {
  await requireAdmin();
  const store = getStore();
  const orders = (await store.listOrders()).filter((o) => o.status !== "terminee").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const targets = await Promise.all(orders.map(async (o): Promise<LabDeliveryTarget | null> => {
    const items = await store.listDeliverables(o.id);
    if (deliveryLocked(o, items)) return null;
    const status = orderStatuses.find((s) => s.id === o.status)?.label ?? o.status;
    return { id: o.id, label: `${o.customerName} · ${o.offerName}`, status, deliverables: items.map((d) => ({ id: d.id, label: d.label })) };
  }));
  return targets.filter((t): t is LabDeliveryTarget => t !== null);
}

// Génère les fichiers de la création (zip par plateforme, ou page HTML d'un overlay) et les dépose comme
// fichiers HD d'un livrable : nouveau (avec un nom) ou existant. Un fichier du même nom est remplacé,
// sauf s'il a déjà été téléchargé par le client (le nouveau est alors ajouté à côté).
export async function deliverLabAction(input: { id: string; orderId: string; targetId?: string; name?: string; platforms: Platform[] }): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  await requireAdmin();
  const store = getStore();
  const [document, order] = await Promise.all([getLabDocument(input.id), store.getOrder(input.orderId)]);
  if (!document) return { ok: false, message: "Création introuvable." };
  if (!order) return { ok: false, message: "Commande introuvable." };
  if (!store.saveDeliverableFile) return { ok: false, message: "Aucun stockage de livrables configuré." };
  const items = await store.listDeliverables(order.id);
  if (order.status === "terminee" || deliveryLocked(order, items)) return { ok: false, message: "Cette commande est terminée ou entièrement validée : repasse son statut à « En cours » pour y ajouter un fichier." };
  const target = input.targetId ? items.find((d) => d.id === input.targetId) : undefined;
  if (input.targetId && !target) return { ok: false, message: "Livrable introuvable." };
  const name = (input.name ?? "").trim().slice(0, 120);
  if (!target && !name) return { ok: false, message: "Donne un nom au livrable." };
  const platforms = [...new Set(input.platforms)].filter((p) => p === "streamelements" || p === "streamlabs");
  if (!platforms.length) return { ok: false, message: "Choisis au moins une plateforme." };

  let files: LabExportFile[];
  try {
    if (document.kind === "overlay") {
      const sources = Object.fromEntries((await listLabSources()).map((d) => [d.id, { name: d.name, project: d.project, kind: d.kind, variants: d.variants }]));
      files = [labOverlayHtml(document, sources, platforms[0])];
    } else files = platforms.map((p) => labPlatformZip(document, p));
  } catch (error) {
    return { ok: false, message: error instanceof Error ? `Création invalide : ${error.message}` : "Création invalide." };
  }

  const uploaded: { path: string; label: string }[] = [];
  try {
    for (const file of files) {
      const path = deliverablePath(order.id, file.filename, randomUUID().slice(0, 8));
      await store.saveDeliverableFile(path, file.data);
      uploaded.push({ path, label: file.label });
    }
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Envoi vers le stockage impossible. Réessaie dans un instant." };
  }

  if (target) {
    const assets = [...(target.finalAssets ?? [])];
    const replaced: string[] = [];
    for (const file of uploaded) {
      const i = assets.findIndex((a) => a.label === file.label && a.path && !target.accessedFinalAssets?.includes(a.path));
      if (i >= 0) { replaced.push(assets[i].path!); assets[i] = file; } else assets.push(file);
    }
    await store.updateDeliverable(target.id, { finalAssets: assets });
    // Anciens fichiers remplacés : retirés du stockage s'ils ne servent plus (aperçu, autre fichier)
    if (s3Configured()) for (const p of replaced) if (p !== target.previewPath && p !== target.storagePath && !assets.some((a) => a.path === p)) await s3DeliverableDelete(p).catch((e) => console.error(e));
  } else {
    await store.addDeliverable({ orderId: order.id, kind: "fichier", label: name, itemType: document.kind === "alertbox" ? "alerte" : document.kind, finalAssets: uploaded });
  }
  revalidatePath(`/admin/commandes/${order.id}`);
  revalidatePath("/admin/commandes");
  if (order.deliveryToken) revalidatePath(`/commande/${order.deliveryToken}`);
  const count = uploaded.length > 1 ? `${uploaded.length} fichiers ajoutés` : "Fichier ajouté";
  return { ok: true, message: `${count} au livrable « ${target?.label ?? name} » de la commande de ${order.customerName}.` };
}

// Textes du Laboratoire (lien Streamlabs et sa note) : enregistrés avec les autres textes du site ; vide = texte d'origine
export async function saveLabTextsAction(form: FormData) {
  await requireAdmin();
  const store = getStore();
  const stored = await store.getHomeContent();
  const content = Object.fromEntries(Object.entries(stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {}).filter(([, value]) => typeof value === "string")) as Record<string, string>;
  for (const key of Object.keys(LAB_TEXT_DEFAULTS) as LabTextKey[]) {
    const value = (form.get(key)?.toString() ?? "").trim().slice(0, 300);
    if (value && value !== LAB_TEXT_DEFAULTS[key]) content[key] = value;
    else delete content[key];
  }
  await store.saveHomeContent(content);
  revalidatePath("/admin/laboratoire", "layout");
}
