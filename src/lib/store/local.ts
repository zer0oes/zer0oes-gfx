import { reviewedRevisions } from "@/lib/brief-review";
import { hasFinalAccess, readyToClose } from "@/lib/final-downloads";
import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { defaultFinance, type FinanceSettings } from "@/lib/finance";
import type { Catalog } from "@/lib/pricing";
import { defaultProtection, type ProtectionSettings } from "@/lib/protection";
import { MAX_NOTES } from "@/lib/delivery";
import { assertNotProduction } from "@/lib/env";
import type { StoredTexts } from "@/lib/case-study-texts";
import { staticCatalog, staticPortfolio } from "./static";
import type { StatEvent } from "@/lib/stats";
import type { AffiliateLink, Banner, Promotion } from "@/lib/promotions";
import type { Deliverable, Invoice, Order, Portfolio, Store, Testimonial } from "./types";

// Magasin JSON local, pour développer et tester l'admin sans Supabase.
// Fichier .data/dev-store.json (ignoré par git). Interdit en production.
type Data = Catalog & Portfolio & {
  banners?: Banner[];
  affiliateLinks?: AffiliateLink[];
  promotions?: Promotion[];
  orders: Order[];
  invoices?: Invoice[];
  deliverables?: Deliverable[];
  finance?: FinanceSettings;
  protection?: ProtectionSettings;
  caseStudyTexts?: Record<string, StoredTexts>;
  home?: Record<string, string>;
  stats?: StatEvent[];
  testimonials?: Testimonial[];
};

const FILE = path.join(process.cwd(), ".data", "dev-store.json");
const UPLOADS = path.join(process.cwd(), "public", "uploads");
// Fichiers livrés en développement : hors de public/, servis par la route de livraison
const DELIVERABLES = path.join(process.cwd(), ".data", "livrables");

function deliverableFile(rel: string) {
  const file = path.resolve(DELIVERABLES, rel);
  if (!file.startsWith(DELIVERABLES + path.sep)) throw new Error("Chemin de fichier invalide.");
  return file;
}

let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<Data> {
  assertNotProduction("Le magasin JSON local");
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Data;
  } catch {
    return { ...staticCatalog(), ...staticPortfolio(), orders: [] };
  }
}

async function save(data: Data) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
}

// Écritures en série pour éviter les pertes entre requêtes simultanées.
function mutate<T>(fn: (data: Data) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

function upsertAt<T extends { id: string }>(list: T[], item: T, position?: number) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list.splice(i, 1);
  const at = position ?? (i >= 0 ? i : list.length);
  list.splice(Math.max(0, Math.min(at, list.length)), 0, item);
}

