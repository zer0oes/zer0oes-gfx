import { downloadFilename, previewPublished, unlockState } from "./delivery";
import type { Deliverable, Order } from "./store/types";

export function canDownloadArchive(order: Pick<Order, "totalPrice" | "amountPaid">, items: Deliverable[]) {
  return items.length > 0 && items.every((item) => previewPublished(item) && unlockState(order, item) === "debloque" && Boolean(item.storagePath || item.url || item.finalAssets?.length));
}

export function archiveEntries(orderId: string, items: Deliverable[]) {
  const used = new Set<string>();
  return items.flatMap((item) => {
    // Code d'installation StreamElements sans lien : rien à archiver (il s'installe depuis l'espace commande)
    const assets = [...(item.finalAssets ?? []).filter((asset) => asset.path || asset.url), ...(item.storagePath || item.url ? [{ path: item.storagePath, url: item.url, label: item.label }] : [])];
    return assets.map((asset) => {
      if (asset.path && !asset.path.startsWith(`${orderId}/`)) throw new Error("Chemin de fichier invalide.");
      if (!asset.path && !asset.url) throw new Error("Fichier final manquant.");
      const base = downloadFilename(asset.label, asset.path ?? "import.url");
      let name = base;
      let index = 2;
      while (used.has(name.toLowerCase())) {
        const dot = base.lastIndexOf(".");
        name = dot > 0 ? `${base.slice(0, dot)} (${index++})${base.slice(dot)}` : `${base} (${index++})`;
      }
      used.add(name.toLowerCase());
      return { ...asset, itemId: item.id, name };
    });
  });
}
