import type { Order, Deliverable } from "@/lib/store/types";
import { overlayTypes } from "@/lib/pricing";
import { previewPublished, correctionPending } from "@/lib/delivery";
import { allFinalsAccessed } from "./final-downloads";
import { withoutInstallLine } from "./brief-delivery";

export function plannedDelivery(order: Pick<Order, "deliveryTemplate" | "brief" | "hasLogo" | "formulaId" | "packId">) {
  const result: { key: string; label: string; itemType: string }[] = [];
  const animated = order.deliveryTemplate?.some((line) => /animation|overlays?.*anim/i.test(line));
  // Le supplément d'installation n'est pas une création à livrer
  for (const line of withoutInstallLine(order.deliveryTemplate)) {
    if (order.packId === "sur-mesure") {
      const itemType = /overlay/i.test(line) ? "overlay" : /alerte/i.test(line) ? "alerte" : "visuel";
      result.push({ key: `item-${result.length}`, label: line, itemType });
      continue;
    }
    if (order.packId === "options" || order.packId.startsWith("option:")) {
      result.push({ key: `item-${result.length}`, label: line, itemType: "visuel" });
      continue;
    }
    if (/correction/i.test(line)) continue;
    if (/overlay/i.test(line)) {
      for (const scene of overlayTypes.filter((s) => order.brief?.["Overlays choisis"]?.includes(s))) {
        if (!result.some((item) => item.key === `overlay-${scene}`)) result.push({ key: `overlay-${scene}`, label: `Overlay ${scene}${animated ? " — animé" : ""}`, itemType: "overlay" });
      }
    } else if (/banni[eè]re.*avatar/i.test(line)) {
      result.push({ key: "banner", label: "Bannière", itemType: "visuel" }, { key: "avatar", label: "Avatar", itemType: "visuel" });
    } else if (/alertes/i.test(line)) result.push({ key: "alertes", label: line, itemType: "alerte" });
    else if (/logo/i.test(line) && order.hasLogo) continue;
    else if (/emotes/i.test(line)) result.push({ key: "emotes", label: line.match(/\d+\s+emotes[^:€]*?(?=\s+(pour|:|\+)|$)/i)?.[0] ?? line, itemType: "visuel" });
    else result.push({ key: `item-${result.length}`, label: line, itemType: "visuel" });
  }
  if (/emotes/.test(order.formulaId) && !result.some((item) => /emote/i.test(item.label))) result.push({ key: "emotes", label: `${order.packId === "premier-look" ? 5 : 10} emotes personnalisées`, itemType: "visuel" });
  return result;
}

export function deliveryState(order: Pick<Order, "totalPrice" | "amountPaid">, item: Deliverable) {
  if (correctionPending(item)) return "Correction demandée";
  if (!previewPublished(item)) return "À préparer";
  if (!item.approvedAt) return "À valider";
  if (order.amountPaid >= order.totalPrice && allFinalsAccessed(item)) return "Téléchargé";
  if (order.amountPaid >= order.totalPrice && (item.storagePath || item.url || item.finalAssets?.length)) return "Prêt à télécharger";
  return "Validé";
}
