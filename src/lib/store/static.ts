import { defaultSettings, options, packs } from "@/data/packs";
import { streamers, works } from "@/data/portfolio";
import type { Catalog } from "@/lib/pricing";
import { ReadOnlyStoreError, type Portfolio, type Store } from "./types";

// Contenu par défaut, tiré de src/data.
export function staticCatalog(): Catalog {
  return structuredClone({ settings: defaultSettings, packs, options });
}

export function staticPortfolio(): Portfolio {
  return structuredClone({ streamers, works });
}

const readOnly = async (): Promise<never> => {
  throw new ReadOnlyStoreError();
};

// Sans base de données : le site public fonctionne sur les données statiques,
// les commandes ne sont pas enregistrées (seulement notifiées par e-mail).
export const staticStore: Store = {
  kind: "static",
  getCatalog: async () => staticCatalog(),
  getPortfolio: async () => staticPortfolio(),
  saveSettings: readOnly,
  savePack: readOnly,
  saveOptions: readOnly,
  saveStreamer: readOnly,
  deleteStreamer: readOnly,
  saveWork: readOnly,
  deleteWork: readOnly,
  uploadAsset: readOnly,
  recordPaidOrder: readOnly,
  getOrder: async () => null,
  getOrderBySession: async () => null,
  listOrders: async () => [],
  updateOrder: readOnly,
  addNote: readOnly,
};
