import { createRequire } from "node:module";
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { packs } = await import("../src/data/packs");
const { supabaseConfigured, supabaseUrl, supabaseSecretKey } = await import("../src/lib/env");
if (supabaseConfigured()) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(supabaseUrl()!, supabaseSecretKey()!);
  for (const pack of packs) {
    const { error } = await db.from("packs").update({ price: pack.price, price_from: Boolean(pack.priceFrom), deliverables: pack.deliverables }).eq("id", pack.id);
    if (error) throw new Error(error.message);
    for (const formula of pack.formulas ?? []) {
      const { data: previous, error: readError } = await db.from("formulas").select("price").eq("pack_id", pack.id).eq("id", formula.id).single();
      if (readError) throw new Error(readError.message);
      const { error: formulaError } = await db.from("formulas").update({ price: formula.price, ...(previous.price !== formula.price ? { stripe_price_id: null } : {}) }).eq("pack_id", pack.id).eq("id", formula.id);
      if (formulaError) throw new Error(formulaError.message);
    }
    const { data, error: verifyError } = await db.from("packs").select("price, deliverables").eq("id", pack.id).single();
    if (verifyError || data.price !== pack.price || JSON.stringify(data.deliverables) !== JSON.stringify(pack.deliverables)) throw new Error(`Pack non vérifié : ${pack.id}`);
    console.log(`${pack.name} : ${pack.price / 100} €${pack.priceFrom ? " (à partir de)" : ""}, contenu vérifié.`);
  }
} else {
  const { getStore } = await import("../src/lib/store");
  const store = getStore();
  const catalog = await store.getCatalog();
  for (const target of packs) {
    const original = catalog.packs.find((p) => p.id === target.id);
    if (original && store.kind !== "static") await store.savePack({ ...original, price: target.price, priceFrom: target.priceFrom, deliverables: target.deliverables, formulas: original.formulas?.map((f) => { const updated = target.formulas?.find((t) => t.id === f.id); return updated ? { ...f, price: updated.price, stripePriceId: f.price === updated.price ? f.stripePriceId : undefined } : f; }) });
  }
  console.log(`Catalogue ${store.kind} mis à jour.`);
}
