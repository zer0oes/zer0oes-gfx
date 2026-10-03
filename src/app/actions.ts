"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPack } from "@/data/packs";
import { getStripe } from "@/lib/stripe";
import { notify } from "@/lib/notify";

export type FormState = { ok: boolean; message: string } | null;

async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function createCheckout(formData: FormData) {
  const pack = getPack(formData.get("packId")?.toString());
  if (!pack) redirect("/offres");

  const stripe = getStripe();
  if (!stripe) {
    // Mode démo : pas de clé Stripe configurée.
    redirect(`/merci?pack=${pack.id}&demo=1`);
  }

  const base = await siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      pack.stripePriceId
        ? { price: pack.stripePriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: pack.price,
              product_data: { name: `zer0oes gfx — ${pack.name}` },
            },
          },
    ],
    metadata: { packId: pack.id },
    success_url: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/offres?annule=1`,
  });

  redirect(session.url!);
}

function field(formData: FormData, name: string, max = 5000) {
  return (formData.get(name)?.toString() ?? "").trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (field(formData, "website")) return { ok: true, message: "Merci !" }; // pot de miel anti-spam

  const name = field(formData, "name", 200);
  const email = field(formData, "email", 200);
  const message = field(formData, "message");
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return {
      ok: false,
      message: "Merci de renseigner votre nom, un e-mail valide et un message (10 caractères minimum).",
    };
  }

  try {
    await notify({
      subject: `[Contact] ${field(formData, "type", 100) || "Demande"} — ${name}`,
      replyTo: email,
      fields: {
        Nom: name,
        "E-mail": email,
        Chaîne: field(formData, "channel", 300),
        "Type de demande": field(formData, "type", 100),
        Budget: field(formData, "budget", 100),
        Message: message,
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessayez ou écrivez-moi directement par e-mail." };
  }
  return { ok: true, message: "Message envoyé ! Je vous réponds sous 48 h ouvrées." };
}

export async function sendBrief(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email", 200);
  const channel = field(formData, "channel", 300);
  const universe = field(formData, "universe");
  if (!EMAIL_RE.test(email) || !channel || !universe) {
    return { ok: false, message: "Merci de renseigner au minimum votre e-mail, votre chaîne et votre univers." };
  }

  // Vérifie côté serveur la commande Stripe associée, si présente.
  const sessionId = field(formData, "sessionId", 300);
  let order = field(formData, "packId", 50) || "inconnu";
  const stripe = getStripe();
  if (stripe && sessionId) {
    try {
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      order = `${s.metadata?.packId ?? "?"} — ${s.payment_status} — ${s.id}`;
    } catch {
      order = `session invalide (${sessionId})`;
    }
  }

  try {
    await notify({
      subject: `[Brief] ${channel}`,
      replyTo: email,
      fields: {
        Commande: order,
        "E-mail": email,
        Pseudo: field(formData, "pseudo", 200),
        Chaîne: channel,
        Plateforme: field(formData, "platform", 100),
        "Univers / ambiance": universe,
        Couleurs: field(formData, "colors", 500),
        Références: field(formData, "references"),
        "Éléments à inclure": field(formData, "elements"),
        "Date souhaitée": field(formData, "deadline", 100),
        Remarques: field(formData, "notes"),
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessayez ou envoyez votre brief par e-mail." };
  }
  return { ok: true, message: "Brief bien reçu ! Je reviens vers vous sous 48 h ouvrées pour démarrer." };
}
