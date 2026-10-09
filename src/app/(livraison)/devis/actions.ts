"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isDeliveryToken } from "@/lib/delivery";
import { getStore } from "@/lib/store";
import { createBalanceLink, ensureDeliveryPlan } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";
import { notify } from "@/lib/notify";
import { parseQuoteBrief } from "@/lib/quote-brief";
import type { FormState } from "@/app/actions";

export async function sendPaidQuoteBrief(_state: FormState, data: FormData): Promise<FormState> {
  const token = String(data.get("token") ?? "");
  if (!isDeliveryToken(token)) return { ok: false, message: "Accès invalide." };
  const q = await getStore().getQuoteByToken(token);
  if (!q) return { ok: false, message: "Devis introuvable." };
  q.deliverables.forEach((_, i) => data.set(`creation_${i}`, String(data.get(`productBrief_${i}`) ?? "")));
  const result = await savePaidQuoteBrief(null, data);
  return result ? { ok: false, message: result.error } : { ok: true, message: "Brief reçu." };
}

export async function acceptQuoteCheckout(_state: { error: string } | null, data: FormData): Promise<{ error: string } | null> {
  const token = String(data.get("token") ?? "");
  const q = isDeliveryToken(token) ? await getStore().getQuoteByToken(token) : null;
  if (!q || q.status !== "propose" || q.updatedAt !== data.get("updatedAt")) return { error: "Le devis a changé. Actualise la page." };
  if (data.get("consent") !== "on") return { error: "Accepte les conditions générales de vente." };
  data.set("checkoutFirst", "1");
  await respondProjectQuote(data);
  return null;
}

