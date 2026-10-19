import "server-only";
import { getStore } from "@/lib/store";
import { launchCatalog } from "@/lib/launch-offer";
export async function getPublicCatalog() {
  const store = getStore();
  const [catalog, promotions, launch] = await Promise.all([store.getCatalog(), store.listPromotions(), store.getLaunchState()]);
  const publicCatalog = launchCatalog(catalog, launch, promotions);
  return { ...publicCatalog, packs: publicCatalog.packs.map((pack) => ({ ...pack, deliverables: pack.deliverables.map((line) => line.replace(/overlays fixes/gi, "overlays").replace(/static overlays/gi, "overlays")) })) };
}
