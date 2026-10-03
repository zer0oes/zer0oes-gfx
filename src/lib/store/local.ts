import "server-only";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Catalog } from "@/lib/pricing";
import { assertNotProduction } from "@/lib/env";
import { staticCatalog, staticPortfolio } from "./static";
import type { Order, Portfolio, Store } from "./types";

// Magasin JSON local, pour développer et tester l'admin sans Supabase.
// Fichier .data/dev-store.json (ignoré par git). Interdit en production.
type Data = Catalog & Portfolio & { orders: Order[] };

const FILE = path.join(process.cwd(), ".data", "dev-store.json");
const UPLOADS = path.join(process.cwd(), "public", "uploads");

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
  saveOptions: (options) => mutate((d) => void (d.options = options)),
  saveStreamer: (s, position) => mutate((d) => upsertAt(d.streamers, s, position)),
  deleteStreamer: (id) =>
    mutate((d) => {
      d.streamers = d.streamers.filter((s) => s.id !== id);
      d.works = d.works.filter((w) => w.streamer !== id);
    }),
  saveWork: (w, position) => mutate((d) => upsertAt(d.works, w, position)),
  deleteWork: (id) => mutate((d) => void (d.works = d.works.filter((w) => w.id !== id))),
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
      if (o) Object.assign(o, patch, { updatedAt: new Date().toISOString() });
    }),
  addNote: (orderId, body) =>
    mutate((d) => {
      const o = d.orders.find((x) => x.id === orderId);
      if (o) o.notes.push({ id: randomUUID(), createdAt: new Date().toISOString(), body });
    }),
};
