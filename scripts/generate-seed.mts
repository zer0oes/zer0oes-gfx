// Génère supabase/seed.sql à partir du contenu actuel de src/data
// (offres, options, réglages, streameurs, réalisations, emotes).
// Usage : npm run db:seed:generate
// Le fichier est ensuite exécuté par `supabase db reset` (CLI) ou collé dans
// l'éditeur SQL de Supabase. Il est idempotent (upsert).
import fs from "node:fs";
import path from "node:path";
import { defaultSettings, options, packs } from "../src/data/packs";
import { streamers, works } from "../src/data/portfolio";
import { defaultFinance as f } from "../src/lib/finance";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) return `array[${v.map(q).join(", ")}]::text[]`;
  return `'${String(v).replace(/'/g, "''")}'`;
};

const rows = (table: string, cols: string[], values: unknown[][], conflict: string) =>
  values.length
    ? `insert into public.${table} (${cols.join(", ")}) values\n${values
        .map((r) => `  (${r.map(q).join(", ")})`)
        .join(",\n")}\non conflict (${conflict}) do update set ${cols
        .filter((c) => !conflict.split(", ").includes(c))
        .map((c) => `${c} = excluded.${c}`)
        .join(", ")};\n`
    : "";

let sql = `-- Généré par scripts/generate-seed.ts depuis src/data — ne pas modifier à la main.\n\n`;
sql += rows(
  "settings",
  ["id", "deposit_percent", "logo_discount", "delivery_days"],
  [[1, defaultSettings.depositPercent, defaultSettings.logoDiscount, defaultSettings.deliveryDays]],
  "id",
);
sql += rows(
  "finance_settings",
  ["id", "urssaf_rate", "cfp_rate", "vl_enabled", "vl_rate", "stripe_percent", "stripe_fixed"],
  [[1, f.urssafRate, f.cfpRate, f.vlEnabled, f.vlRate, f.stripePercent, f.stripeFixed]],
  "id",
);
sql += rows(
  "packs",
  ["id", "position", "name", "tagline", "price", "price_from", "checkout", "deliverables", "extras", "note", "highlight"],
  packs.map((p, i) => [
    p.id, i, p.name, p.tagline, p.price, Boolean(p.priceFrom), p.checkout, p.deliverables, p.extras ?? [], p.note ?? null, Boolean(p.highlight),
  ]),
  "id",
);
sql += rows(
  "formulas",
  ["pack_id", "id", "position", "label", "price", "stripe_price_id"],
  packs.flatMap((p) => (p.formulas ?? []).map((f, i) => [p.id, f.id, i, f.label, f.price, f.stripePriceId ?? null])),
  "pack_id, id",
);
sql += rows(
  "options",
  ["id", "position", "name", "price", "price_from", "unit"],
  options.map((o, i) => [o.id, i, o.name, o.price, Boolean(o.priceFrom), o.unit ?? null]),
  "id",
);
sql += rows(
  "streamers",
  ["id", "position", "name", "description", "url"],
  streamers.map((s, i) => [s.id, i, s.name, s.description, s.url ?? null]),
  "id",
);
sql += rows(
  "works",
  ["id", "streamer_id", "category", "position", "title", "description", "image", "video", "colors", "featured"],
  works.map((w, i) => [
    w.id, w.streamer, w.category, i, w.title, w.description, w.image ?? null, w.video ?? null, w.colors, Boolean(w.featured),
  ]),
  "id",
);
sql += rows(
  "emotes",
  ["work_id", "position", "name", "grp", "src", "animated"],
  works.flatMap((w) => (w.emotes ?? []).map((e, i) => [w.id, i, e.name, e.group, e.src, Boolean(e.animated)])),
  "work_id, name",
);

const out = path.join(process.cwd(), "supabase", "seed.sql");
fs.writeFileSync(out, sql);
console.log(`Seed écrit : ${path.relative(process.cwd(), out)} (${sql.length} caractères)`);
