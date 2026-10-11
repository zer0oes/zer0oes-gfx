import { readStoredZip } from "./custom-lab/zip";
import { downloadFilename, itemType, previewPublished, unlockState } from "./delivery";
import type { Deliverable, Order } from "./store/types";

export function canDownloadArchive(order: Pick<Order, "totalPrice" | "amountPaid">, items: Deliverable[]) {
  return items.length > 0 && items.every((item) => previewPublished(item) && unlockState(order, item) === "debloque" && Boolean(item.storagePath || item.url || item.finalAssets?.length));
}

export function archiveGuides(items: Deliverable[]) {
  const types = new Set(items.map((item) => {
    const type = itemType(item);
    // Les anciennes commandes à la carte peuvent avoir un type générique « Visuel ».
    if (["visuel", "video", "fichier"].includes(type)) {
      if (/\b(?:widgets?|alertes?|alerts?)\b/i.test(item.label)) return "widget";
      if (/\boverlays?\b/i.test(item.label)) return "overlay";
    }
    return type;
  }));
  return [
    ...(types.has("overlay") ? ["guide-installation-overlay-obs.html"] : []),
    ...(types.has("widget") || types.has("alerte") ? ["guide-installation-widgets.html"] : []),
  ];
}

export function archiveEntries(orderId: string, items: Deliverable[], reservedNames: string[] = []) {
  const used = new Set<string>(reservedNames.map((name) => name.toLowerCase()));
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

// Dossier livré par le Laboratoire (zip d'un seul dossier) : ses fichiers vont dans un dossier du même nom que
// l'entrée, sans zip dans le zip. null si le zip n'est pas lisible : il est alors archivé tel quel.
export function folderFiles(entryName: string, data: Uint8Array) {
  const files = readStoredZip(data);
  if (!files?.length) return null;
  const folder = entryName.replace(/\.zip$/i, "");
  const inner = files.map((file) => ({ ...file, name: file.name.split("/").slice(1).join("/") }));
  if (inner.some((file) => !file.name || file.name.split("/").some((part) => !part || part === "..") || file.name.endsWith("/"))) return null;
  return inner.map((file) => ({ name: `${folder}/${file.name}`, data: file.data }));
}
