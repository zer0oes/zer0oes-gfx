import { createRequire } from "node:module";
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env") as typeof import("@next/env");
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const { options } = await import("../src/data/packs");
const { supabaseConfigured, supabaseUrl, supabaseSecretKey } = await import("../src/lib/env");
const ids = ["overlay-fixe-unite", "banniere", "avatar", "logo", "logo-declinaisons", "overlay-anime-unite", "alertes-fixes", "alertes-animees", "emote-statique", "emote-animee", "emotes-3", "emotes-animees-3", "emotes-5", "emotes-animees-5", "emotes-10", "emotes-animees-10"];
const targets = options.filter((o) => ids.includes(o.id));
if (supabaseConfigured()) {
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(supabaseUrl()!, supabaseSecretKey()!);
  for (const option of targets) {
    const { error } = ["logo-declinaisons", "emotes-animees-10"].includes(option.id)
      ? await db.from("options").upsert({ id: option.id, name: option.name, price: option.price, price_from: Boolean(option.priceFrom), category: option.category, position: option.id === "logo-declinaisons" ? 19 : 20 }, { onConflict: "id" })
      : await db.from("options").update({ price: option.price, price_from: Boolean(option.priceFrom) }).eq("id", option.id);
    if (error) throw new Error(error.message);
  }
  const { data, error } = await db.from("options").select("id, price, price_from").in("id", ids);
  if (error) throw new Error(error.message);
  for (const option of targets) if (!data?.some((row) => row.id === option.id && row.price === option.price && row.price_from === Boolean(option.priceFrom))) throw new Error(`Tarif non vérifié : ${option.id}`);
  console.log(`Catalogue Supabase : ${targets.length} tarifs vérifiés.`);
} else {
  const { getStore } = await import("../src/lib/store");
  const store = getStore();
  const catalog = await store.getCatalog();
  const updated = catalog.options.map((o) => { const target = targets.find((t) => t.id === o.id); return target ? { ...o, price: target.price, priceFrom: target.priceFrom } : o; });
  for (const target of targets) if (!updated.some((o) => o.id === target.id)) updated.push(target);
  if (store.kind !== "static") await store.saveOptions(updated);
  console.log(`Catalogue ${store.kind} : tarifs mis à jour.`);
}
