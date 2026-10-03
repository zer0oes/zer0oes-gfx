import "server-only";
import { randomUUID } from "node:crypto";
import type Stripe from "stripe";
import { notify } from "@/lib/notify";
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
import { getStripe } from "@/lib/stripe";

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
};

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
  return {
    packId: pack.id,
    formulaId: formula.id,
    offerName: formulaName(pack, formula),
    payment,
    hasLogo,
    listPrice: formula.price,
    totalPrice,
    amount: amountToPay(totalPrice, payment, s),
    depositPercent: s.depositPercent,
    logoDiscount: formula.price - totalPrice,
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
  };
}

export function paymentSummary(o: Pick<Order, "totalPrice" | "paymentType" | "depositPercent">) {
  return paymentLabel(o.totalPrice, o.paymentType, {
    depositPercent: o.depositPercent,
    logoDiscount: 0,
    deliveryDays: "",
  });
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
export async function handleCheckoutCompleted(s: Stripe.Checkout.Session) {
  if (s.payment_status !== "paid") return;
  const store = getStore();
  const m = s.metadata ?? {};

  const fee = await realStripeFee(s.id);
  if (m.kind === "solde" && m.orderId) {
    await markBalancePaid(m.orderId, s.amount_total ?? 0, fee);
    return;
  }

  const q = quoteFromMetadata(m);
  const customerEmail = s.customer_details?.email ?? "";
  const customerName = s.customer_details?.name ?? "";
  if (q && store.kind !== "static") {
    await store.recordPaidOrder(
      { ...newOrderFrom(q, { sessionId: s.id, demo: false, customerName, customerEmail, amountPaid: s.amount_total ?? q.amount }), feesPaid: fee },
    );
  }

  await notify({
    subject: `[Commande] ${q?.offerName ?? m.packId ?? "Offre"}${q?.payment === "acompte" ? " — ACOMPTE" : ""}${q?.hasLogo ? " — LOGO FOURNI" : ""} — ${customerEmail}`,
    replyTo: customerEmail || undefined,
    fields: {
      Offre: q?.offerName ?? m.packId ?? "?",
      "Remise logo": q?.hasLogo ? `oui (−${formatPrice(q.logoDiscount)} HT, logo à fournir)` : "non",
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

// Mode démo (sans Stripe) : la commande est enregistrée directement, sans paiement.
export async function recordDemoOrder(q: CheckoutQuote) {
  const sessionId = `demo_${randomUUID()}`;
  const store = getStore();
  if (store.kind !== "static") await store.recordPaidOrder(newOrderFrom(q, { sessionId, demo: true }));
  return sessionId;
}

export async function attachBrief(sessionId: string, brief: Record<string, string>, email: string) {
  const store = getStore();
  if (store.kind === "static" || !sessionId) return null;
  const order = await store.getOrderBySession(sessionId);
  if (!order) return null;
  await store.updateOrder(order.id, {
    brief,
    briefReceivedAt: new Date().toISOString(),
    ...(order.status === "payee" ? { status: "brief_recu" as const } : {}),
    // Commande de démo : l'e-mail du client arrive avec le brief.
    ...(!order.customerEmail && email ? { customerEmail: email } : {}),
  });
  return order;
}

export async function markBalancePaid(orderId: string, amount: number, fee?: number) {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order || order.balancePaidAt) return;
  await store.updateOrder(orderId, {
    amountPaid: order.amountPaid + amount,
    // Frais réels cumulés seulement si ceux de l'acompte étaient connus aussi
    ...(fee !== undefined && order.feesPaid !== undefined ? { feesPaid: order.feesPaid + fee } : {}),
    balancePaidAt: new Date().toISOString(),
    status: order.status === "terminee" ? "terminee" : "solde_paye",
  });
  await notify({
    subject: `[Solde payé] ${order.offerName} — ${order.customerEmail}`,
    fields: { Commande: order.id, Montant: formatPrice(amount), Client: order.customerEmail },
  });
}

// Crée le lien de paiement du solde (montant recalculé ici depuis la commande).
export async function createBalanceLink(orderId: string, baseUrl: string) {
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
              name: `zer0oes gfx — ${order.offerName} — Solde`,
              description: `Solde de la commande du ${new Date(order.createdAt).toLocaleDateString("fr-FR")}`,
            },
          },
        },
      ],
      metadata: { kind: "solde", orderId: order.id, amount: String(due) },
      success_url: `${baseUrl}/merci/solde`,
      cancel_url: `${baseUrl}/`,
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
