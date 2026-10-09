"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { formMessage, parseContact, parseMessage } from "@/lib/contact-form";
import { asLocale, href, type Locale } from "@/lib/i18n";
import { notify, sendToCustomer } from "@/lib/notify";
import { contactReceiptMessage } from "@/lib/contact-receipt";
import { recordFormSent } from "@/lib/stats-server";
import { attachBrief, paymentSummary, quote, quoteMetadata, recordDemoOrder } from "@/lib/orders";
import { formatPrice, getPack, logoDiscountLabel, paymentLabel } from "@/lib/pricing";
import { siteUrl } from "@/lib/site-url";
import { trOfferName } from "@/lib/translations-en";
import { getStore } from "@/lib/store";
import { getStripe } from "@/lib/stripe";
import { getPublicCatalog } from "@/lib/public-catalog";
import { discountQuote } from "@/lib/orders";
import { normalizeCode, validPromotion } from "@/lib/promotions";
import { includedOverlays, validOverlaySelection } from "@/lib/brief-overlays";
import { productBriefFields } from "@/lib/product-brief";
import { recordQuoteRequest } from "@/lib/project-quotes";
import { briefDeliveryAnswers, briefDeliveryNeeds } from "@/lib/brief-delivery";

export type FormState = { ok: boolean; message: string } | null;

// Langue du visiteur (champ caché « lang » des formulaires du site)
const formLocale = (formData: FormData): Locale => asLocale(formData.get("lang")?.toString());

// Réponse affichée au visiteur, dans sa langue
function localized(locale: Locale, state: FormState): FormState {
  return state && { ...state, message: formMessage(locale, state.message) };
}

// Mention ajoutée aux e-mails reçus par Aurore quand la demande vient du site anglais
const languageField = (locale: Locale): Record<string, string> => (locale === "en" ? { Langue: "Anglais (site /en) : répondre en anglais" } : {});

