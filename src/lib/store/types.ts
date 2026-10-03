import type { Streamer, Work } from "@/data/portfolio";
import type { Catalog, Option, Pack, PaymentType, PricingSettings } from "@/lib/pricing";

export type Portfolio = { streamers: Streamer[]; works: Work[] };

// Cycle de vie d'une commande.
export const orderStatuses = [
  { id: "payee", label: "Payée" },
  { id: "brief_recu", label: "Brief reçu" },
  { id: "en_cours", label: "En cours" },
  { id: "livree", label: "Livrée" },
  { id: "solde_paye", label: "Solde payé" },
  { id: "terminee", label: "Terminée" },
] as const;

export type OrderStatus = (typeof orderStatuses)[number]["id"];

export function isOrderStatus(v: unknown): v is OrderStatus {
  return orderStatuses.some((s) => s.id === v);
}

export function statusLabel(s: OrderStatus) {
  return orderStatuses.find((x) => x.id === s)?.label ?? s;
}

export type OrderNote = { id: string; createdAt: string; body: string };

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  stripeSessionId: string;
  demo: boolean;
  packId: string;
  formulaId: string;
  offerName: string;
  paymentType: PaymentType;
  hasLogo: boolean;
  // Montants en centimes HT
  listPrice: number;
  totalPrice: number;
  amountPaid: number;
  depositPercent: number;
  logoDiscount: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  balanceSessionId?: string;
  balanceUrl?: string;
  balancePaidAt?: string;
  brief?: Record<string, string>;
  briefReceivedAt?: string;
  notes: OrderNote[];
};

export type NewOrder = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "status" | "notes" | "balanceSessionId" | "balanceUrl" | "balancePaidAt" | "brief" | "briefReceivedAt"
>;

export type OrderPatch = Partial<
  Pick<
    Order,
    | "status"
    | "amountPaid"
    | "balanceSessionId"
    | "balanceUrl"
    | "balancePaidAt"
    | "brief"
    | "briefReceivedAt"
    | "customerEmail"
    | "customerName"
  >
>;

export function balanceDue(o: Pick<Order, "totalPrice" | "amountPaid">) {
  return Math.max(0, o.totalPrice - o.amountPaid);
}

export interface Store {
  kind: "supabase" | "local" | "static";
  // Lecture publique
  getCatalog(): Promise<Catalog>;
  getPortfolio(): Promise<Portfolio>;
  // Admin : offres et réglages
  saveSettings(settings: PricingSettings): Promise<void>;
  savePack(pack: Pack): Promise<void>;
  saveOptions(options: Option[]): Promise<void>;
  // Admin : portfolio
  saveStreamer(streamer: Streamer, position?: number): Promise<void>;
  deleteStreamer(id: string): Promise<void>;
  saveWork(work: Work, position?: number): Promise<void>;
  deleteWork(id: string): Promise<void>;
  reorderWorks(orderedIds: string[]): Promise<void>;
  // Upload signé (Supabase) : le navigateur envoie le fichier directement au stockage.
  createSignedUpload?(path: string): Promise<{ token: string; publicUrl: string }>;
  uploadAsset(path: string, data: Uint8Array, contentType: string): Promise<string>;
  // Commandes
  recordPaidOrder(order: NewOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderBySession(sessionId: string): Promise<Order | null>;
  listOrders(status?: OrderStatus): Promise<Order[]>;
  updateOrder(id: string, patch: OrderPatch): Promise<void>;
  addNote(orderId: string, body: string): Promise<void>;
}

export class ReadOnlyStoreError extends Error {
  constructor() {
    super("Aucune base de données configurée : renseigner les variables Supabase (voir README).");
  }
}
