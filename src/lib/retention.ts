// Rapport des accès expirés. Les fichiers, aperçus et historiques sont conservés.
// Les routes clientes bloquent les accès après FILES_RETENTION_MONTHS.
import { filesExpired } from "@/lib/portal";

type Order = { id: string; completedAt?: string };
type Item = { id: string; storagePath?: string; previewPath?: string; previewVersions?: { path: string }[]; finalAssets?: { path?: string }[] };

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
    const files = items.flatMap((d) => [d.storagePath, d.previewPath, ...(d.previewVersions ?? []).map((v) => v.path), ...(d.finalAssets ?? []).map((asset) => asset.path)]).filter((p): p is string => Boolean(p));
    report.push({ orderId: order.id, items: items.length, files: files.length });
    // L'expiration bloque l'accès client sans supprimer de fichiers ou d'historique.
  }
  return report;
}
