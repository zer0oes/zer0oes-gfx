// Durée de conservation des fichiers livrés : passé le délai après la clôture du projet
// (voir FILES_RETENTION_MONTHS), les fichiers et aperçus sont supprimés du stockage, ainsi que
// les éléments de livraison correspondants. Les données de commande et factures, elles, restent.
import { filesExpired } from "@/lib/portal";

type Order = { id: string; completedAt?: string };
type Item = { id: string; storagePath?: string; previewPath?: string };

export type PurgeDeps = {
  listOrders(): Promise<Order[]>;
  listDeliverables(orderId: string): Promise<Item[]>;
  deleteDeliverable(id: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
};

export async function purgeExpiredDeliverables(deps: PurgeDeps, opts: { apply: boolean; now?: Date }) {
  const report: { orderId: string; items: number; files: number }[] = [];
  for (const order of await deps.listOrders()) {
    if (!filesExpired(order, opts.now)) continue;
    const items = await deps.listDeliverables(order.id);
    if (!items.length) continue;
    const files = items.flatMap((d) => [d.storagePath, d.previewPath]).filter((p): p is string => Boolean(p));
    report.push({ orderId: order.id, items: items.length, files: files.length });
    if (!opts.apply) continue;
    for (const f of files) await deps.deleteFile(f);
    for (const d of items) await deps.deleteDeliverable(d.id);
  }
  return report;
}
