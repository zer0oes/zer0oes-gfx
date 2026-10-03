import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { apply, describeDbUrl, plan, readMigrations, verify } from "./db-setup-core";
import { pgliteDb, supabaseLikePglite } from "./pglite-supabase";

const root = process.cwd();
const migrations = readMigrations(root);
const seed = fs.readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");

test("première installation : toutes les migrations, le seed, RLS et buckets", async () => {
  const pg = await supabaseLikePglite();
  const db = pgliteDb(pg);
  const p = await plan(db, migrations);
  assert.equal(p.pending.length, migrations.length);
  assert.equal(p.seed, true);
  await apply(db, p, seed);

  const r = await verify(db);
  assert.deepEqual(r.withoutRls, []);
  assert.deepEqual(r.buckets, ["livrables", "portfolio"]);
  assert.ok(r.counts.packs > 0);

  // Relance : rien à refaire, et le seed ne réécrase pas les offres modifiées dans l'admin
  await pg.exec(`update public.packs set name = 'Modifié dans l''admin' where id = 'premier-look'`);
  const again = await plan(db, migrations);
  assert.equal(again.pending.length, 0);
  assert.equal(again.seed, false);
  await apply(db, again, seed);
  const name = (await pg.query<{ name: string }>(`select name from public.packs where id = 'premier-look'`)).rows[0].name;
  assert.equal(name, "Modifié dans l'admin");
  await pg.close();
});

test("nouvelle migration seule appliquée", async () => {
  const pg = await supabaseLikePglite();
  const db = pgliteDb(pg);
  await apply(db, { ...(await plan(db, migrations.slice(0, 2))), seed: false }, seed);
  const p = await plan(db, migrations);
  assert.deepEqual(
    p.pending.map((m) => m.version),
    migrations.slice(2).map((m) => m.version),
  );
  await apply(db, p, seed);
  assert.equal((await plan(db, migrations)).pending.length, 0);
  await pg.close();
});

test("migration en échec : annulée entièrement et non enregistrée", async () => {
  const pg = await supabaseLikePglite();
  const db = pgliteDb(pg);
  const broken = [...migrations, { version: "99999999999999", name: "cassee", sql: "create table public.tmp_x (id int); select 1/0;" }];
  await assert.rejects(apply(db, await plan(db, broken), seed));
  assert.equal((await pg.query<{ r: string | null }>(`select to_regclass('public.tmp_x')::text as r`)).rows[0].r, null);
  const p = await plan(db, broken);
  assert.deepEqual(p.pending.map((m) => m.name), ["cassee"]);
  await pg.close();
});

test("base installée à la main sans historique : refus", async () => {
  const pg = await supabaseLikePglite();
  for (const m of migrations) await pg.exec(m.sql);
  const p = await plan(pgliteDb(pg), migrations);
  assert.ok(p.conflict);
  await assert.rejects(apply(pgliteDb(pg), p, seed));
  await pg.close();
});

test("SUPABASE_DB_URL contrôlée sans exposer le mot de passe", () => {
  const ok = describeDbUrl(
    "postgresql://postgres.abcdef123:s3cret@aws-0-eu-west-3.pooler.supabase.com:5432/postgres",
    "https://abcdef123.supabase.co",
  );
  assert.equal(ok.ok, true);
  assert.ok(ok.ok && ok.ref === "abcdef123" && ok.warnings.length === 0);
  assert.ok(!JSON.stringify(ok).includes("s3cret"));

  const other = describeDbUrl("postgresql://postgres.autre:s3cret@h.pooler.supabase.com:5432/postgres", "https://abcdef123.supabase.co");
  assert.equal(other.ok, false);
  assert.ok(!JSON.stringify(other).includes("s3cret"));

  assert.equal(describeDbUrl("postgresql://postgres.abc:[YOUR-PASSWORD]@h:5432/postgres").ok, false);
  const tx = describeDbUrl("postgresql://postgres.abc:pw@h.pooler.supabase.com:6543/postgres");
  assert.ok(tx.ok && tx.warnings.length === 1);
});
