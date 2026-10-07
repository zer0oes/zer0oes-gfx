"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site-url";
import { devLogin, logout, requireAdmin, supabaseAuthClient } from "@/lib/auth";
import { adminEmails, devLoginAllowed, isAdminEmail, supabaseAuthConfigured } from "@/lib/env";
import { sendToCustomer } from "@/lib/notify";
import { createBalanceLink, retryInvoice } from "@/lib/orders";
import { completionPatch } from "@/lib/portal";
import { formatPrice } from "@/lib/pricing";
import { getStore, isOrderStatus } from "@/lib/store";

export type AdminFormState = { ok: boolean; message: string } | null;

// --- Connexion ---------------------------------------------------------------

export async function sendMagicLink(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const email = (formData.get("email")?.toString() ?? "").trim().toLowerCase();
  const done = { ok: true, message: "Si cette adresse est autorisée, un lien de connexion vient d'être envoyé." };
  if (!supabaseAuthConfigured()) return { ok: false, message: "Supabase n'est pas configuré (voir README)." };
  // Même réponse que l'adresse soit autorisée ou non : rien n'est révélé.
  if (!isAdminEmail(email)) return done;
  const { error } = await (await supabaseAuthClient()).auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await siteUrl()}/admin/auth/callback` },
  });
  if (error) {
    console.error(error);
    if (error.status === 429) {
      return {
        ok: false,
        message:
          "Trop de liens demandés : l'envoi d'e-mails intégré à Supabase est limité à quelques e-mails par heure. Réessaie plus tard (ou configure l'envoi via Resend, voir README).",
      };
    }
    return { ok: false, message: "L'envoi du lien a échoué, réessaie dans quelques instants." };
  }
  return done;
}

export async function devLoginAction() {
  if (!devLoginAllowed()) redirect("/admin/connexion");
  await devLogin(adminEmails()[0]);
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/connexion");
}

// --- Commandes ---------------------------------------------------------------

export async function updateStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const status = formData.get("status");
  if (!isOrderStatus(status)) return;
  const order = await getStore().getOrder(id);
  if (!order) return;
  // « Terminée » pose la date de clôture (départ des 6 mois de conservation des fichiers)
  await getStore().updateOrder(id, { status, ...completionPatch(order, status) });
  if (order.deliveryToken) revalidatePath(`/commande/${order.deliveryToken}`);
  revalidatePath(`/admin/commandes/${id}`);
  revalidatePath("/admin/commandes");
}

export async function addNote(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const body = (formData.get("body")?.toString() ?? "").trim().slice(0, 5000);
  if (!body) return;
  await getStore().addNote(id, body);
  revalidatePath(`/admin/commandes/${id}`);
}

export async function sendBalanceLink(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  try {
    // Montant du solde recalculé côté serveur à partir de la commande.
    const { url, due, order } = await createBalanceLink(id, await siteUrl());
    let sent = false;
    if (order.customerEmail) {
      ({ sent } = await sendToCustomer({
        to: order.customerEmail,
        subject: `Ta commande zer0oes gfx : paiement du solde (${formatPrice(due)} HT)`,
        text: [
          "Bonjour,",
          "",
          `Ta commande « ${order.offerName} » est prête à être livrée.`,
          `Le solde à régler est de ${formatPrice(due)} HT. Tu peux le payer en ligne ici :`,
          url,
          "",
          "Dès réception du paiement, je t'envoie les fichiers définitifs.",
          "",
          "Merci et à bientôt,",
          "Aurore — zer0oes gfx",
        ].join("\n"),
      }));
    }
    revalidatePath(`/admin/commandes/${id}`);
    return {
      ok: true,
      message: order.customerEmail
        ? sent
          ? `Lien envoyé à ${order.customerEmail} (${formatPrice(due)} HT).`
          : `Lien créé (${formatPrice(due)} HT). E-mail non envoyé (Resend non configuré) : copie le lien ci-dessous.`
        : `Lien créé (${formatPrice(due)} HT). Aucun e-mail client connu : copie le lien ci-dessous.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur lors de la création du lien." };
  }
}

// --- Factures --------------------------------------------------------------------

export async function retryInvoiceAction(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const orderId = formData.get("orderId")?.toString() ?? "";
  await retryInvoice(id);
  revalidatePath(`/admin/commandes/${orderId}`);
}

// Changement de statut de plusieurs commandes d'un coup (liste des commandes)
export async function bulkUpdateStatus(formData: FormData) {
  await requireAdmin();
  const status = formData.get("status");
  const ids = formData.getAll("ids").map((v) => v.toString().slice(0, 60)).filter(Boolean).slice(0, 200);
  const raw = formData.get("back")?.toString() ?? "";
  const back = raw.startsWith("/admin/commandes") && !raw.startsWith("//") ? raw : "/admin/commandes";
  const sep = back.includes("?") ? "&" : "?";
  if (!isOrderStatus(status)) redirect(`${back}${sep}erreur=${encodeURIComponent("Choisis un statut.")}`);
  if (!ids.length) redirect(`${back}${sep}erreur=${encodeURIComponent("Sélectionne au moins une commande.")}`);
  const store = getStore();
  let n = 0;
  for (const id of ids) {
    const order = await store.getOrder(id);
    if (order) {
      await store.updateOrder(id, { status, ...completionPatch(order, status) });
      n++;
    }
  }
  revalidatePath("/admin/commandes");
  redirect(`${back}${sep}maj=${n}`);
}
