// Facturation automatique : une facture Abby par paiement Stripe encaissé.
// Idempotent (clé = payment_intent) et reprenable : chaque étape réussie est
// enregistrée, une relance reprend là où l'échec s'est produit.
import type { AbbyApi, AbbyLine } from "@/lib/abby";
import { formatPrice } from "@/lib/pricing";
import type { Invoice, InvoiceKind, Order, Store } from "@/lib/store/types";

export type InvoiceDeps = {
  store: Store;
  api: AbbyApi | null; // null : mode démo (aucune facture réelle)
  sendToCustomer: boolean;
  notifyAdmin: (subject: string, fields: Record<string, string>) => Promise<void>;
  emailCustomer: (to: string, subject: string, text: string, pdf: Uint8Array, filename: string) => Promise<void>;
};

export type PaymentInput = { key: string; kind: InvoiceKind; amount: number; paidAt: string };

const date = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

export function invoiceLines(order: Order, payment: PaymentInput, depositInvoice?: Invoice): AbbyLine[] {
  const logo = order.hasLogo
    ? ` Prix catalogue ${formatPrice(order.listPrice)}, remise « logo déjà existant » −${formatPrice(order.logoDiscount)}.`
    : "";
  if (payment.kind === "acompte") {
    return [
      {
        designation: `Acompte de ${order.depositPercent} % — ${order.offerName}`,
        description: `Acompte sur la commande du ${date(order.createdAt)} (total ${formatPrice(order.totalPrice)}).${logo} Le solde de ${formatPrice(order.totalPrice - payment.amount)} sera facturé à la livraison.`,
        unitPrice: payment.amount,
      },
    ];
  }
  if (payment.kind === "solde") {
    const deposit = order.totalPrice - payment.amount;
    return [
      {
        designation: `Solde — ${order.offerName}`,
        description: `Commande du ${date(order.createdAt)} : total ${formatPrice(order.totalPrice)}, dont acompte de ${formatPrice(deposit)} déjà facturé${depositInvoice?.number ? ` (facture n° ${depositInvoice.number})` : ""}.${logo}`,
        unitPrice: payment.amount,
      },
    ];
  }
  return [
    {
      designation: order.offerName,
      description: `Création graphique sur mesure — commande du ${date(order.createdAt)}.${logo}`,
      unitPrice: payment.amount,
    },
  ];
}

export async function invoicePayment(deps: InvoiceDeps, order: Order, payment: PaymentInput): Promise<Invoice> {
  const { store, api } = deps;
  const existing = await store.getInvoiceByKey(payment.key);
  if (existing?.status === "emise") return existing; // webhook rejoué : rien à refaire

  let inv: Invoice =
    existing ??
    (await store.saveInvoice({
      orderId: order.id,
      paymentKey: payment.key,
      kind: payment.kind,
      amount: payment.amount,
      paidAt: payment.paidAt,
      status: "en_attente",
      finalized: false,
      paidMarked: false,
      sentToCustomer: false,
      demo: !api,
      attempts: 0,
    }));
  const save = async (patch: Partial<Invoice>) => (inv = await store.saveInvoice({ ...inv, ...patch }));

  if (!api) {
    // Démo : aucune facture réelle, tout est simulé et journalisé
    const n = (await store.listInvoices()).filter((i) => i.demo && i.status === "emise").length + 1;
    console.info(`[Abby démo] Facture ${payment.kind} de ${formatPrice(payment.amount)} pour ${order.customerEmail || order.id}`);
    return save({ status: "emise", number: `DEMO-${String(n).padStart(4, "0")}`, finalized: true, paidMarked: true, attempts: inv.attempts + 1 });
  }

  try {
    await save({ attempts: inv.attempts + 1, status: "en_attente", error: undefined });
    if (!inv.abbyCustomerId) {
      if (!order.customerEmail) throw new Error("E-mail client inconnu.");
      const customerId = await api.findOrCreateCustomer({
        email: order.customerEmail,
        name: order.billingName || order.customerName,
        companyName: order.companyName,
        siret: order.companySiret,
        vatNumber: order.companyVat,
        address: order.billingAddress,
      });
      await save({ abbyCustomerId: customerId });
    }
    if (!inv.abbyInvoiceId) {
      const deposit =
        payment.kind === "solde" ? (await store.listInvoices(order.id)).find((i) => i.kind === "acompte") : undefined;
      const { id } = await api.createInvoice(inv.abbyCustomerId!, invoiceLines(order, payment, deposit));
      await save({ abbyInvoiceId: id });
    }
    if (!inv.finalized) {
      const { number } = await api.finalize(inv.abbyInvoiceId!);
      await save({ finalized: true, number: number ?? inv.number });
    }
    if (!inv.paidMarked) {
      await api.markPaid(inv.abbyInvoiceId!, { amount: payment.amount, receivedAt: payment.paidAt, transactionId: payment.key });
      await save({ paidMarked: true });
    }
    if (deps.sendToCustomer && !inv.sentToCustomer && order.customerEmail) {
      const pdf = await api.downloadPdf(inv.abbyInvoiceId!);
      await deps.emailCustomer(
        order.customerEmail,
        `Ta facture zer0oes gfx${inv.number ? ` n° ${inv.number}` : ""}`,
        `Bonjour,\n\nTu trouveras ci-joint la facture de ton paiement de ${formatPrice(payment.amount)} (${order.offerName}).\n\nMerci !\nAurore — zer0oes gfx`,
        pdf,
        `facture-${inv.number ?? inv.id}.pdf`,
      );
      await save({ sentToCustomer: true });
    }
    return save({ status: "emise", error: undefined });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await save({ status: "echec", error: message.slice(0, 500) });
    await deps
      .notifyAdmin(`[Facture en attente] ${order.offerName} — ${order.customerEmail}`, {
        Commande: order.id,
        Paiement: `${payment.kind} de ${formatPrice(payment.amount)}`,
        Erreur: message,
        Action: "Ouvre la commande dans l'admin et clique sur « Réessayer ».",
      })
      .catch(() => {});
    return inv;
  }
}
