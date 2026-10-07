import "server-only";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { abbyConfigured, createAbbyApi } from "@/lib/abby";
import { invoicePayment, type InvoiceDeps, type PaymentInput } from "@/lib/invoicing";
import { newDeliveryToken, portalEmail } from "@/lib/delivery";
import { notify, sendToCustomer } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import {
  amountToPay,
  formatPrice,
  formulaName,
  getFormula,
  getPack,
  orderPrice,
  parsePaymentType,
  paymentLabel,
  type Catalog,
  type PaymentType,
} from "@/lib/pricing";
import { balanceDue, getStore, type NewOrder, type Order } from "@/lib/store";
import { mergeRefunds, refundedTotal } from "@/lib/refunds";
import { getStripe } from "@/lib/stripe";
import { trOfferName } from "@/lib/translations-en";
import { discountedPrice, type Promotion } from "@/lib/promotions";

// Commande calculée côté serveur à partir des identifiants envoyés par le formulaire.
export type CheckoutQuote = {
  packId: string;
  formulaId: string;
  offerName: string;
  payment: PaymentType;
  hasLogo: boolean;
  listPrice: number;
  totalPrice: number;
  amount: number;
  depositPercent: number;
  logoDiscount: number;
  promoCode?: string;
  promoDiscount?: number;
};

export function discountQuote(q: CheckoutQuote, promotion: Promotion): CheckoutQuote | null {
  if (q.promoCode || promotion.mode === "sale") return null;
  const totalPrice = discountedPrice(q.totalPrice, promotion);
  const amount = q.payment === "acompte" ? Math.round(totalPrice * q.depositPercent / 100) : totalPrice;
  if (amount < 50) return null;
  return { ...q, totalPrice, amount, promoCode: promotion.code, promoDiscount: q.totalPrice - totalPrice };
}

export function quote(
  catalog: Catalog,
  input: { packId?: string | null; formulaId?: string | null; payment?: unknown; hasLogo?: boolean },
): CheckoutQuote | null {
  const pack = getPack(catalog.packs, input.packId);
  if (!pack || !pack.checkout || pack.archived) return null;
  const formula = getFormula(pack, input.formulaId);
  if (!formula) return null;
  const s = catalog.settings;
  const payment = parsePaymentType(input.payment);
  const hasLogo = Boolean(input.hasLogo);
  const totalPrice = orderPrice(formula.price, hasLogo, s);
  if (amountToPay(totalPrice, payment, s) < 50) return null;
  return {
    packId: pack.id,
    formulaId: formula.id,
    offerName: formulaName(pack, formula),
    payment,
    hasLogo,
    listPrice: formula.normalPrice ?? formula.price,
    totalPrice,
    amount: amountToPay(totalPrice, payment, s),
    depositPercent: s.depositPercent,
    logoDiscount: formula.price - totalPrice,
    promoCode: formula.promotionCode,
    promoDiscount: formula.normalPrice ? formula.normalPrice - formula.price : undefined,
  };
}

// Métadonnées Stripe d'une commande (tout ce qu'il faut pour la recréer).
export function quoteMetadata(q: CheckoutQuote): Record<string, string> {
  return {
    kind: "commande",
    packId: q.packId,
    formulaId: q.formulaId,
    offerName: q.offerName,
    paymentType: q.payment,
    depositPercent: q.payment === "acompte" ? String(q.depositPercent) : "",
    logoProvided: q.hasLogo ? "oui" : "",
    logoDiscount: q.hasLogo ? String(q.logoDiscount) : "",
    listPrice: String(q.listPrice),
    totalPrice: String(q.totalPrice),
    amountCharged: String(q.amount),
    promoCode: q.promoCode ?? "",
    promoDiscount: String(q.promoDiscount ?? 0),
  };
}

export function newOrderFrom(
  q: CheckoutQuote,
  extra: { sessionId: string; demo: boolean; customerName?: string; customerEmail?: string; amountPaid?: number },
): NewOrder {
  return {
    stripeSessionId: extra.sessionId,
    demo: extra.demo,
    packId: q.packId,
    formulaId: q.formulaId,
    offerName: q.offerName,
    paymentType: q.payment,
    hasLogo: q.hasLogo,
    listPrice: q.listPrice,
    totalPrice: q.totalPrice,
    amountPaid: extra.amountPaid ?? q.amount,
    depositPercent: q.depositPercent,
    logoDiscount: q.logoDiscount,
    promoCode: q.promoCode,
    promoDiscount: q.promoDiscount,
    customerName: extra.customerName ?? "",
    customerEmail: extra.customerEmail ?? "",
  };
}