export async function savePaidQuoteBrief(_state: { error: string } | null, data: FormData): Promise<{ error: string } | null> {
  const token = String(data.get("token") ?? "");
  if (!isDeliveryToken(token)) return { error: "Accès invalide." };
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  const q = await store.getQuoteByToken(token);
  if (!order || !q || q.orderId !== order.id || order.amountPaid <= 0) return { error: "Le paiement doit être confirmé avant l’envoi du brief." };
  if (q.briefCompletedAt) redirect(`/commande/${token}`);
  const brief = parseQuoteBrief(data, q.deliverables, q.optionalBriefDeliverables, q.requiredBriefFields ?? ["email", "channel", "universe"]);
  if (!brief) return { error: "Complète ton univers, chaque création et, selon ta commande, la plateforme de tes widgets et alertes et la livraison de tes overlays." };
  const now = new Date().toISOString();
  await store.updateOrder(order.id, { brief: { ...order.brief, ...brief, "E-mail": order.customerEmail, Plateforme: String(data.get("platform") ?? "").slice(0, 100), "Éléments à inclure": String(data.get("elements") ?? "").slice(0, 5000) }, briefReceivedAt: now, status: "brief_recu" });
  await ensureDeliveryPlan({ ...order, brief });
  if (!await store.saveQuoteMailState({ ...q, briefCompletedAt: now, updatedAt: now }, q.updatedAt)) return { error: "Actualise la page pour vérifier l’enregistrement." };
  revalidatePath(`/commande/${token}`); revalidatePath(`/admin/commandes/${order.id}`);
  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/devis/${q.id}`);
  revalidatePath("/admin/devis");
  revalidatePath("/admin");
  redirect(`/commande/${token}`);
}

export async function acceptQuoteWithBrief(_state: { error: string } | null, data: FormData): Promise<{ error: string } | null> {
  const en = data.get("lang") === "en";
  const token = String(data.get("token") ?? "");
  const q = isDeliveryToken(token) ? await getStore().getQuoteByToken(token) : null;
  if (!q || q.updatedAt !== data.get("updatedAt") || q.status !== "propose") return { error: en ? "This quote has changed. Close this window and review the updated proposal." : "Le devis a changé. Ferme cette fenêtre et consulte la proposition actualisée." };
  const payment = data.get("payment");
  const deposit = Math.round(q.totalPrice * (q.depositPercent || 30) / 100);
  if ((payment !== "total" && payment !== "acompte") || (payment === "acompte" && (deposit < 50 || q.totalPrice - deposit < 50))) return { error: en ? "Choose a valid payment option." : "Choisis un mode de paiement valide." };
  if (data.get("consent") !== "on" || !parseQuoteBrief(data, q.deliverables, q.optionalBriefDeliverables, q.requiredBriefFields ?? ["email", "channel", "universe"])) return { error: en ? "Complete your universe, each creation and accept the terms." : "Complète ton univers, chaque création et accepte les conditions." };
  await respondProjectQuote(data);
  return null;
}

export async function reopenProjectQuote(data: FormData) {
  const token = String(data.get("token") ?? "");
  if (!isDeliveryToken(token)) redirect("/");
  const store = getStore();
  let reopened = false;
  try { reopened = await store.reopenQuote(token); }
  catch (e) { console.error(e); }
  if (!reopened) redirect(`/devis/${token}?erreur=indisponible`);
  const q = await store.getQuoteByToken(token);
  if (q) {
    revalidatePath(`/admin/devis/${q.id}`);
    await notify({ subject: `[Devis relancé] ${q.title}`, fields: { Client: q.email, Devis: q.id, Réponse: "Le client a annulé son refus." } }).catch((e) => console.error(e));
  }
  revalidatePath("/admin/devis");
  revalidatePath(`/devis/${token}`);
  redirect(`/devis/${token}?relance=1`);
}

export async function respondProjectQuote(data: FormData) {
  const token = String(data.get("token") ?? "");
  if (!isDeliveryToken(token)) redirect("/");
  const accept = data.get("decision") === "accept";
  if (!accept && data.get("decision") !== "decline") redirect(`/devis/${token}`);
  if (accept && data.get("consent") !== "on") redirect(`/devis/${token}?erreur=consent`);
  const store = getStore();
  let id: string | null;
  const quote = accept ? await store.getQuoteByToken(token) : null;
  const brief = quote ? parseQuoteBrief(data, quote.deliverables, quote.optionalBriefDeliverables, quote.requiredBriefFields ?? ["email", "channel", "universe"]) : undefined;
  const payment = data.get("payment");
  if (accept && payment !== "total" && payment !== "acompte") redirect(`/devis/${token}?erreur=paiement`);
  if (accept && ((data.get("checkoutFirst") !== "1" && !brief) || quote?.updatedAt !== data.get("updatedAt"))) redirect(`/devis/${token}?erreur=brief`);
  const declineReason = accept ? "" : String(data.get("declineReason") ?? "").trim().slice(0, 2000);
  try { id = await store.respondQuote(token, accept, declineReason, brief || undefined, accept ? payment as "total" | "acompte" : undefined); }
  catch (e) { console.error(e); redirect(`/devis/${token}?erreur=indisponible`); }
  if (id) {
    const order = await store.getOrder(id);
    if (order) await ensureDeliveryPlan(order).catch((e) => console.error(e));
  }
  const q = await store.getQuoteByToken(token);
  if (q) await notify({ subject: `[Devis ${id ? "accepté" : "refusé"}] ${q.title}`, fields: { Client: q.email, Devis: q.id, Commande: id ?? "—", ...(!id ? { "Raison du refus": q.declineReason || "Non précisée" } : {}) } }).catch((e) => console.error(e));
  if (q) revalidatePath(`/admin/devis/${q.id}`);
  revalidatePath("/admin/devis"); revalidatePath("/admin/commandes"); revalidatePath(`/devis/${token}`);
  if (id) {
    let paymentUrl: string;
    try {
      const checkout = await createBalanceLink(id, await siteUrl(), `/commande/${token}`, data.get("lang") === "en" ? "en" : "fr");
      paymentUrl = checkout.url;
    } catch (e) {
      console.error(e);
      redirect(`/commande/${token}?retour=paiement-erreur#solde`);
    }
    redirect(paymentUrl);
  }
  redirect(`/devis/${token}`);
}
