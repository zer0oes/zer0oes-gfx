// Vérifie les migrations et le seed sur un Postgres en mémoire (PGlite), sans Docker.
// Les schémas propres à Supabase (rôles, storage) sont simulés au minimum.
// Usage : npm run db:check
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const db = new PGlite();

await db.exec(`
  create role anon; create role authenticated;
  create schema storage;
  create schema auth;
  -- Simulation de auth.jwt() : claims lus dans le réglage request.jwt.claims
  create function auth.jwt() returns jsonb language sql stable
    as $f$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $f$;
  grant usage on schema auth to anon, authenticated;
  create table storage.buckets (
    id text primary key, name text, public boolean,
    file_size_limit bigint, allowed_mime_types text[]
  );
`);

const dir = path.join(root, "supabase", "migrations");
for (const file of fs.readdirSync(dir).sort()) {
  await db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
  console.log("migration OK :", file);
}

const seed = fs.readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");
await db.exec(seed);
await db.exec(seed); // idempotent
console.log("seed OK (exécuté deux fois)");

const count = async (t: string) => (await db.query<{ n: number }>(`select count(*)::int as n from ${t}`)).rows[0].n;
for (const t of ["settings", "packs", "formulas", "options", "streamers", "works", "emotes"]) {
  console.log(`  ${t}: ${await count(`public.${t}`)}`);
}

// RLS activée partout
const rls = await db.query<{ relname: string; relrowsecurity: boolean }>(
  `select relname, relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' order by relname`,
);
const missing = rls.rows.filter((r) => !r.relrowsecurity).map((r) => r.relname);
if (missing.length) throw new Error(`RLS désactivée sur : ${missing.join(", ")}`);
console.log("RLS activée sur", rls.rows.length, "tables");

// Le rôle anon ne lit rien des commandes
await db.exec(`grant usage on schema public to anon, authenticated;
  grant select on all tables in schema public to anon, authenticated;
  grant insert on public.order_messages to authenticated;`);
await db.exec(`insert into public.orders (stripe_session_id, pack_id, formula_id, offer_name, payment_type, list_price, total_price, amount_paid, deposit_percent)
  values ('cs_test', 'premier-look', 'base', 'Premier look', 'total', 49000, 49000, 49000, 30)`);
await db.exec(`set role anon`);
const anonOrders = await count("public.orders");
const anonPacks = await count("public.packs");
await db.exec(`reset role`);
if (anonOrders !== 0) throw new Error("Le rôle anon peut lire les commandes !");
console.log(`anon : ${anonPacks} offres visibles, ${anonOrders} commande visible`);

// Espace client : un client connecté ne voit que ses commandes
await db.exec(`update public.orders set customer_email = 'Client@Exemple.fr' where stripe_session_id = 'cs_test';
  insert into public.orders (stripe_session_id, pack_id, formula_id, offer_name, payment_type, list_price, total_price, amount_paid, deposit_percent, customer_email)
  values ('cs_autre', 'premier-look', 'base', 'Premier look', 'total', 49000, 49000, 49000, 30, 'autre@exemple.fr');`);
const asClient = async (email: string, sql: string) => {
  await db.exec(`set request.jwt.claims = '{"email":"${email}"}'; set role authenticated;`);
  try {
    return await db.query<{ n: number }>(sql);
  } finally {
    await db.exec(`reset role; reset request.jwt.claims;`);
  }
};
const mine = (await asClient("client@exemple.fr", "select count(*)::int as n from public.orders")).rows[0].n;
const other = (await asClient("inconnu@exemple.fr", "select count(*)::int as n from public.orders")).rows[0].n;
if (mine !== 1 || other !== 0) throw new Error(`RLS client incorrecte (${mine}, ${other})`);
const orderId = (await db.query<{ id: string }>("select id from public.orders where stripe_session_id = 'cs_test'")).rows[0].id;
await asClient("client@exemple.fr", `insert into public.order_messages (order_id, author, body) values ('${orderId}', 'client', 'Bonjour')`);
let refused = false;
try {
  await asClient("autre@exemple.fr", `insert into public.order_messages (order_id, author, body) values ('${orderId}', 'client', 'Intrus')`);
} catch {
  refused = true;
}
if (!refused) throw new Error("Un client peut écrire sur la commande d'un autre !");
console.log("espace client : 1 commande visible pour son client, 0 pour un autre, écriture croisée refusée");
await db.close();
