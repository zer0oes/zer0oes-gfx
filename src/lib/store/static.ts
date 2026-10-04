import { defaultSettings, options, packs } from "@/data/packs";
import { streamers, works } from "@/data/portfolio";
import { defaultFinance } from "@/lib/finance";
import type { Catalog } from "@/lib/pricing";
import { defaultProtection } from "@/lib/protection";
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
  deletePack: readOnly,
  reorderPacks: readOnly,
  getFinance: async () => ({ ...defaultFinance }),
  saveFinance: readOnly,
  getProtection: async () => ({ ...defaultProtection }),
  saveProtection: readOnly,
  saveOptions: readOnly,
  saveStreamer: readOnly,
  deleteStreamer: readOnly,
  saveWork: readOnly,
  deleteWork: readOnly,
  reorderWorks: readOnly,
  reorderStreamers: readOnly,
  getCaseStudyTexts: async () => null,
  saveCaseStudyTexts: readOnly,
  getHomeContent: async () => null,
  saveHomeContent: readOnly,
  uploadAsset: readOnly,
  recordPaidOrder: readOnly,
  getOrder: async () => null,
  getOrderBySession: async () => null,
  listOrders: async () => [],
  updateOrder: readOnly,
  addNote: readOnly,
  listDeliverables: async () => [],
  addDeliverable: readOnly,
  deleteDeliverable: readOnly,
  getOrderByDeliveryToken: async () => null,
  listInvoices: async () => [],
  getInvoiceByKey: async () => null,
  saveInvoice: readOnly,
};