function quoteFromMetadata(m: Stripe.Metadata): CheckoutQuote | null {
  if (!m.packId || !m.totalPrice) return null;
  const payment = parsePaymentType(m.paymentType);
  const totalPrice = Number(m.totalPrice);
  return {
    packId: m.packId,
    formulaId: m.formulaId ?? "",
    offerName: m.offerName || m.packId,
    payment,
    hasLogo: m.logoProvided === "oui",
    listPrice: Number(m.listPrice || totalPrice),
    totalPrice,
    amount: Number(m.amountCharged || totalPrice),
    depositPercent: Number(m.depositPercent || 0),
    logoDiscount: Number(m.logoDiscount || 0),
    promoCode: m.promoCode || undefined,
    promoDiscount: Number(m.promoDiscount || 0),
  };
}

export function paymentSummary(o: Pick<Order, "totalPrice" | "paymentType" | "depositPercent">) {
  return paymentLabel(o.totalPrice, o.paymentType, {
    depositPercent: o.depositPercent,
    logoDiscount: 0,
    deliveryDays: "",
  });
}

// --- Factures Abby ----------------------------------------------------------------

// Factures réelles uniquement pour de vrais paiements : jamais pour une commande de
// démo, ni tant que Stripe est en mode test (sk_test_…), sauf ABBY_IN_TEST_MODE=1.
// Une facture émise dans Abby ne se supprime pas.
export function realInvoicingEnabled(order: { demo: boolean }) {
  if (!abbyConfigured() || order.demo) return false;
  const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
  return stripeKey.startsWith("sk_live_") || process.env.ABBY_IN_TEST_MODE === "1";
}

async function invoiceDeps(order: { demo: boolean }): Promise<InvoiceDeps> {
  const store = getStore();
  return {
    store,
    api: realInvoicingEnabled(order) ? createAbbyApi() : null,
    sendToCustomer: (await store.getFinance()).abbySendInvoice,
    notifyAdmin: (subject, fields) => notify({ subject, fields }),
    emailCustomer: async (to, subject, text, pdf, filename) => {
      await sendToCustomer({ to, subject, text, attachments: [{ filename, content: pdf }] });
    },
  };
}

// Facture du paiement (jamais bloquant : en cas d'échec, la facture reste « en attente »).
export async function invoiceForPayment(orderId: string, payment: PaymentInput) {
  const store = getStore();
  if (store.kind === "static") return null;
  const order = await store.getOrder(orderId);
  if (!order) return null;
  try {
    return await invoicePayment(await invoiceDeps(order), order, payment);
  } catch (e) {
    console.error("Facturation :", e);
    return null;
  }
}

// Relance manuelle depuis l'admin (même clé de paiement : pas de doublon).
export async function retryInvoice(invoiceId: string) {
  const store = getStore();
  const inv = (await store.listInvoices()).find((i) => i.id === invoiceId);
  if (!inv) throw new Error("Facture introuvable.");
  return invoiceForPayment(inv.orderId, { key: inv.paymentKey, kind: inv.kind, amount: inv.amount, paidAt: inv.paidAt });
}

const paymentIntentId = (s: Stripe.Checkout.Session) =>
  typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? undefined);

// Coordonnées de facturation collectées par Stripe Checkout.
function billingFrom(s: Stripe.Checkout.Session) {
  const a = s.customer_details?.address;
  const custom = (key: string) => s.custom_fields?.find((f) => f.key === key)?.text?.value?.trim() || undefined;
  return {
    billingName: s.customer_details?.name ?? undefined,
    billingAddress: a
      ? {
          line1: a.line1 ?? undefined,
          line2: a.line2 ?? undefined,
          postalCode: a.postal_code ?? undefined,
          city: a.city ?? undefined,
          country: a.country ?? undefined,
        }
      : undefined,
    companyName: custom("raisonsociale"),
    companySiret: custom("siret"),
    companyVat: s.customer_details?.tax_ids?.[0]?.value ?? undefined,
  };
}

// Frais Stripe réels d'une session payée (via la balance transaction), si disponibles.
async function realStripeFee(sessionId: string): Promise<number | undefined> {
  const stripe = getStripe();
  if (!stripe) return undefined;
  try {
    const s = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge.balance_transaction"],
    });
    const pi = s.payment_intent as Stripe.PaymentIntent | null;
    const charge = pi?.latest_charge as Stripe.Charge | null | undefined;
    const bt = charge?.balance_transaction as Stripe.BalanceTransaction | null | undefined;
    return typeof bt?.fee === "number" ? bt.fee : undefined;
  } catch (e) {
    console.warn("Frais Stripe indisponibles :", e instanceof Error ? e.message : e);
    return undefined;
  }
}

