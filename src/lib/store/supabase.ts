import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Emote, Streamer, Work } from "@/data/portfolio";
import { supabaseSecretKey, supabaseUrl } from "@/lib/env";
import { defaultFinance, type FinanceSettings } from "@/lib/finance";
import { defaultProtection, isWatermarkLevel, type ProtectionSettings } from "@/lib/protection";
import type { Option, Pack } from "@/lib/pricing";
import type { NewOrder, Order, OrderPatch, OrderStatus, Store } from "./types";

// Client avec la clé secrète : contourne la RLS, donc réservé au serveur
// (pages publiques en lecture, et actions admin après contrôle de l'accès).
let client: SupabaseClient | null = null;
function db() {
  client ??= createClient(supabaseUrl()!, supabaseSecretKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase : ${error.message}`);
  return data;
}

type Row = Record<string, unknown>;
const opt = <T>(v: unknown) => (v === null || v === undefined ? undefined : (v as T));

function toPack(r: Row, formulas: Row[]): Pack {
  return {
    id: r.id as string,
    name: r.name as string,
    tagline: r.tagline as string,
    price: r.price as number,
    priceFrom: (r.price_from as boolean) || undefined,
    checkout: r.checkout as boolean,
    deliverables: r.deliverables as string[],
    extras: (r.extras as string[]).length ? (r.extras as string[]) : undefined,
    note: opt<string>(r.note),
    highlight: (r.highlight as boolean) || undefined,
    archived: (r.archived as boolean) || undefined,
    formulas: formulas.length
      ? formulas.map((f) => ({
          id: f.id as string,
          label: f.label as string,
          price: f.price as number,
          stripePriceId: opt<string>(f.stripe_price_id),
        }))
      : undefined,
  };
}

function toWork(r: Row, emotes: Row[]): Work {
  return {
    id: r.id as string,
    streamer: r.streamer_id as string,
    category: r.category as Work["category"],
    title: r.title as string,
    description: r.description as string,
    image: opt<string>(r.image),
    video: opt<string>(r.video),
    colors: (r.colors as string[]).slice(0, 2) as [string, string],
    featured: (r.featured as boolean) || undefined,
    emotes: emotes.length
      ? emotes.map((e) => ({
          name: e.name as string,
          group: e.grp as Emote["group"],
          src: e.src as string,
          animated: (e.animated as boolean) || undefined,
        }))
      : undefined,
  };
}

function toOrder(r: Row, notes: Row[]): Order {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    stripeSessionId: r.stripe_session_id as string,
    demo: r.demo as boolean,
    packId: r.pack_id as string,
    formulaId: r.formula_id as string,
    offerName: r.offer_name as string,
    paymentType: r.payment_type as Order["paymentType"],
    hasLogo: r.has_logo as boolean,
    listPrice: r.list_price as number,
    totalPrice: r.total_price as number,
    amountPaid: r.amount_paid as number,
    depositPercent: r.deposit_percent as number,
    logoDiscount: r.logo_discount as number,
    customerName: r.customer_name as string,
    customerEmail: r.customer_email as string,
    status: r.status as OrderStatus,
    balanceSessionId: opt<string>(r.balance_session_id),
    balanceUrl: opt<string>(r.balance_url),
    balancePaidAt: opt<string>(r.balance_paid_at),
    feesPaid: opt<number>(r.fees_paid),
    brief: opt<Record<string, string>>(r.brief),
    briefReceivedAt: opt<string>(r.brief_received_at),
    notes: notes
      .filter((n) => n.order_id === r.id)
      .map((n) => ({ id: n.id as string, createdAt: n.created_at as string, body: n.body as string })),
  };
}

const orderColumns: Record<keyof OrderPatch, string> = {
  status: "status",
  amountPaid: "amount_paid",
  balanceSessionId: "balance_session_id",
  balanceUrl: "balance_url",
  balancePaidAt: "balance_paid_at",
  brief: "brief",
  briefReceivedAt: "brief_received_at",
  customerEmail: "customer_email",
  customerName: "customer_name",
  feesPaid: "fees_paid",
};

const selectOrders = () => db().from("orders").select("*");
type OrdersQuery = ReturnType<typeof selectOrders>;

async function fetchOrders(filter: (q: OrdersQuery) => OrdersQuery) {
  const rows = check(await filter(selectOrders())) as Row[];
  if (!rows.length) return [];
  const notes = check(
    await db()
      .from("order_notes")
      .select("*")
      .in("order_id", rows.map((r) => r.id))
      .order("created_at"),
  ) as Row[];
  return rows.map((r) => toOrder(r, notes));
}

export const supabaseStore: Store = {
  kind: "supabase",

  async getCatalog() {
    const [settings, packs, formulas, options] = await Promise.all([
      db().from("settings").select("*").eq("id", 1).maybeSingle(),
      db().from("packs").select("*").order("position"),
      db().from("formulas").select("*").order("position"),
      db().from("options").select("*").order("position"),
    ]);
    const s = check(settings) as Row | null;
    return {
      settings: {
        depositPercent: (s?.deposit_percent as number) ?? 30,
        logoDiscount: (s?.logo_discount as number) ?? 0,
        deliveryDays: (s?.delivery_days as string) ?? "7 à 14",
      },
      packs: (check(packs) as Row[]).map((p) =>
        toPack(p, (check(formulas) as Row[]).filter((f) => f.pack_id === p.id)),
      ),
      options: (check(options) as Row[]).map(
        (o): Option => ({
          id: o.id as string,
          name: o.name as string,
          price: o.price as number,
          priceFrom: (o.price_from as boolean) || undefined,
          unit: opt<string>(o.unit),
        }),
      ),
    };
  },

  async getPortfolio() {
    const [streamers, works, emotes] = await Promise.all([
      db().from("streamers").select("*").order("position"),
      db().from("works").select("*").order("position"),
      db().from("emotes").select("*").order("position"),
    ]);
    return {
      streamers: (check(streamers) as Row[]).map(
        (s): Streamer => ({
          id: s.id as string,
          name: s.name as string,
          description: s.description as string,
          url: opt<string>(s.url),
        }),
      ),
      works: (check(works) as Row[]).map((w) =>
        toWork(w, (check(emotes) as Row[]).filter((e) => e.work_id === w.id)),
      ),
    };
  },

  async saveSettings(s) {
    check(
      await db().from("settings").upsert({
        id: 1,
        deposit_percent: s.depositPercent,
        logo_discount: s.logoDiscount,
        delivery_days: s.deliveryDays,
        updated_at: new Date().toISOString(),
      }),
    );
  },

  async savePack(p) {
    const existing = check(await db().from("packs").select("position").eq("id", p.id).maybeSingle()) as Row | null;
    const last = check(await db().from("packs").select("position").order("position", { ascending: false }).limit(1)) as Row[];
    check(
      await db()
        .from("packs")
        .upsert({
          id: p.id,
          position: existing?.position ?? ((last[0]?.position as number) ?? -1) + 1,
          name: p.name,
          tagline: p.tagline,
          price: p.price,
          price_from: Boolean(p.priceFrom),
          checkout: p.checkout,
          deliverables: p.deliverables,
          extras: p.extras ?? [],
          note: p.note ?? null,
          highlight: Boolean(p.highlight),
          archived: Boolean(p.archived),
          updated_at: new Date().toISOString(),
        }),
    );
    check(await db().from("formulas").delete().eq("pack_id", p.id));
    if (p.formulas?.length) {
      check(
        await db()
          .from("formulas")
          .insert(
            p.formulas.map((f, i) => ({
              pack_id: p.id,
              id: f.id,
              position: i,
              label: f.label,
              price: f.price,
              stripe_price_id: f.stripePriceId ?? null,
            })),
          ),
      );
    }
  },

  async deletePack(id) {
    check(await db().from("packs").delete().eq("id", id));
  },

  async reorderPacks(ids) {
    await Promise.all(ids.map(async (id, position) => check(await db().from("packs").update({ position }).eq("id", id))));
  },

  async getFinance() {
    const r = check(await db().from("finance_settings").select("*").eq("id", 1).maybeSingle()) as Row | null;
    if (!r) return { ...defaultFinance };
    return {
      urssafRate: Number(r.urssaf_rate),
      cfpRate: Number(r.cfp_rate),
      vlEnabled: r.vl_enabled as boolean,
      vlRate: Number(r.vl_rate),
      stripePercent: Number(r.stripe_percent),
      stripeFixed: r.stripe_fixed as number,
    };
  },

  async getProtection() {
    const r = check(await db().from("settings").select("protect_blur, watermark").eq("id", 1).maybeSingle()) as Row | null;
    if (!r) return { ...defaultProtection };
    return { blur: r.protect_blur as boolean, watermark: isWatermarkLevel(r.watermark) ? r.watermark : "discret" };
  },

  async saveProtection(p: ProtectionSettings) {
    check(await db().from("settings").update({ protect_blur: p.blur, watermark: p.watermark, updated_at: new Date().toISOString() }).eq("id", 1));
  },

  async saveFinance(f: FinanceSettings) {
    check(
      await db().from("finance_settings").upsert({
        id: 1,
        urssaf_rate: f.urssafRate,
        cfp_rate: f.cfpRate,
        vl_enabled: f.vlEnabled,
        vl_rate: f.vlRate,
        stripe_percent: f.stripePercent,
        stripe_fixed: f.stripeFixed,
        updated_at: new Date().toISOString(),
      }),
    );
  },

  async saveOptions(options) {
    check(await db().from("options").delete().neq("id", ""));
    if (options.length) {
      check(
        await db()
          .from("options")
          .insert(
            options.map((o, i) => ({
              id: o.id,
              position: i,
              name: o.name,
              price: o.price,
              price_from: Boolean(o.priceFrom),
              unit: o.unit ?? null,
            })),
          ),
      );
    }
  },

  async saveStreamer(s, position) {
    const existing = check(await db().from("streamers").select("position").eq("id", s.id).maybeSingle()) as Row | null;
    check(
      await db()
        .from("streamers")
        .upsert({
          id: s.id,
          position: position ?? existing?.position ?? 100,
          name: s.name,
          description: s.description,
          url: s.url ?? null,
        }),
    );
  },

  async deleteStreamer(id) {
    check(await db().from("streamers").delete().eq("id", id));
  },

  async saveWork(w, position) {
    const existing = check(await db().from("works").select("position").eq("id", w.id).maybeSingle()) as Row | null;
    check(
      await db()
        .from("works")
        .upsert({
          id: w.id,
          streamer_id: w.streamer,
          category: w.category,
          position: position ?? existing?.position ?? 100,
          title: w.title,
          description: w.description,
          image: w.image ?? null,
          video: w.video ?? null,
          colors: w.colors,
          featured: Boolean(w.featured),
          updated_at: new Date().toISOString(),
        }),
    );
    check(await db().from("emotes").delete().eq("work_id", w.id));
    if (w.emotes?.length) {
      check(
        await db()
          .from("emotes")
          .insert(
            w.emotes.map((e, i) => ({
              work_id: w.id,
              position: i,
              name: e.name,
              grp: e.group,
              src: e.src,
              animated: Boolean(e.animated),
            })),
          ),
      );
    }
  },

  async deleteWork(id) {
    check(await db().from("works").delete().eq("id", id));
  },

  async reorderWorks(ids) {
    await Promise.all(ids.map(async (id, position) => check(await db().from("works").update({ position }).eq("id", id))));
  },

  async createSignedUpload(path) {
    const bucket = db().storage.from("portfolio");
    const data = check(await bucket.createSignedUploadUrl(path, { upsert: true })) as { token: string };
    return { token: data.token, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
  },

  async uploadAsset(path, data, contentType) {
    const bucket = db().storage.from("portfolio");
    check(await bucket.upload(path, data, { contentType, upsert: true }));
    return bucket.getPublicUrl(path).data.publicUrl;
  },

  async recordPaidOrder(o: NewOrder) {
    // Idempotent : Stripe peut renvoyer le même événement plusieurs fois.
    const existing = await this.getOrderBySession(o.stripeSessionId);
    if (existing) return existing;
    const row = check(
      await db()
        .from("orders")
        .insert({
          stripe_session_id: o.stripeSessionId,
          demo: o.demo,
          pack_id: o.packId,
          formula_id: o.formulaId,
          offer_name: o.offerName,
          payment_type: o.paymentType,
          has_logo: o.hasLogo,
          list_price: o.listPrice,
          total_price: o.totalPrice,
          amount_paid: o.amountPaid,
          deposit_percent: o.depositPercent,
          logo_discount: o.logoDiscount,
          customer_name: o.customerName,
          customer_email: o.customerEmail,
          fees_paid: o.feesPaid ?? null,
        })
        .select("*")
        .single(),
    ) as Row;
    return toOrder(row, []);
  },

  async getOrder(id) {
    return (await fetchOrders((q) => q.eq("id", id)))[0] ?? null;
  },

  async getOrderBySession(sid) {
    return (await fetchOrders((q) => q.eq("stripe_session_id", sid)))[0] ?? null;
  },

  async listOrders(status) {
    return fetchOrders((q) => {
      const ordered = q.order("created_at", { ascending: false });
      return status ? ordered.eq("status", status) : ordered;
    });
  },

  async updateOrder(id, patch) {
    const row: Row = { updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) row[orderColumns[k as keyof OrderPatch]] = v ?? null;
    check(await db().from("orders").update(row).eq("id", id));
  },

  async addNote(orderId, body) {
    check(await db().from("order_notes").insert({ order_id: orderId, body }));
  },
};
