import "server-only";
import { getStore } from "@/lib/store";

export async function countPendingOrders() {
  const store = getStore();
  const [paid, briefReceived] = await Promise.all([
    store.listOrders("payee"),
    store.listOrders("brief_recu"),
  ]);
  return paid.length + briefReceived.length;
}
