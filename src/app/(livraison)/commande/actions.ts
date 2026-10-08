"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canCancelApproval, correctionPending, itemRevisionLimit, cleanNote, deliveryProgress, isDeliveryToken, previewPublished } from "@/lib/delivery";
import { allFinalsAccessed, hasFinalAccess } from "@/lib/final-downloads";
import { notify } from "@/lib/notify";
import { createBalanceLink } from "@/lib/orders";
import { requestLocale } from "@/lib/request-locale";
import { siteUrl } from "@/lib/site-url";
import { balanceDue, getStore } from "@/lib/store";

// Retours du client sur sa page de livraison. Le jeton du lien privé sert d'accès :
// on vérifie qu'il correspond à une commande et que l'élément appartient bien à cette commande.
async function orderFor(formData: FormData) {
  const token = formData.get("token")?.toString() ?? "";
  if (!isDeliveryToken(token)) redirect("/");
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) redirect("/");
  return { store, order, token };
}

async function target(formData: FormData) {
  const { store, order, token } = await orderFor(formData);
  const id = formData.get("id")?.toString().slice(0, 60) ?? "";
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item) redirect(`/commande/${token}`);
  return { store, order, item, token };
}

function back(token: string, id: string, retour: string): never {
  revalidatePath(`/commande/${token}`);
  redirect(`/commande/${token}?retour=${retour}&f=${id}#f-${id}`);
}

const who = (o: { offerName: string; customerEmail: string }) => `${o.offerName} (${o.customerEmail || "e-mail inconnu"})`;

export async function saveClientTestimonialAction(_state: { status: string }, formData: FormData) {
  const { store, order, token } = await orderFor(formData);
  const deliverables = await store.listDeliverables(order.id);
  if (!deliveryProgress(deliverables).complete || balanceDue(order) > 0 || !deliverables.every(allFinalsAccessed)) return { status: "unapproved" };
  const author = typeof formData.get("author") === "string" ? (formData.get("author") as string).trim() : "";
  const quote = typeof formData.get("quote") === "string" ? (formData.get("quote") as string).trim() : "";
  if (!author || author.length > 80 || !quote || quote.length > 600) return { status: "invalid" };
  const consent = formData.get("consent") === "on";
  const now = new Date().toISOString();
  try {
    await store.updateOrder(order.id, { testimonial: { author, quote, consent, submittedAt: now, ...(consent ? { consentAt: now } : {}) } });
  } catch (e) {
    console.error(e);
    return { status: "error" };
  }
  await notify({
    subject: `Avis client — ${order.offerName}`,
    replyTo: order.customerEmail || undefined,
    fields: { Commande: who(order), Auteur: author, Avis: quote, "Accord de diffusion sur le site": consent ? "Oui" : "Non", "Date de soumission": now },
  }).catch((e) => console.error(e));
  revalidatePath(`/commande/${token}`);
  revalidatePath(`/admin/commandes/${order.id}`);
  return { status: "saved" };
}

export async function addClientNoteAction(formData: FormData) {
  const { store, order, item, token } = await target(formData);
  if (!previewPublished(item)) back(token, item.id, "vide");
  if (item.approvedAt) back(token, item.id, "deja-valide");
  if (correctionPending(item)) back(token, item.id, "attente");
  if (!canCancelApproval(order)) back(token, item.id, "cloturee");
  if ((item.clientNotes?.length ?? 0) >= itemRevisionLimit(order)) back(token, item.id, "limite");
  const body = cleanNote(formData.get("body"));
  if (!body) back(token, item.id, "vide");
  await store.addDeliverableNote(item.id, body);
  await notify({
    subject: `Demande de modification — ${order.offerName} : ${item.label}`,
    replyTo: order.customerEmail || undefined,
    fields: { Commande: who(order), Élément: item.label, Demande: body },
  }).catch((e) => console.error(e));
  back(token, item.id, "modification");
}

export async function setClientApprovalAction(formData: FormData) {
  const { store, order, item, token } = await target(formData);
  const approved = formData.get("approved") === "1";
  if (!approved && hasFinalAccess(item)) back(token, item.id, "telecharge");
  if (correctionPending(item)) back(token, item.id, "attente");
  if (!previewPublished(item)) back(token, item.id, "vide");
  if (approved && item.plannedKey && !item.previewPath) back(token, item.id, "vide");
  if (!approved && !canCancelApproval(order)) back(token, item.id, "cloturee");
  try {
    await store.setDeliverableApproval(item.id, approved);
  } catch (error) {
    const latest = (await store.listDeliverables(order.id)).find((d) => d.id === item.id);
    if (!approved && latest && hasFinalAccess(latest)) back(token, item.id, "telecharge");
    throw error;
  }
  await notify({
    subject: `${approved ? "Validé" : "Validation annulée"} par le client — ${order.offerName} : ${item.label}`,
    replyTo: order.customerEmail || undefined,
    fields: { Commande: who(order), Élément: item.label, Statut: approved ? "Validé" : "Validation annulée" },
  }).catch((e) => console.error(e));
  back(token, item.id, approved ? "valide" : "annule");
}

// Règlement du solde depuis la page de livraison (paiement Stripe, retour sur la page)
export async function approveAllDeliverablesAction(formData: FormData) {
  const { store, order, token } = await orderFor(formData);
  const items = await store.listDeliverables(order.id);
  if (!items.length || items.some((item) => !previewPublished(item) || correctionPending(item) || (item.plannedKey && !item.previewPath))) back(token, "", "attente");
  for (const item of items.filter((item) => !item.approvedAt)) {
    const current = (await store.listDeliverables(order.id)).find((d) => d.id === item.id);
    if (!current || current.previewPath !== item.previewPath || correctionPending(current) || !previewPublished(current)) back(token, "", "attente");
    await store.setDeliverableApproval(item.id, true);
  }
  revalidatePath(`/admin/commandes/${order.id}`);
  revalidatePath("/admin/commandes");
  revalidatePath(`/commande/${token}`);
  redirect(`/commande/${token}?retour=valide#elements`);
}

export async function payBalanceAction(formData: FormData) {
  const { order, token } = await orderFor(formData);
  if (balanceDue(order) <= 0) redirect(`/commande/${token}`);
  let url: string;
  try {
    ({ url } = await createBalanceLink(order.id, await siteUrl(), `/commande/${token}`, await requestLocale()));
  } catch (e) {
    console.error(e);
    redirect(`/commande/${token}?retour=paiement-erreur#solde`);
  }
  redirect(url);
}
