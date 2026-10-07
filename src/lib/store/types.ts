import type { Streamer, Work } from "@/data/portfolio";
import type { StoredTexts } from "@/lib/case-study-texts";
import type { FinanceSettings } from "@/lib/finance";
import type { Catalog, Option, Pack, PaymentType, PricingSettings } from "@/lib/pricing";
import type { ProtectionSettings } from "@/lib/protection";
import type { NewStatEvent, StatEvent } from "@/lib/stats";
import type { AffiliateLink, Banner, Promotion } from "@/lib/promotions";

export type Portfolio = { streamers: Streamer[]; works: Work[] };

// Avis client d'un projet (facultatif), publié seulement avec l'accord du client
export type Testimonial = {
  updatedAt?: string;
  streamerId: string;
  author: string;
  role?: string;
  quote: string;
  quoteEn?: string;
  consent: boolean;
  onHome: boolean;
};

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

// Remboursement Stripe (montant en centimes, date du remboursement).
export type Refund = { id: string; amount: number; at: string; paymentIntentId?: string };

export type BillingAddress = { line1?: string; line2?: string; postalCode?: string; city?: string; country?: string };

// Facture Abby liée à un paiement (une seule par payment_intent).
export type InvoiceKind = "acompte" | "solde" | "complete";
export type Invoice = {
  id: string;
  orderId: string;
  paymentKey: string;
  kind: InvoiceKind;
  amount: number;
  paidAt: string;
  status: "en_attente" | "emise" | "echec";
  abbyCustomerId?: string;
  abbyInvoiceId?: string;
  number?: string;
  finalized: boolean;
  paidMarked: boolean;
  sentToCustomer: boolean;
  demo: boolean;
  error?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

// Élément livré au client : lien d'import (overlay StreamElements partagé…) ou fichier
// du stockage privé « livrables ».
export type Deliverable = {
  publishedAt?: string;
  notifiedPreview?: string;
  previewVersions?: { path: string; publishedAt: string }[];
  plannedKey?: string;
  finalAssets?: { path?: string; url?: string; label: string }[];
  id: string;
  orderId: string;
  kind: "lien" | "fichier";
  label: string;
  url?: string;
  storagePath?: string;
  sizeBytes?: number;
  createdAt: string;
  // Retours du client sur sa page de livraison
  clientNotes?: DeliverableNote[];
  approvedAt?: string;
  finalAccessedAt?: string;
  accessedFinalAssets?: string[];
  // Badge (overlay, fichier, vidéo…) et aperçu protégé montré avant validation
  itemType?: string;
  previewPath?: string;
  previewType?: "image" | "video";
};

export type DeliverablePatch = { previewVersions?: Deliverable["previewVersions"]; notifiedPreview?: string; publishedAt?: string | null; label?: string; itemType?: string | null; previewPath?: string | null; previewType?: "image" | "video" | null; finalAssets?: Deliverable["finalAssets"]; };

export type DeliverableNote = { at: string; body: string };

export type Order = {
  briefLogoPreview?: string;
  deliveryTemplate?: string[];
  briefRevisions?: { at: string; changes: Record<string, { before: string; after: string }>; consultedAt?: string; acknowledgedAt?: string }[];
  testimonial?: ClientTestimonial;
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
  promoCode?: string;
  promoDiscount?: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  balanceSessionId?: string;
  balanceUrl?: string;
  balancePaidAt?: string;
  // Frais Stripe réels (centimes), si connus
  feesPaid?: number;
  // Facturation (collectée par Stripe Checkout)
  paymentIntentId?: string;
  balancePaymentIntentId?: string;
  billingName?: string;
  billingAddress?: BillingAddress;
  companyName?: string;
  companySiret?: string;
  companyVat?: string;
  brief?: Record<string, string>;
  briefReceivedAt?: string;
  notes: OrderNote[];
  refunds?: Refund[];
  // Lien privé de l'espace commande (/commande/<jeton>) et date d'envoi de la livraison
  deliveryToken?: string;
  deliveredAt?: string;
  // Clôture du projet (statut « Terminée ») : point de départ de la conservation des fichiers
  completedAt?: string;
};

export type ClientTestimonial = {
  author: string;
  quote: string;
  consent: boolean;
  submittedAt: string;
  consentAt?: string;
};

export type NewOrder = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "status" | "notes" | "refunds" | "balanceSessionId" | "balanceUrl" | "balancePaidAt" | "brief" | "briefReceivedAt" | "feesPaid"
> & {
  feesPaid?: number;
  paymentIntentId?: string;
  billingName?: string;
  billingAddress?: BillingAddress;
  companyName?: string;
  companySiret?: string;
  companyVat?: string;
};

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
    | "deliveryTemplate"
    | "briefLogoPreview"
    | "customerEmail"
    | "customerName"
    | "feesPaid"
    | "balancePaymentIntentId"
    | "refunds"
    | "deliveryToken"
    | "deliveredAt"
    | "testimonial"
  >
> & { completedAt?: string | null };

export function balanceDue(o: Pick<Order, "totalPrice" | "amountPaid">) {
  return Math.max(0, o.totalPrice - o.amountPaid);
}

export interface Store {
  listBanners(): Promise<Banner[]>;
  listAffiliateLinks(): Promise<AffiliateLink[]>;
  saveAffiliateLink(link: AffiliateLink): Promise<void>;
  deleteAffiliateLink(id: string): Promise<void>;
  saveBanner(banner: Banner): Promise<void>;
  deleteBanner(id: string): Promise<void>;
  listPromotions(): Promise<Promotion[]>;
  savePromotion(promotion: Promotion): Promise<void>;
  deletePromotion(id: string): Promise<void>;
  kind: "supabase" | "local" | "static";
  // Lecture publique
  getCatalog(): Promise<Catalog>;
  getPortfolio(): Promise<Portfolio>;
  // Admin : offres et réglages
  saveSettings(settings: PricingSettings): Promise<void>;
  savePack(pack: Pack): Promise<void>;
  deletePack(id: string): Promise<void>;
  reorderPacks(orderedIds: string[]): Promise<void>;
  getFinance(): Promise<FinanceSettings>;
  getProtection(): Promise<ProtectionSettings>;
  saveProtection(protection: ProtectionSettings): Promise<void>;
  saveFinance(finance: FinanceSettings): Promise<void>;
  saveOptions(options: Option[]): Promise<void>;
  // Admin : portfolio
  saveStreamer(streamer: Streamer, position?: number): Promise<void>;
  deleteStreamer(id: string): Promise<void>;
  saveWork(work: Work, position?: number): Promise<void>;
  deleteWork(id: string): Promise<void>;
  reorderWorks(orderedIds: string[]): Promise<void>;
  reorderStreamers(orderedIds: string[]): Promise<void>;
  // Textes des pages projet saisis dans l'admin (null : textes d'origine)
  getCaseStudyTexts(streamerId: string): Promise<unknown>;
  saveCaseStudyTexts(streamerId: string, texts: StoredTexts | null): Promise<void>;
  // Page d'accueil saisie dans l'admin (null : contenu d'origine)
  getHomeContent(): Promise<unknown>;
  saveHomeContent(content: Record<string, string> | null): Promise<void>;
  // Upload signé (Supabase) : le navigateur envoie le fichier directement au stockage.
  createSignedUpload?(path: string): Promise<{ token: string; publicUrl: string }>;
  downloadAsset?(path: string): Promise<Uint8Array>;
  uploadAsset(path: string, data: Uint8Array, contentType: string): Promise<string>;
  // Commandes
  recordPaidOrder(order: NewOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | null>;
  getOrderBySession(sessionId: string): Promise<Order | null>;
  listOrders(status?: OrderStatus): Promise<Order[]>;
  updateOrder(id: string, patch: OrderPatch): Promise<void>;
  saveBriefRevision(order: Order, brief: Record<string, string>, revision: NonNullable<Order["briefRevisions"]>[number]): Promise<boolean>;
  reviewBriefRevision(order: Order, at: string, state: "consulted" | "acknowledged"): Promise<boolean>;
  addNote(orderId: string, body: string): Promise<void>;
  // Livraison
  listDeliverables(orderId: string): Promise<Deliverable[]>;
  addDeliverable(d: Omit<Deliverable, "id" | "createdAt" | "clientNotes" | "approvedAt" | "previewPath" | "previewType">): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<void>;
  addDeliverableNote(id: string, body: string): Promise<void>;
  updateDeliverable(id: string, patch: DeliverablePatch): Promise<void>;
  setDeliverableApproval(id: string, approved: boolean): Promise<void>;
  beginFinalAccess(id: string, assetKeys?: string[]): Promise<boolean>;
  getOrderByDeliveryToken(token: string): Promise<Order | null>;
  // Fichiers livrés : envoi direct du navigateur vers le stockage privé (Supabase),
  // lien de téléchargement temporaire, ou lecture directe (magasin local de développement).
  createDeliverableUpload?(path: string): Promise<{ token: string }>;
  // filename : téléchargement (pièce jointe) ; sans : lecture dans la page (aperçu vidéo)
  deliverableDownloadUrl?(path: string, filename?: string): Promise<string>;
  saveDeliverableFile?(path: string, data: Uint8Array): Promise<void>;
  readDeliverableFile?(path: string): Promise<Uint8Array>;
  // Factures
  listInvoices(orderId?: string): Promise<Invoice[]>;
  getInvoiceByKey(paymentKey: string): Promise<Invoice | null>;
  saveInvoice(invoice: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<Invoice>;
  // Statistiques de visite (sans cookie ni adresse IP), du plus ancien au plus récent
  // Avis clients (un par projet)
  listTestimonials(): Promise<Testimonial[]>;
  saveTestimonial(t: Testimonial): Promise<void>;
  deleteTestimonial(streamerId: string): Promise<void>;
  addStatEvent(event: NewStatEvent): Promise<void>;
  listStatEvents(from: string, to: string): Promise<StatEvent[]>;
  purgeStatEvents(before: string): Promise<void>;
}

export class ReadOnlyStoreError extends Error {
  constructor() {
    super("Aucune base de données configurée : renseigner les variables Supabase (voir README).");
  }
}
