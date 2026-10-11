import type { Order, Deliverable } from "./store/types";

export const cancellationStarted = (order: Pick<Order, "status">) => order.status === "annulation_en_cours" || order.status === "annulee";
export function canCancelOrder(order: Pick<Order, "status" | "demo" | "amountPaid" | "paymentIntentId" | "deliveredAt">, items: Pick<Deliverable, "publishedAt">[]) {
  return !order.demo && order.amountPaid > 0 && Boolean(order.paymentIntentId) && !order.deliveredAt
    && ["payee", "brief_attente", "brief_recu"].includes(order.status) && !items.some((item) => item.publishedAt);
}