// Paiement Stripe confirmé (webhook) : commande, ou solde d'une commande.
// Appelé pour checkout.session.completed et checkout.session.async_payment_succeeded :
// rien n'est marqué payé tant que payment_status n'est pas « paid » (moyens de
// paiement différés : virement, PayPal selon les cas…).
// Espace commande du client : lien privé créé à l'enregistrement de la commande et envoyé par
// e-mail une seule fois (un webhook rejoué trouve le lien existant et n'envoie rien).
async function openPortal(order: Order) {
  if (order.deliveryToken) return;
  const token = newDeliveryToken();
  await getStore().updateOrder(order.id, { deliveryToken: token });
  if (!order.customerEmail) return;
  const base = await siteUrl();
  const mail = portalEmail({
    offerName: order.offerName,
    url: `${base}/commande/${token}`,
    briefUrl: `${base}/merci?session_id=${encodeURIComponent(order.stripeSessionId)}`,
  });
  await sendToCustomer({ to: order.customerEmail, subject: mail.subject, text: mail.text }).catch((e) => console.error(e));
}

export async function handleCheckoutCompleted(s: Stripe.Checkout.Session) {
  if (s.payment_status !== "paid") return;
  const store = getStore();
  const m = s.metadata ?? {};

  const fee = await realStripeFee(s.id);
  if (m.kind === "solde" && m.orderId) {
    await markBalancePaid(m.orderId, s.amount_total ?? 0, fee, paymentIntentId(s) ?? s.id);
    return;
  }

  const q = quoteFromMetadata(m);
  const customerEmail = s.customer_details?.email ?? "";
  const customerName = s.customer_details?.name ?? "";
  if (q && store.kind !== "static") {
    const order = await store.recordPaidOrder({
      ...newOrderFrom(q, { sessionId: s.id, demo: false, customerName, customerEmail, amountPaid: s.amount_total ?? q.amount }),
      ...billingFrom(s),
      paymentIntentId: paymentIntentId(s),
      feesPaid: fee,
    });
    await openPortal(order);
    // Une facture par paiement (clé = payment_intent : un webhook rejoué ne crée pas de doublon)
    await invoiceForPayment(order.id, {
      key: paymentIntentId(s) ?? s.id,
      kind: q.payment === "acompte" ? "acompte" : "complete",
      amount: s.amount_total ?? q.amount,
      paidAt: new Date((s.created ?? Date.now() / 1000) * 1000).toISOString(),
    });
  }

  await notify({
    subject: `[Commande] ${q?.offerName ?? m.packId ?? "Offre"}${q?.payment === "acompte" ? " — ACOMPTE" : ""}${q?.hasLogo ? " — LOGO FOURNI" : ""} — ${customerEmail}`,
    replyTo: customerEmail || undefined,
    fields: {
      Offre: q?.offerName ?? m.packId ?? "?",
      "Remise logo": q?.hasLogo ? `oui (−${formatPrice(q.logoDiscount)}, logo à fournir)` : "non",
      Paiement: q ? paymentSummary({ totalPrice: q.totalPrice, paymentType: q.payment, depositPercent: q.depositPercent }) : "?",
      "Montant encaissé": s.amount_total != null ? formatPrice(s.amount_total) : "?",
      Client: customerName,
      "E-mail": customerEmail,
      Session: s.id,
    },
  });
}

// Paiement différé refusé : seule Aurore est prévenue, rien n'est enregistré comme payé.
export async function handleAsyncPaymentFailed(s: Stripe.Checkout.Session) {
  const m = s.metadata ?? {};
  await notify({
    subject: `[Paiement échoué] ${m.kind === "solde" ? "Solde" : m.offerName ?? m.packId ?? "Commande"} — ${s.customer_details?.email ?? ""}`,
    fields: {
      Type: m.kind === "solde" ? `Solde de la commande ${m.orderId}` : "Commande",
      Offre: m.offerName ?? m.packId ?? "?",
      "E-mail": s.customer_details?.email ?? "",
      Session: s.id,
    },
  });
}

// Remboursement fait depuis le Dashboard Stripe (total ou partiel) : les remboursements du
// paiement sont relus chez Stripe et enregistrés sur la commande, puis Aurore est prévenue.
// Ils sont déduits du chiffre d'affaires dans le tableau de bord.
export async function handleChargeRefunded(charge: Stripe.Charge) {
  const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  const store = getStore();
  const stripe = getStripe();
  if (!pi || !stripe || store.kind === "static") return;
  const order = (await store.listOrders()).find((o) => o.paymentIntentId === pi || o.balancePaymentIntentId === pi);
  if (!order) return;

  const list = await stripe.refunds.list({ payment_intent: pi, limit: 100 });
  const fromStripe = list.data
    .filter((r) => r.status === "succeeded" || r.status === "pending")
    .map((r) => ({ id: r.id, amount: r.amount, at: new Date(r.created * 1000).toISOString() }));
  const refunds = mergeRefunds(order.refunds, pi, fromStripe);
  await store.updateOrder(order.id, { refunds });

  await notify({
    subject: `[Remboursement] ${order.offerName} — ${order.customerEmail}`,
    fields: {
      Commande: order.id,
      "Remboursé sur ce paiement": formatPrice(charge.amount_refunded),
      "Total remboursé sur la commande": formatPrice(refundedTotal(refunds)),
      Client: order.customerEmail,
      Rappel: "Pense à faire l'avoir correspondant dans Abby si une facture a été émise.",
    },
  });
}