export const localStore: Store = {
  listAffiliateLinks: async () => (await load()).affiliateLinks ?? [],
  saveAffiliateLink: (link) => mutate((d) => upsertAt(d.affiliateLinks ??= [], link)),
  deleteAffiliateLink: (id) => mutate((d) => void (d.affiliateLinks = (d.affiliateLinks ?? []).filter((l) => l.id !== id))),
  listBanners: async () => (await load()).banners ?? [],
  saveBanner: (b) => mutate((d) => upsertAt(d.banners ??= [], b)),
  deleteBanner: (id) => mutate((d) => void (d.banners = (d.banners ?? []).filter((b) => b.id !== id))),
  listPromotions: async () => (await load()).promotions ?? [],
  savePromotion: (p) => mutate((d) => {
    if ((d.promotions ?? []).some((x) => x.id !== p.id && x.code === p.code)) throw new Error("Ce code existe déjà.");
    upsertAt(d.promotions ??= [], p);
  }),
  deletePromotion: (id) => mutate((d) => void (d.promotions = (d.promotions ?? []).filter((p) => p.id !== id))),
  kind: "local",
  getCatalog: async () => {
    const d = await load();
    return { settings: d.settings, packs: d.packs, options: d.options };
  },
  getPortfolio: async () => {
    const d = await load();
    return { streamers: d.streamers, works: d.works };
  },
  saveSettings: (settings) => mutate((d) => void (d.settings = settings)),
  savePack: (pack) => mutate((d) => upsertAt(d.packs, pack)),
  deletePack: (id) => mutate((d) => void (d.packs = d.packs.filter((p) => p.id !== id))),
  reorderPacks: (ids) =>
    mutate((d) => {
      const rank = (id: string) => (ids.includes(id) ? ids.indexOf(id) : ids.length);
      d.packs.sort((a, b) => rank(a.id) - rank(b.id));
    }),
  getFinance: async () => ({ ...defaultFinance, ...(await load()).finance }),
  saveFinance: (finance) => mutate((d) => void (d.finance = finance)),
  getProtection: async () => ({ ...defaultProtection, ...(await load()).protection }),
  saveProtection: (protection) => mutate((d) => void (d.protection = protection)),
  saveOptions: (options) => mutate((d) => void (d.options = options)),
  saveStreamer: (s, position) => mutate((d) => upsertAt(d.streamers, s, position)),
  deleteStreamer: (id) =>
    mutate((d) => {
      d.streamers = d.streamers.filter((s) => s.id !== id);
      d.works = d.works.filter((w) => w.streamer !== id);
    }),
  saveWork: (w, position) => mutate((d) => upsertAt(d.works, w, position)),
  deleteWork: (id) => mutate((d) => void (d.works = d.works.filter((w) => w.id !== id))),
  reorderStreamers: (ids) =>
    mutate((d) => {
      const rank = (id: string) => (ids.includes(id) ? ids.indexOf(id) : ids.length);
      d.streamers = [...d.streamers].sort((a, b) => rank(a.id) - rank(b.id));
    }),
  getCaseStudyTexts: async (id) => (await load()).caseStudyTexts?.[id] ?? null,
  saveCaseStudyTexts: (id, texts) =>
    mutate((d) => {
      d.caseStudyTexts = { ...d.caseStudyTexts };
      if (texts) d.caseStudyTexts[id] = texts;
      else delete d.caseStudyTexts[id];
    }),
  getHomeContent: async () => (await load()).home ?? null,
  saveHomeContent: (content) => mutate((d) => void (d.home = content ?? undefined)),
  reorderWorks: (ids) =>
    mutate((d) => {
      const rank = (id: string) => (ids.includes(id) ? ids.indexOf(id) : ids.length);
      // Tri stable : seules les réalisations listées changent de place entre elles.
      const listed = d.works.filter((w) => ids.includes(w.id)).sort((a, b) => rank(a.id) - rank(b.id));
      let k = 0;
      d.works = d.works.map((w) => (ids.includes(w.id) ? listed[k++] : w));
    }),
  uploadAsset: async (rel, data) => {
    assertNotProduction("Le magasin JSON local");
    const safe = rel.replace(/[^a-z0-9/._-]/gi, "-").replace(/\.\.+/g, ".");
    const file = path.join(UPLOADS, safe);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
    return `/uploads/${safe}`;
  },
  recordPaidOrder: (o) =>
    mutate((d) => {
      const existing = d.orders.find((x) => x.stripeSessionId === o.stripeSessionId);
      if (existing) return existing;
      const now = new Date().toISOString();
      const order: Order = { ...o, id: randomUUID(), createdAt: now, updatedAt: now, status: "payee", notes: [] };
      d.orders.unshift(order);
      return order;
    }),
  getOrder: async (id) => (await load()).orders.find((o) => o.id === id) ?? null,
  getOrderBySession: async (sid) => (await load()).orders.find((o) => o.stripeSessionId === sid) ?? null,
  listOrders: async (status) => (await load()).orders.filter((o) => !status || o.status === status),
  updateOrder: (id, patch) =>
    mutate((d) => {
      const o = d.orders.find((x) => x.id === id);
      if (o) Object.assign(o, patch, { completedAt: o.completedAt ?? patch.completedAt ?? undefined }, { updatedAt: new Date().toISOString() });
      if (o && readyToClose(o, (d.deliverables ?? []).filter((item) => item.orderId === id))) {
        o.status = "terminee";
        o.completedAt ??= new Date().toISOString();
      }
    }),
  reviewBriefRevision: (expected, at, state) => mutate((data) => {
    const order = data.orders?.find((item) => item.id === expected.id);
    if (!order || order.updatedAt !== expected.updatedAt) return false;
    const now = new Date().toISOString();
    order.briefRevisions = reviewedRevisions(order.briefRevisions ?? [], at, state, now);
    order.updatedAt = now;
    return true;
  }),
  saveBriefRevision: (expected, brief, revision) => mutate((data) => {
    const order = data.orders.find((o) => o.id === expected.id);
    if (!order || order.updatedAt !== expected.updatedAt || (order.briefRevisions?.length ?? 0) >= 2) return false;
    order.brief = brief;
    order.briefRevisions = [...(order.briefRevisions ?? []), revision];
    order.updatedAt = revision.at;
    return true;
  }),
  listDeliverables: async (orderId) => ((await load()).deliverables ?? []).filter((d) => d.orderId === orderId),
  addDeliverable: (item) =>
    mutate((d) => {
      d.deliverables ??= [];
      const existing = item.plannedKey && d.deliverables.find((entry) => entry.orderId === item.orderId && entry.plannedKey === item.plannedKey);
      if (existing) return existing;
      const created: Deliverable = { ...item, id: randomUUID(), createdAt: new Date().toISOString() };
      d.deliverables.push(created);
      return created;
    }),
  deleteDeliverable: (id) =>
    mutate(async (d) => {
      const item = d.deliverables?.find((x) => x.id === id);
      d.deliverables = (d.deliverables ?? []).filter((x) => x.id !== id);
      if (item?.storagePath) await fs.rm(deliverableFile(item.storagePath), { force: true });
      if (item?.previewPath) await fs.rm(deliverableFile(item.previewPath), { force: true });
      for (const v of item?.previewVersions ?? []) await fs.rm(deliverableFile(v.path), { force: true });
      for (const asset of item?.finalAssets ?? []) if (asset.path) await fs.rm(deliverableFile(asset.path), { force: true });
    }),
  getOrderByDeliveryToken: async (token) => (await load()).orders.find((o) => o.deliveryToken === token) ?? null,
  addDeliverableNote: (id, body) =>
    mutate((d) => {
      const item = d.deliverables?.find((x) => x.id === id);
      if (item) item.clientNotes = [...(item.clientNotes ?? []), { at: new Date().toISOString(), body }].slice(-MAX_NOTES);
    }),
  updateDeliverable: (id, patch) =>
    mutate(async (d) => {
      const item = d.deliverables?.find((x) => x.id === id);
      if (!item) return;
      for (const [k, v] of Object.entries(patch)) (item as Record<string, unknown>)[k] = v ?? undefined;
    }),
  setDeliverableApproval: (id, approved) =>
    mutate((d) => {
      const item = d.deliverables?.find((x) => x.id === id);
      if (item && hasFinalAccess(item) && !approved) throw new Error("Validation verrouillée après téléchargement.");
      if (item) item.approvedAt = approved ? new Date().toISOString() : undefined;
    }),
  beginFinalAccess: async (id, assetKeys = []) => {
    let allowed = false;
    await mutate((d) => {
      const item = d.deliverables?.find((x) => x.id === id);
      if (!item?.approvedAt) return;
      item.finalAccessedAt ??= new Date().toISOString();
      item.accessedFinalAssets = [...new Set([...(item.accessedFinalAssets ?? []), ...assetKeys])];
      const order = d.orders.find((o) => o.id === item.orderId);
      if (order && readyToClose(order, (d.deliverables ?? []).filter((x) => x.orderId === order.id))) {
        order.status = "terminee";
        order.completedAt ??= new Date().toISOString();
      }
      allowed = true;
    });
    return allowed;
  },
  saveDeliverableFile: async (rel, data) => {
    assertNotProduction("Le magasin JSON local");
    const file = deliverableFile(rel);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, data);
  },
  readDeliverableFile: async (rel) => {
    assertNotProduction("Le magasin JSON local");
    return new Uint8Array(await fs.readFile(deliverableFile(rel)));
  },
  listInvoices: async (orderId) => ((await load()).invoices ?? []).filter((i) => !orderId || i.orderId === orderId),
  getInvoiceByKey: async (key) => ((await load()).invoices ?? []).find((i) => i.paymentKey === key) ?? null,
  saveInvoice: (inv) =>
    mutate((d) => {
      d.invoices ??= [];
      const now = new Date().toISOString();
      const existing = d.invoices.find((i) => (inv.id ? i.id === inv.id : i.paymentKey === inv.paymentKey));
      if (existing) {
        Object.assign(existing, inv, { updatedAt: now });
        return existing;
      }
      const created: Invoice = { ...inv, id: randomUUID(), createdAt: now, updatedAt: now };
      d.invoices.push(created);
      return created;
    }),
  addNote: (orderId, body) =>
    mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId);
      if (o) o.notes.push({ id: randomUUID(), createdAt: new Date().toISOString(), body });
    }),
  listTestimonials: async () => (await load()).testimonials ?? [],
  saveTestimonial: (t) =>
    mutate((d) => {
      d.testimonials = [...(d.testimonials ?? []).filter((x) => x.streamerId !== t.streamerId), { ...t, updatedAt: new Date().toISOString() }];
    }),
  deleteTestimonial: (id) =>
    mutate((d) => {
      d.testimonials = (d.testimonials ?? []).filter((x) => x.streamerId !== id);
    }),
  addStatEvent: (event) =>
    mutate((d) => {
      (d.stats ??= []).push({ ...event, createdAt: new Date().toISOString() });
    }),
  listStatEvents: async (from, to) => ((await load()).stats ?? []).filter((e) => e.createdAt >= from && e.createdAt < to),
  purgeStatEvents: (before) =>
    mutate((d) => {
      d.stats = (d.stats ?? []).filter((e) => e.createdAt >= before);
    }),
};
