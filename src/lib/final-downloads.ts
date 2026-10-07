import type { Deliverable } from "./store/types";

export function hasFinalAccess(item: Pick<Deliverable, "finalAccessedAt" | "accessedFinalAssets">) {
  return Boolean(item.finalAccessedAt || item.accessedFinalAssets?.length);
}

export function finalAssetKeys(item: Pick<Deliverable, "storagePath" | "url" | "finalAssets">) {
  return [...new Set([item.storagePath, item.url, ...(item.finalAssets ?? []).map((asset) => asset.path ?? asset.url)].filter((key): key is string => Boolean(key)))];
}

export function allFinalsAccessed(item: Pick<Deliverable, "storagePath" | "url" | "finalAssets" | "accessedFinalAssets">) {
  const keys = finalAssetKeys(item);
  return keys.length > 0 && keys.every((key) => item.accessedFinalAssets?.includes(key));
}

export function readyToClose(order: { amountPaid: number; totalPrice: number }, items: Parameters<typeof allFinalsAccessed>[0][]) {
  return order.amountPaid >= order.totalPrice && items.length > 0 && items.every(allFinalsAccessed);
}
