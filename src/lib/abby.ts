// Client minimal de l'API Abby (https://docs.abby.fr/api) : uniquement les
// appels documentés utiles à la facturation automatique.
// Clé : ABBY_API_KEY (Bearer), jamais exposée au navigateur ni journalisée.

export type AbbyLine = { designation: string; description?: string; unitPrice: number };

export type AbbyCustomerInput = {
  email: string;
  name?: string; // nom complet du client
  companyName?: string;
  siret?: string;
  vatNumber?: string;
  address?: { line1?: string; line2?: string; postalCode?: string; city?: string; country?: string };
};

export interface AbbyApi {
  findOrCreateCustomer(c: AbbyCustomerInput): Promise<string>;
  createInvoice(customerId: string, lines: AbbyLine[]): Promise<{ id: string }>;
  finalize(invoiceId: string): Promise<{ number?: string }>;
  markPaid(invoiceId: string, p: { amount: number; receivedAt: string; transactionId?: string }): Promise<void>;
  downloadPdf(invoiceId: string): Promise<Uint8Array>;
}

const BASE = "https://api.abby.fr";

export class AbbyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(`Abby ${status} : ${message}`);
  }
}

export function abbyConfigured() {
  return Boolean(process.env.ABBY_API_KEY);
}

export function createAbbyApi(key = process.env.ABBY_API_KEY!, fetcher: typeof fetch = fetch): AbbyApi {
  async function call<T>(method: string, path: string, body?: unknown, raw = false): Promise<T> {
    const res = await fetcher(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      let msg = res.statusText;
      try {
        const j = (await res.json()) as { message?: string | string[] };
        msg = Array.isArray(j.message) ? j.message.join(", ") : (j.message ?? msg);
      } catch {}
      throw new AbbyError(res.status, msg);
    }
    if (raw) return new Uint8Array(await res.arrayBuffer()) as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  type Page<T> = { docs: T[] };
  type Contact = { id: string; emails?: string[] };
  type Organization = { id: string; name?: string; siret?: string };

  const address = (a?: AbbyCustomerInput["address"]) =>
    a?.line1 && a.city && a.postalCode
      ? { address: [a.line1, a.line2].filter(Boolean).join(", "), city: a.city, zipCode: a.postalCode, country: a.country || "FR" }
      : undefined;

  return {
    async findOrCreateCustomer(c) {
      const email = c.email.trim().toLowerCase();
      if (c.companyName) {
        // Client professionnel : entreprise (recherchée par nom ou SIRET)
        const found = await call<Page<Organization>>("GET", `/organizations?page=1&limit=20&search=${encodeURIComponent(c.siret || c.companyName)}`);
        const org = found.docs.find(
          (o) => (c.siret && o.siret?.replace(/\s/g, "") === c.siret.replace(/\s/g, "")) || o.name?.toLowerCase() === c.companyName!.toLowerCase(),
        );
        if (org) return org.id;
        const created = await call<Organization>("POST", "/organization", {
          name: c.companyName,
          emails: [email],
          siret: c.siret || undefined,
          vatNumber: c.vatNumber || undefined,
          billingAddress: address(c.address),
        });
        return created.id;
      }
      // Particulier : contact, recherché par e-mail
      const found = await call<Page<Contact>>("GET", `/contacts?page=1&limit=20&search=${encodeURIComponent(email)}`);
      const contact = found.docs.find((d) => d.emails?.some((e) => e.toLowerCase() === email));
      if (contact) return contact.id;
      const [firstname, ...rest] = (c.name || email.split("@")[0]).trim().split(/\s+/);
      const created = await call<Contact>("POST", "/contact", {
        firstname,
        lastname: rest.join(" ") || firstname,
        emails: [email],
        billingAddress: address(c.address),
      });
      return created.id;
    },

    async createInvoice(customerId, lines) {
      const invoice = await call<{ id: string }>("POST", `/v2/billing/invoice/${customerId}`);
      await call("PATCH", `/v2/billing/${invoice.id}/lines`, {
        lines: lines.map((l) => ({
          designation: l.designation,
          description: l.description,
          unitPrice: l.unitPrice,
          quantity: 1,
          quantityUnit: "unit",
          type: "service_delivery",
          // Franchise en base de TVA par défaut ; réglable via ABBY_VAT_CODE
          vatCode: process.env.ABBY_VAT_CODE || "FR_00HT",
        })),
      });
      return { id: invoice.id };
    },

    async finalize(invoiceId) {
      const r = await call<{ number?: string }>("PATCH", `/v2/billing/${invoiceId}/finalize`);
      return { number: r?.number ?? undefined };
    },

    async markPaid(invoiceId, p) {
      await call("POST", `/v2/accounting-billing/invoice/${invoiceId}/reconciliate`, {
        payments: [{ amount: p.amount, receivedAt: p.receivedAt, method: "stripe", transactionId: p.transactionId }],
      });
    },

    downloadPdf(invoiceId) {
      return call<Uint8Array>("GET", `/v2/billing/${invoiceId}/download`, undefined, true);
    },
  };
}
