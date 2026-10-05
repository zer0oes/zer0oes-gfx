"use server";

import { redirect } from "next/navigation";
import { parseContact, parseMessage } from "@/lib/contact-form";
import { notify } from "@/lib/notify";
import { attachBrief, paymentSummary, quote, quoteMetadata, recordDemoOrder } from "@/lib/orders";
import { getPack, logoDiscountLabel, paymentLabel } from "@/lib/pricing";
import { siteUrl } from "@/lib/site-url";
import { getStore } from "@/lib/store";
import { getStripe } from "@/lib/stripe";

export type FormState = { ok: boolean; message: string } | null;

export async function createCheckout(formData: FormData) {
  const catalog = await getStore().getCatalog();
  const packId = formData.get("packId")?.toString();
  const pack = getPack(catalog.packs, packId);
  if (!pack) redirect("/offres");
  // Offre sur devis (prix « à partir de ») : pas de paiement direct.
  if (!pack.checkout) redirect(`/contact?offre=${pack.id}`);

  // Formule, mode de paiement et remise relus et recalculés ici : le navigateur
  // n'envoie que des identifiants, jamais de montant.
  const q = quote(catalog, {
    packId,
    formulaId: formData.get("formulaId")?.toString(),
    payment: formData.get("payment"),
    hasLogo: formData.get("logo") === "1",
  });
  if (!q) redirect("/offres");

  const stripe = getStripe();
  if (!stripe) {
    // Mode démo : pas de clé Stripe configurée.
    const sessionId = await recordDemoOrder(q);
    const params = new URLSearchParams({
      session_id: sessionId,
      pack: q.packId,
      formule: q.formulaId,
      paiement: q.payment,
      demo: "1",
    });
    if (q.hasLogo) params.set("logo", "1");
    redirect(`/merci?${params}`);
  }

  const formula = pack.formulas?.find((f) => f.id === q.formulaId);
  const base = await siteUrl();
  const s = catalog.settings;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      formula?.stripePriceId && q.payment === "total" && !q.hasLogo
        ? { price: formula.stripePriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: q.amount,
              product_data: {
                name: `zer0oes gfx — ${q.offerName}${q.hasLogo ? " — logo fourni" : ""}${q.payment === "acompte" ? ` — Acompte ${s.depositPercent} %` : ""}`,
                description: [q.hasLogo ? logoDiscountLabel(q.listPrice, s) : "", paymentLabel(q.totalPrice, q.payment, s)]
                  .filter(Boolean)
                  .join(" · "),
              },
            },
          },
    ],
    metadata: quoteMetadata(q),
    // Coordonnées pour la facture Abby (nom, adresse ; société et SIRET / TVA pour les pros)
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    custom_fields: [
      {
        key: "raisonsociale",
        label: { type: "custom", custom: "Raison sociale (si client pro)" },
        type: "text",
        optional: true,
        text: { maximum_length: 120 },
      },
      {
        key: "siret",
        label: { type: "custom", custom: "N° SIRET (si client pro)" },
        type: "text",
        optional: true,
        text: { minimum_length: 9, maximum_length: 20 },
      },
    ],
    success_url: `${base}/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/offres?annule=1`,
  });

  redirect(session.url!);
}

function field(formData: FormData, name: string, max = 5000) {
  return (formData.get(name)?.toString() ?? "").trim().slice(0, max);
}

function checked(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((o) => o.toString().slice(0, 200))
    .slice(0, 20)
    .join(", ");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (field(formData, "website")) return { ok: true, message: "Merci !" }; // pot de miel anti-spam

  const parsed = parseContact(
    (k) => formData.get(k)?.toString() ?? "",
    (k) => formData.getAll(k).map((v) => v.toString()),
  );
  if (!parsed.ok) return parsed;
  const { request } = parsed;

  try {
    await notify({
      subject: `[Projet] ${request.type} — ${request.name}`,
      replyTo: request.email,
      fields: request.fields,
    });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou écris-moi directement par e-mail." };
  }
  return { ok: true, message: "Message envoyé ! Je te réponds sous 48 h ouvrées." };
}

// Onglet « Message simple » de /contact
export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (field(formData, "website")) return { ok: true, message: "Merci !" }; // pot de miel anti-spam

  const parsed = parseMessage((k) => formData.get(k)?.toString() ?? "");
  if (!parsed.ok) return parsed;
  const { request } = parsed;

  try {
    await notify({ subject: `[Message] ${request.subject} — ${request.name}`, replyTo: request.email, fields: request.fields });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou écris-moi directement par e-mail." };
  }
  return { ok: true, message: "Message envoyé ! Je te réponds sous 48 h ouvrées." };
}

export async function sendBrief(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = field(formData, "email", 200);
  const channel = field(formData, "channel", 300);
  const universe = field(formData, "universe");
  if (!EMAIL_RE.test(email) || !channel || !universe) {
    return { ok: false, message: "Merci d'indiquer au minimum ton e-mail, ta chaîne et ton univers." };
  }
  if (field(formData, "hasLogo", 5) === "1" && !field(formData, "logoLink", 1000)) {
    return { ok: false, message: "Merci d'indiquer le lien vers ton logo existant." };
  }

  const brief: Record<string, string> = {
    "E-mail": email,
    Pseudo: field(formData, "pseudo", 200),
    Chaîne: channel,
    Plateforme: field(formData, "platform", 100),
    "Univers / ambiance": universe,
    Couleurs: field(formData, "colors", 500),
    Références: field(formData, "references"),
    "Logo existant": field(formData, "logoLink", 1000),
    "Overlays choisis": checked(formData, "overlays"),
    "Éléments à inclure": field(formData, "elements"),
    Options: checked(formData, "options"),
    "Date souhaitée": field(formData, "deadline", 100),
    Remarques: field(formData, "notes"),
  };

  // Rattache le brief à la commande enregistrée (session Stripe ou démo).
  const sessionId = field(formData, "sessionId", 300);
  let orderLabel = [field(formData, "packId", 50) || "inconnu", field(formData, "formulaId", 50), field(formData, "payment", 20)]
    .filter(Boolean)
    .join(" / ");
  try {
    const order = await attachBrief(sessionId, brief, email);
    if (order) {
      orderLabel = `${order.offerName}${order.hasLogo ? " — logo fourni" : ""} — ${paymentSummary(order)} — commande ${order.id}`;
    } else {
      const stripe = getStripe();
      if (stripe && sessionId && !sessionId.startsWith("demo_")) {
        const s = await stripe.checkout.sessions.retrieve(sessionId);
        orderLabel = `${s.metadata?.offerName ?? s.metadata?.packId ?? "?"} — ${s.payment_status} — ${s.id}`;
      }
    }
  } catch (e) {
    console.error(e);
    orderLabel = `${orderLabel} (session ${sessionId})`;
  }

  try {
    await notify({ subject: `[Brief] ${channel}`, replyTo: email, fields: { Commande: orderLabel, ...brief } });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou envoie ton brief par e-mail." };
  }
  return { ok: true, message: "Brief bien reçu ! Je reviens vers toi sous 48 h ouvrées pour démarrer." };
}
