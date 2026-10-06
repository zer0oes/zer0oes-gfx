import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { AbbyApi, AbbyLine } from "./abby";
import { invoicePayment, type InvoiceDeps } from "./invoicing";
import type { Invoice, Order, Store } from "./store/types";

function memoryStore() {
  const invoices: Invoice[] = [];
  const store = {
    listInvoices: async (orderId?: string) => invoices.filter((i) => !orderId || i.orderId === orderId),
    getInvoiceByKey: async (key: string) => invoices.find((i) => i.paymentKey === key) ?? null,
    saveInvoice: async (inv: Omit<Invoice, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
      const found = invoices.find((i) => (inv.id ? i.id === inv.id : i.paymentKey === inv.paymentKey));
      if (found) return Object.assign(found, inv);
      const created = { ...inv, id: randomUUID(), createdAt: "", updatedAt: "" } as Invoice;
      invoices.push(created);
      return created;
    },
  };
  return { store: store as unknown as Store, invoices };
}

function fakeAbby(opts: { failFinalizeOnce?: boolean } = {}) {
  const calls: string[] = [];
  const created: { id: string; lines: AbbyLine[] }[] = [];
  let failNext = opts.failFinalizeOnce ?? false;
  let n = 0;
  const api: AbbyApi = {
    findOrCreateCustomer: async (c) => (calls.push(`client ${c.email}`), "client-1"),
    createInvoice: async (_c, lines) => {
      const id = `inv-${created.length + 1}`;
      created.push({ id, lines });
      calls.push(`facture ${id}`);
      return { id };
    },
    finalize: async (id) => {
      if (failNext) {
        failNext = false;
        throw new Error("Abby 503 : indisponible");
      }
      calls.push(`finalise ${id}`);
      return { number: `F-${++n}` };
    },
    markPaid: async (id) => void calls.push(`payée ${id}`),
    downloadPdf: async () => new Uint8Array([37, 80, 68, 70]),
  };
  return { api, calls, created };
}

const order: Order = {
  id: "cmd-1",
  createdAt: "2026-10-03T10:00:00.000Z",
  updatedAt: "",
  stripeSessionId: "cs_1",
  demo: false,
  packId: "identite-signature",
  formulaId: "base",
  offerName: "Identité signature",
  paymentType: "acompte",
  hasLogo: true,
  listPrice: 99000,
  totalPrice: 84000,
  amountPaid: 25200,
  depositPercent: 30,
  logoDiscount: 15000,
  customerName: "Lunaire",
  customerEmail: "client@exemple.fr",
  status: "payee",
  notes: [],
};

const deps = (store: Store, api: AbbyApi | null, extra: Partial<InvoiceDeps> = {}): InvoiceDeps => ({
  store,
  api,
  sendToCustomer: false,
  notifyAdmin: async () => {},
  emailCustomer: async () => {},
  ...extra,
});

test("acompte puis solde : deux factures, le solde mentionne l'acompte", async () => {
  const { store, invoices } = memoryStore();
  const abby = fakeAbby();
  const a = await invoicePayment(deps(store, abby.api), order, { key: "pi_acompte", kind: "acompte", amount: 25200, paidAt: "2026-10-03" });
  const s = await invoicePayment(deps(store, abby.api), order, { key: "pi_solde", kind: "solde", amount: 58800, paidAt: "2026-10-20" });
  assert.equal(a.status, "emise");
  assert.equal(s.status, "emise");
  assert.equal(invoices.length, 2);
  assert.match(abby.created[0].lines[0].designation, /^Acompte de 30 %/);
  assert.equal(abby.created[0].lines[0].unitPrice, 25200);
  assert.match(abby.created[1].lines[0].description!, /acompte de 252\s€ déjà facturé \(facture n° F-1\)/);
  assert.equal(abby.created[1].lines[0].unitPrice, 58800);
});

test("paiement complet : une facture finalisée et marquée payée", async () => {
  const { store } = memoryStore();
  const abby = fakeAbby();
  const inv = await invoicePayment(deps(store, abby.api), { ...order, paymentType: "total" }, { key: "pi_total", kind: "complete", amount: 84000, paidAt: "2026-10-03" });
  assert.equal(inv.number, "F-1");
  assert.deepEqual(abby.calls, ["client client@exemple.fr", "facture inv-1", "finalise inv-1", "payée inv-1"]);
});

test("webhook rejoué : aucune facture en double", async () => {
  const { store, invoices } = memoryStore();
  const abby = fakeAbby();
  const p = { key: "pi_x", kind: "complete" as const, amount: 84000, paidAt: "2026-10-03" };
  await invoicePayment(deps(store, abby.api), order, p);
  await invoicePayment(deps(store, abby.api), order, p);
  await invoicePayment(deps(store, abby.api), order, p);
  assert.equal(invoices.length, 1);
  assert.equal(abby.created.length, 1);
});

test("échec Abby : facture en attente, e-mail à Aurore, puis reprise sans doublon", async () => {
  const { store, invoices } = memoryStore();
  const abby = fakeAbby({ failFinalizeOnce: true });
  const mails: string[] = [];
  const d = deps(store, abby.api, { notifyAdmin: async (subject) => void mails.push(subject) });
  const p = { key: "pi_fail", kind: "complete" as const, amount: 84000, paidAt: "2026-10-03" };
  const first = await invoicePayment(d, order, p);
  assert.equal(first.status, "echec");
  assert.match(first.error!, /indisponible/);
  assert.equal(mails.length, 1);
  const retry = await invoicePayment(d, order, p);
  assert.equal(retry.status, "emise");
  assert.equal(abby.created.length, 1); // la facture déjà créée est reprise, pas recréée
  assert.equal(retry.attempts, 2);
  assert.equal(invoices.length, 1);
});

test("mode démo sans clé : facture simulée", async () => {
  const { store } = memoryStore();
  const inv = await invoicePayment(deps(store, null), order, { key: "demo_1", kind: "acompte", amount: 25200, paidAt: "2026-10-03" });
  assert.equal(inv.status, "emise");
  assert.equal(inv.demo, true);
  assert.match(inv.number!, /^DEMO-/);
});

test("envoi au client si l'option est activée", async () => {
  const { store } = memoryStore();
  const abby = fakeAbby();
  const sent: string[] = [];
  const d = deps(store, abby.api, { sendToCustomer: true, emailCustomer: async (to, _s, _t, _pdf, name) => void sent.push(`${to} ${name}`) });
  const inv = await invoicePayment(d, order, { key: "pi_mail", kind: "complete", amount: 84000, paidAt: "2026-10-03" });
  assert.equal(inv.sentToCustomer, true);
  assert.deepEqual(sent, ["client@exemple.fr facture-F-1.pdf"]);
});
