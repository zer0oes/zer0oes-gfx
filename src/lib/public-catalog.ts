import "server-only";
import { getStore } from "@/lib/store";
import { saleCatalog } from "@/lib/promotions";
export async function getPublicCatalog() {
  const store = getStore();
  const [catalog, promotions] = await Promise.all([store.getCatalog(), store.listPromotions()]);
  return saleCatalog(catalog, promotions);
}
