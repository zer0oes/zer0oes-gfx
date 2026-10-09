import "server-only";
import { correctionPending, previewPublished, unlockState } from "@/lib/delivery";
import { filesExpired } from "@/lib/portal";
import { refundedTotal } from "@/lib/refunds";
import type { Deliverable, Order } from "@/lib/store/types";
import { isStreamingPlatform, type AlertPackVersion, type StreamingPlatform } from "./types";

// Les sources doivent appartenir au stockage privé de la commande, jamais à une URL
// signée ou au compte créateur. L'adaptateur transférera ensuite les médias au client.
export function packSourcesValid(pack: AlertPackVersion) {
  const ownedPath = (path: string) => path.startsWith(`${pack.orderId}/`)
    && path.split("/").every((segment) => Boolean(segment) && segment !== "." && segment !== "..")
    && !/[\\%?#\s\x00-\x1f\x7f]/.test(path);
  const keys = pack.media.map((media) => media.key);
  return Boolean(pack.orderId && pack.deliverableId && pack.id && pack.label.trim())
    && isStreamingPlatform(pack.platform) && ["alertes", "widget"].includes(pack.kind)
    && !/[\\/]/.test(pack.orderId)
    && Number.isSafeInteger(pack.version) && pack.version > 0
    && ownedPath(pack.configurationPath)
    && keys.every((key) => /^[a-zA-Z0-9_-]{1,80}$/.test(key))
    && new Set(keys).size === keys.length
    && pack.media.every((media) => ["image", "video", "audio"].includes(media.kind)
      && Boolean(media.label.trim()) && ownedPath(media.storagePath));
}

export type InstallationEligibility =
  | "introuvable" | "expiree" | "a_valider" | "solde_a_regler"
  | "remboursement" | "pack_a_preparer" | "integration_indisponible";

// À appeler sur des objets relus côté serveur ; ne constitue pas une autorisation
// réutilisable. Le futur traitement devra revérifier ces conditions atomiquement.
export function installationEligibility(
  order: Order,
  item: Deliverable,
  pack: AlertPackVersion | null,
  platform: StreamingPlatform,
  now = new Date(),
): InstallationEligibility {
  if (!isStreamingPlatform(platform) || item.orderId !== order.id || (pack && (pack.platform !== platform || pack.orderId !== order.id || pack.deliverableId !== item.id))) return "introuvable";
  if (filesExpired(order, now)) return "expiree";
  if (!previewPublished(item) || correctionPending(item) || (item.plannedKey && !item.previewPath)) return "a_valider";
  if (![order.totalPrice, order.amountPaid].every((amount) => Number.isSafeInteger(amount) && amount >= 0)) return "solde_a_regler";
  const state = unlockState(order, item);
  if (state !== "debloque") return state;
  // Politique conservatrice pour les nouvelles installations uniquement : aucun
  // changement des règles actuelles de paiement ou téléchargement.
  if (refundedTotal(order.refunds) > 0) return "remboursement";
  if (!pack || pack.status !== "pret" || !packSourcesValid(pack)) return "pack_a_preparer";
  // Aucun réglage ne permet l'activation avant validation du contrat API et OAuth.
  return "integration_indisponible";
}