export async function createCheckout(formData: FormData) {
  const locale = formLocale(formData);
  const to = (path: string) => href(locale, path);
  const catalog = await getPublicCatalog();
  const packId = formData.get("packId")?.toString();
  const optionId = formData.get("optionId")?.toString();
  const cart = formData.get("optionItems");
  let optionItems: { id: string; quantity: number }[] | undefined;
  if (cart !== null) {
    try { optionItems = JSON.parse(String(cart)); } catch { redirect(to("/offres")); }
    if (!Array.isArray(optionItems) || !optionItems.length) redirect(to("/offres"));
  }
  const pack = getPack(catalog.packs, packId);
  if (!optionItems && !optionId && !pack) redirect(to("/offres"));
  // Offre sur devis (prix « à partir de ») : pas de paiement direct.
  if (!optionItems && !optionId && pack && !pack.checkout) redirect(to(`/contact?offre=${pack.id}`));
  if (!formData.has("cgv")) redirect(to("/offres"));

  // Formule, mode de paiement et remise relus et recalculés ici : le navigateur
  // n'envoie que des identifiants, jamais de montant.
  let q = quote(catalog, {
    packId,
    optionId,
    optionItems,
    formulaId: formData.get("formulaId")?.toString(),
    payment: formData.get("payment"),
    hasLogo: formData.get("logo") === "1",
  });
  if (!q) redirect(to("/offres"));
  const code = normalizeCode(formData.get("promoCode")?.toString() ?? "");
  if (code) {
    const promotion = (await getStore().listPromotions()).find((p) => p.code === code && validPromotion(p, q!.packId));
    q = promotion ? discountQuote(q, promotion) : null;
    if (!q) redirect(to("/offres?promo_erreur=1"));
  }
  const expectedPrice = formData.get("expectedPrice");
  if (expectedPrice !== null && Number(expectedPrice) !== q.totalPrice) redirect(to("/offres?prix_modifie=1"));

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
    redirect(`${to("/merci")}?${params}`);
  }

  const formula = !optionItems && !optionId ? pack?.formulas?.find((f) => f.id === q.formulaId) : undefined;
  const base = await siteUrl();
  const s = catalog.settings;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      formula?.stripePriceId && q.payment === "total" && !q.hasLogo && !q.promoCode
        ? { price: formula.stripePriceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: q.amount,
              product_data: {
                name:
                  locale === "en"
                    ? `zer0oes gfx — ${trOfferName("en", q.offerName)}${q.hasLogo ? " — logo supplied" : ""}${q.payment === "acompte" ? ` — ${s.depositPercent}% deposit` : ""}`
                    : `zer0oes gfx — ${q.offerName}${q.hasLogo ? " — logo fourni" : ""}${q.payment === "acompte" ? ` — Acompte ${s.depositPercent} %` : ""}`,
                description:
                  optionItems ? q.deliveryTemplate?.join(" · ").slice(0, 1000) :
                  locale === "en"
                    ? [
                        q.hasLogo ? `“Existing logo” discount: −${formatPrice(q.logoDiscount, "en")}` : "",
                        q.payment === "acompte"
                          ? `${s.depositPercent}% deposit: ${formatPrice(q.amount, "en")} of ${formatPrice(q.totalPrice, "en")} — balance due on delivery`
                          : `Paid in full: ${formatPrice(q.totalPrice, "en")}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : [q.hasLogo ? logoDiscountLabel(q.listPrice, { ...s, logoDiscount: q.logoDiscount }) : "", paymentLabel(q.totalPrice, q.payment, s)].filter(Boolean).join(" · "),
              },
            },
          },
    ],
    metadata: quoteMetadata(q),
    // Page de paiement Stripe dans la langue du visiteur
    locale: locale === "en" ? "en" : "fr",
    // Coordonnées pour la facture Abby (nom, adresse ; société et SIRET / TVA pour les pros)
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
    custom_fields: [
      {
        key: "raisonsociale",
        label: { type: "custom", custom: locale === "en" ? "Company name (business customers)" : "Raison sociale (si client pro)" },
        type: "text",
        optional: true,
        text: { maximum_length: 120 },
      },
      {
        key: "siret",
        label: { type: "custom", custom: locale === "en" ? "SIRET number (French businesses)" : "N° SIRET (si client pro)" },
        type: "text",
        optional: true,
        text: { minimum_length: 9, maximum_length: 20 },
      },
    ],
    success_url: `${base}${to("/merci")}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}${to("/offres")}?annule=1`,
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

async function contactForm(
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
    const demand = await recordQuoteRequest(request, formLocale(formData));
    revalidatePath("/admin/devis");
    await notify({
      subject: `[Projet] ${request.type} — ${request.name}`,
      replyTo: request.email,
      fields: { ...request.fields, ...languageField(formLocale(formData)), Administration: `${await siteUrl()}/admin/devis/${demand.id}` },
    }).catch((e) => console.error(e));
    await sendToCustomer({ to: request.email, ...contactReceiptMessage(request.name, request.fields, formLocale(formData)), contactReceipt: true, idempotencyKey: `contact-receipt-${demand.id}` }).catch((e) => console.error("Accusé de réception contact :", e));
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou écris-moi directement par e-mail." };
  }
  await recordFormSent(`Projet : ${request.type}`, "/contact");
  return { ok: true, message: "Message envoyé ! Je te réponds sous 48 h ouvrées." };
}

// Onglet « Message simple » de /contact
async function messageForm(_prev: FormState, formData: FormData): Promise<FormState> {
  if (field(formData, "website")) return { ok: true, message: "Merci !" }; // pot de miel anti-spam

  const parsed = parseMessage((k) => formData.get(k)?.toString() ?? "");
  if (!parsed.ok) return parsed;
  const { request } = parsed;

  try {
    const demand = await recordQuoteRequest(request, formLocale(formData));
    revalidatePath("/admin/devis");
    await notify({
      subject: `[Message] ${request.subject} — ${request.name}`,
      replyTo: request.email,
      fields: { ...request.fields, ...languageField(formLocale(formData)), Administration: `${await siteUrl()}/admin/devis/${demand.id}` },
    }).catch((e) => console.error(e));
    await sendToCustomer({ to: request.email, ...contactReceiptMessage(request.name, request.fields, formLocale(formData)), contactReceipt: true, idempotencyKey: `contact-receipt-${demand.id}` }).catch((e) => console.error("Accusé de réception contact :", e));
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou écris-moi directement par e-mail." };
  }
  await recordFormSent(`Message : ${request.subject}`, "/contact?onglet=message");
  return { ok: true, message: "Message envoyé ! Je te réponds sous 48 h ouvrées." };
}

async function briefForm(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sessionId = field(formData, "sessionId", 300);
  const locale = formLocale(formData);
  const editingBrief = formData.get("editBrief") === "1";
  let productFields: Record<string, string> = {};
  let deliveryAnswers: Record<string, string> = {};
  try {
    const store = getStore();
    const order = sessionId ? await store.getOrderBySession(sessionId) : null;
    if (editingBrief && !order) return { ok: false, message: locale === "en" ? "Order not found." : "Commande introuvable." };
    if (editingBrief && (order?.briefRevisions?.length ?? 0) >= 2) return { ok: false, message: locale === "en" ? "You’ve reached the limit of 2 brief updates. Please contact me for further changes." : "La limite de 2 modifications du brief est atteinte. Contacte-moi pour tout autre changement." };
    if (!editingBrief && (order?.briefReceivedAt || order?.brief)) return { ok: true, message: locale === "en" ? "Your brief has already been received. You can follow your project in your order space." : "Ton brief a déjà été reçu. Tu peux suivre ton projet dans ton espace commande." };
    let packId = order?.packId;
    let deliveryTemplate = order?.deliveryTemplate;
    if (!packId && sessionId && !sessionId.startsWith("demo_")) {
      const session = await getStripe()?.checkout.sessions.retrieve(sessionId);
      if (session?.payment_status === "paid") {
        packId = session.metadata?.packId;
        deliveryTemplate = Object.entries(session.metadata ?? {}).filter(([key]) => key.startsWith("deliveryTemplate_")).sort(([a], [b]) => Number(a.split("_")[1]) - Number(b.split("_")[1])).map(([, value]) => value);
      }
    }
    if (packId === "options" || packId?.startsWith("option:")) {
      if (!deliveryTemplate?.length) return { ok: false, message: locale === "en" ? "Unable to verify your products. Please refresh." : "Impossible de vérifier tes créations. Actualise la page." };
      const fields = productBriefFields(deliveryTemplate, (name) => field(formData, name));
      if (!fields) return { ok: false, message: locale === "en" ? "Describe each purchased creation before sending your brief." : "Précise ta demande pour chaque création achetée avant d’envoyer ton brief." };
      productFields = fields;
    } else {
      const pack = (await store.getCatalog()).packs.find((p) => p.id === packId);
      const count = includedOverlays(pack);
      if (!pack || count === null) return { ok: false, message: locale === "en" ? "Unable to verify your package. Please refresh or contact me." : "Impossible de vérifier ton pack. Actualise la page ou contacte-moi." };
      if (!validOverlaySelection(formData.getAll("overlays"), count)) return { ok: false, message: locale === "en" ? `Choose exactly ${count} different overlays included in your package.` : `Choisis exactement ${count} overlays différents, inclus dans ton pack.` };
      deliveryTemplate ??= pack.deliverables;
    }
    // Plateforme des widgets / alertes et livraison des overlays, selon le contenu de la commande
    const answers = briefDeliveryAnswers((name) => field(formData, name, 100) || undefined, briefDeliveryNeeds(deliveryTemplate ?? [], formData.getAll("overlays").length || null));
    if (!answers) return { ok: false, message: locale === "en" ? "Choose the platform for your widgets and alerts, and how you’d like to receive your overlays." : "Choisis la plateforme de tes widgets et alertes, et la façon de recevoir tes overlays." };
    deliveryAnswers = answers;
  } catch (e) {
    console.error(e);
    return { ok: false, message: locale === "en" ? "Unable to verify your package. Please try again." : "Impossible de vérifier ton pack. Réessaie." };
  }
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
    ...productFields,
    "E-mail": email,
    Pseudo: field(formData, "pseudo", 200),
    Chaîne: channel,
    Plateforme: field(formData, "platform", 100),
    "Univers / ambiance": universe,
    Couleurs: field(formData, "colors", 500),
    Références: field(formData, "references"),
    "Logo existant": field(formData, "logoLink", 1000),
    "Overlays choisis": checked(formData, "overlays"),
    ...deliveryAnswers,
    "Éléments à inclure": field(formData, "elements"),
    "Date souhaitée": field(formData, "deadline", 100),
    Remarques: field(formData, "notes"),
  };

  // Rattache le brief à la commande enregistrée (session Stripe ou démo).
  let orderLabel = [field(formData, "packId", 50) || "inconnu", field(formData, "formulaId", 50), field(formData, "payment", 20)]
    .filter(Boolean)
    .join(" / ");
  let revisionFields: Record<string, string> = {};
  try {
    const order = await attachBrief(sessionId, brief, email, editingBrief);
    if (order) {
      const revisions = order.briefRevisions ?? [];
      if (editingBrief && revisions.length) {
        revisionFields = { "Modification du brief": `${revisions.length} / 2`, ...Object.fromEntries(Object.entries(revisions[revisions.length - 1].changes).map(([key, value]) => [`Changement : ${key}`, `Avant : ${value.before || "—"}\nAprès : ${value.after || "—"}`])) };
      }
      if (order.deliveryToken) revalidatePath(`/commande/${order.deliveryToken}`);
      revalidatePath(`/admin/commandes/${order.id}`);
      revalidatePath("/admin/commandes");
      revalidatePath("/merci");
      revalidatePath("/en/merci");
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
    if (editingBrief) return { ok: false, message: locale === "en" ? "Unable to save your changes. Please try again." : "Impossible d’enregistrer tes modifications. Réessaie." };
    orderLabel = `${orderLabel} (session ${sessionId})`;
  }

  try {
    await notify({ subject: `[${editingBrief ? "Brief modifié" : "Brief"}] ${channel}`, replyTo: email, fields: { Commande: orderLabel, ...revisionFields, ...brief, ...languageField(formLocale(formData)) } });
  } catch (e) {
    console.error(e);
    return { ok: false, message: "L'envoi a échoué, réessaie ou envoie ton brief par e-mail." };
  }
  await recordFormSent("Brief après commande", "/merci");
  return { ok: true, message: editingBrief ? (locale === "en" ? "Your brief has been updated. I’ve been notified of your changes." : "Ton brief a été mis à jour. Je suis informée de tes modifications.") : "Brief bien reçu ! Je reviens vers toi sous 2 jours ouvrés pour démarrer." };
}

// Formulaires du site : la réponse au visiteur est traduite selon la langue de la page
export async function sendContact(prev: FormState, formData: FormData): Promise<FormState> {
  return localized(formLocale(formData), await contactForm(prev, formData));
}

export async function sendMessage(prev: FormState, formData: FormData): Promise<FormState> {
  return localized(formLocale(formData), await messageForm(prev, formData));
}

export async function sendBrief(prev: FormState, formData: FormData): Promise<FormState> {
  return localized(formLocale(formData), await briefForm(prev, formData));
}
