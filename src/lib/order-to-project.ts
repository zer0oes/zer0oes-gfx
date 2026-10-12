import type { Category } from "@/data/portfolio";
import { itemType, mediaKind } from "./delivery";
import type { Deliverable, Order } from "./store/types";

// Conversion d'une commande terminée en projet du portfolio (créé en brouillon).

// Nom du projet : pseudo du brief, sinon nom du client, sinon formule commandée
export function projectName(order: Pick<Order, "brief" | "customerName" | "offerName">) {
  return (order.brief?.Pseudo || order.customerName || order.offerName).trim().slice(0, 80);
}

// Lien de la chaîne indiqué dans le brief, gardé seulement s'il est en https
export function projectUrl(order: Pick<Order, "brief">) {
  const raw = order.brief?.Chaîne?.trim();
  if (!raw) return undefined;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

// Type de réalisation du portfolio d'après le badge du livrable et son intitulé ; null : pas montré
export function projectCategory(item: Pick<Deliverable, "itemType" | "kind" | "storagePath" | "label">): Category | null {
  const type = itemType(item);
  if (type === "guide" || type === "fichier") return null;
  if (type === "overlay") return "overlays";
  if (type === "widget") return "widgets";
  if (type === "alerte") return "alertes";
  const label = item.label.toLowerCase();
  if (/logo/.test(label)) return "logo";
  if (/emote|émoticône/.test(label)) return "emotes";
  if (/overlay|scène|scene|écran|ecran/.test(label)) return "overlays";
  if (/alerte|alert/.test(label)) return "alertes";
  if (/widget|tchat|chat/.test(label)) return "widgets";
  return "reseaux";
}

// Fichier repris pour la réalisation : visuel final (redimensionné et filigrané à l'import),
// sinon aperçu ; pour une vidéo, l'aperçu léger plutôt que le fichier final.
export function projectSource(item: Pick<Deliverable, "storagePath" | "previewPath" | "previewType" | "finalAssets">): { path: string; kind: "image" | "video" } | null {
  const finals = [...(item.finalAssets ?? []).map((a) => a.path), item.storagePath].filter((p): p is string => Boolean(p));
  const image = finals.find((p) => mediaKind(p) === "image");
  if (image) return { path: image, kind: "image" };
  if (item.previewPath) {
    const kind = item.previewType ?? mediaKind(item.previewPath);
    if (kind) return { path: item.previewPath, kind };
  }
  const video = finals.find((p) => mediaKind(p) === "video");
  return video ? { path: video, kind: "video" } : null;
}
