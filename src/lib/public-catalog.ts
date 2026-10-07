import "server-only";
import { getStore } from "@/lib/store";
import { saleCatalog } from "@/lib/promotions";
export async function getPublicCatalog() {
  const store = getStore();
  const [catalog, promotions] = await Promise.all([store.getCatalog(), store.listPromotions()]);
  const publicCatalog = saleCatalog(catalog, promotions);
  return { ...publicCatalog, packs: publicCatalog.packs.map((pack) => ({ ...pack, deliverables: pack.deliverables.map((line) => line.replace(/overlays fixes/gi, "overlays").replace(/static overlays/gi, "overlays")) })) };
}
