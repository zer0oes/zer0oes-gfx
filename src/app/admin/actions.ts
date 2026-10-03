"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/site-url";
import { devLogin, logout, requireAdmin, supabaseAuthClient } from "@/lib/auth";
import { adminEmails, devLoginAllowed, isAdminEmail, supabaseAuthConfigured } from "@/lib/env";
import { sendToCustomer } from "@/lib/notify";
import { createBalanceLink, retryInvoice } from "@/lib/orders";
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
    return { ok: false, message: "L'envoi du lien a échoué, réessaie dans quelques instants." };
  }
  return done;
}

export async function devLoginAction() {
  if (!devLoginAllowed()) redirect("/admin/connexion");
  await devLogin(adminEmails()[0]);
  redirect("/admin/commandes");
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
  await getStore().updateOrder(id, { status });
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
