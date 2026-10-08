import "server-only";
import { getStore } from "@/lib/store";

export async function countPendingOrders() {
  const store = getStore();
  const [paid, briefReceived, waiting] = await Promise.all([
    store.listOrders("payee"),
    store.listOrders("brief_recu"),
    store.listOrders("brief_attente"),
  ]);
  return paid.length + briefReceived.length + waiting.length;
}
