import "server-only";
import { revalidatePath } from "next/cache";
import { getStore } from "./store";
import { getStripe } from "./stripe";
import { cancellationRefunds } from "./cancellation-refunds";
import { notify, sendToCustomer } from "./notify";
import { cancellationEmail } from "./cancellation-email";
import { formatPrice } from "./pricing";
import { refundedTotal } from "./refunds";
import type { Order } from "./store/types";

// Fin d'une annulation engagée (statut « annulation_en_cours ») : remboursement Stripe de tout ce qui a été payé,
// puis statut « annulee ». Rejouable sans risque (clé d'idempotence), par le client ou depuis l'admin.
export async function completeOrderCancellation(order: Order, by: "client" | "admin") {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe indisponible");
  const { refunds, pending } = await cancellationRefunds(stripe, order);
  await getStore().updateOrder(order.id, { refunds, status: "annulee" });
  if (order.customerEmail) {
    const mail = cancellationEmail(order, refundedTotal(refunds), pending);
    await sendToCustomer({
      to: order.customerEmail,
      ...mail,
      idempotencyKey: `order-cancelled-${order.id}`,
    }).catch((error) => console.error("Cancellation customer email failed", error));
  }
  await notify({
    subject: `[Annulation] ${order.offerName} — ${order.customerEmail}`,
    fields: {
      Commande: order.id,
      Client: order.customerEmail,
      "Remboursé": formatPrice(refundedTotal(refunds)),
      Remboursement: pending ? "En cours de traitement chez Stripe" : "Effectué",
      Rappel: by === "client"
        ? "La commande est annulée par le client : arrête la création. Pense à l’avoir dans Abby si une facture a été émise."
        : "Annulation finalisée depuis l’admin. Pense à l’avoir dans Abby si une facture a été émise.",
    },
  }).catch((error) => console.error("Cancellation notification failed", error));
  revalidatePath("/merci", "page");
  revalidatePath("/[lang]/merci", "page");
  if (order.deliveryToken) revalidatePath(`/commande/${order.deliveryToken}`);
  revalidatePath(`/admin/commandes/${order.id}`);
  revalidatePath("/admin/commandes");
  return { pending };
}
