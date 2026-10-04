"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cleanNote, isDeliveryToken } from "@/lib/delivery";
import { notify } from "@/lib/notify";
import { getStore } from "@/lib/store";

// Retours du client sur sa page de livraison. Le jeton du lien privé sert d'accès :
// on vérifie qu'il correspond à une commande et que le fichier appartient bien à cette commande.
async function target(formData: FormData) {
  const token = formData.get("token")?.toString() ?? "";
  const id = formData.get("id")?.toString().slice(0, 60) ?? "";
  if (!isDeliveryToken(token)) redirect("/");
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) redirect("/");
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item) redirect(`/livraison/${token}`);
  return { store, order, item, token };
}

function back(token: string, id: string, retour: string): never {
  revalidatePath(`/livraison/${token}`);
  redirect(`/livraison/${token}?retour=${retour}&f=${id}#f-${id}`);
}

export async function addClientNoteAction(formData: FormData) {
  const { store, order, item, token } = await target(formData);
  const body = cleanNote(formData.get("body"));
  if (!body) back(token, item.id, "vide");
  await store.addDeliverableNote(item.id, body);
  await notify({
    subject: `Remarque client — ${order.offerName} : ${item.label}`,
    replyTo: order.customerEmail || undefined,
    fields: { Commande: `${order.offerName} (${order.customerEmail || "e-mail inconnu"})`, Fichier: item.label, Remarque: body },
  }).catch((e) => console.error(e));
  back(token, item.id, "remarque");
}

export async function setClientApprovalAction(formData: FormData) {
  const { store, order, item, token } = await target(formData);
  const approved = formData.get("approved") === "1";
  await store.setDeliverableApproval(item.id, approved);
  await notify({
    subject: `${approved ? "Validé" : "Validation annulée"} par le client — ${order.offerName} : ${item.label}`,
    replyTo: order.customerEmail || undefined,
    fields: { Commande: `${order.offerName} (${order.customerEmail || "e-mail inconnu"})`, Fichier: item.label, Statut: approved ? "Validé" : "Validation annulée" },
  }).catch((e) => console.error(e));
  back(token, item.id, approved ? "valide" : "annule");
}