// Mode démo (sans Stripe) : la commande est enregistrée directement, sans paiement.
export async function recordDemoOrder(q: CheckoutQuote) {
  const sessionId = `demo_${randomUUID()}`;
  const store = getStore();
  if (store.kind !== "static") {
    const order = await store.recordPaidOrder(newOrderFrom(q, { sessionId, demo: true }));
    await openPortal(order);
    await invoiceForPayment(order.id, {
      key: sessionId,
      kind: q.payment === "acompte" ? "acompte" : "complete",
      amount: q.amount,
      paidAt: new Date().toISOString(),
    });
  }
  return sessionId;
}

export async function attachBrief(sessionId: string, brief: Record<string, string>, email: string) {
  const store = getStore();
  if (store.kind === "static" || !sessionId) return null;
  const order = await store.getOrderBySession(sessionId);
  if (!order) return null;
  if (order.briefReceivedAt || order.brief) return order;
  await store.updateOrder(order.id, {
    brief,
    briefReceivedAt: new Date().toISOString(),
    ...(order.status === "payee" ? { status: "brief_recu" as const } : {}),
    // Commande de démo : l'e-mail du client arrive avec le brief.
    ...(!order.customerEmail && email ? { customerEmail: email } : {}),
  });
  return order;
}

export async function markBalancePaid(orderId: string, amount: number, fee?: number, paymentKey?: string) {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) return;
  const key = paymentKey ?? order.balanceSessionId ?? `solde_${orderId}`;
  if (order.balancePaidAt) {
    // Webhook rejoué : la facture du solde est reprise si elle n'a pas abouti
    await invoiceForPayment(orderId, { key, kind: "solde", amount, paidAt: order.balancePaidAt });
    return;
  }
  const paidAt = new Date().toISOString();
  await store.updateOrder(orderId, {
    balancePaymentIntentId: key,
    amountPaid: order.amountPaid + amount,
    // Frais réels cumulés seulement si ceux de l'acompte étaient connus aussi
    ...(fee !== undefined && order.feesPaid !== undefined ? { feesPaid: order.feesPaid + fee } : {}),
    balancePaidAt: paidAt,
    status: order.status === "terminee" ? "terminee" : "solde_paye",
  });
  await notify({
    subject: `[Solde payé] ${order.offerName} — ${order.customerEmail}`,
    fields: { Commande: order.id, Montant: formatPrice(amount), Client: order.customerEmail },
  });
  await invoiceForPayment(orderId, { key, kind: "solde", amount, paidAt });
}

// Crée le lien de paiement du solde (montant recalculé ici depuis la commande).
// returnPath : page où revenir après paiement ou abandon (ex. la page de livraison du client)
// locale : langue de la page de paiement Stripe (espace client consulté en anglais)
export async function createBalanceLink(orderId: string, baseUrl: string, returnPath?: string, locale: "fr" | "en" = "fr") {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) throw new Error("Commande introuvable.");
  const due = balanceDue(order);
  if (due <= 0) throw new Error("Aucun solde à régler pour cette commande.");

  const stripe = getStripe();
  let sessionId: string;
  let url: string;
  if (stripe) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: due,
            product_data: {
              name: locale === "en" ? `zer0oes gfx — ${trOfferName("en", order.offerName)} — Balance` : `zer0oes gfx — ${order.offerName} — Solde`,
              description:
                locale === "en"
                  ? `Balance of the order of ${new Date(order.createdAt).toLocaleDateString("en-GB")}`
                  : `Solde de la commande du ${new Date(order.createdAt).toLocaleDateString("fr-FR")}`,
            },
          },
        },
      ],
      metadata: { kind: "solde", orderId: order.id, amount: String(due) },
      locale: locale === "en" ? "en" : "fr",
      success_url: `${baseUrl}${returnPath ? `${returnPath}?retour=solde` : "/merci/solde"}`,
      cancel_url: `${baseUrl}${returnPath ?? "/"}`,
    });
    sessionId = session.id;
    url = session.url!;
  } else {
    // Démo : page locale qui simule le paiement (indisponible en production).
    sessionId = `demo_solde_${randomUUID()}`;
    url = `${baseUrl}/paiement-demo/solde?commande=${order.id}`;
  }
  await store.updateOrder(order.id, { balanceSessionId: sessionId, balanceUrl: url });
  return { url, due, order };
}
