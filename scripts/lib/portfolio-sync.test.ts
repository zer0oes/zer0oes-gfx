import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { streamers, works } from "../../src/data/portfolio";
import { apply, plan, readMigrations } from "./db-setup-core";
import { pgliteDb, supabaseLikePglite } from "./pglite-supabase";
import { applyPortfolio, planPortfolio } from "./portfolio-sync";

const seed = fs.readFileSync(path.join(process.cwd(), "supabase", "seed.sql"), "utf8");

test("portfolio : ajoute seulement les réalisations absentes, sans toucher aux modifications de l'admin", async () => {
  const pg = await supabaseLikePglite();
  const db = pgliteDb(pg);
  await apply(db, await plan(db, readMigrations(process.cwd())), seed);

  // Base « ancienne » : sans les nouvelles réalisations, et un titre modifié dans l'admin
  await pg.exec(`delete from public.works where id in ('zer0oes-logo', 'zer0oes-paused', 'zer0oes-gaming')`);
  await pg.exec(`update public.works set title = 'Titre admin' where id = 'zer0oes-chat'`);

  const p = await planPortfolio(db, streamers, works);
  assert.deepEqual(
    p.works.map((w) => w.work.id),
    ["zer0oes-logo", "zer0oes-paused", "zer0oes-gaming"],
  );
  await applyPortfolio(db, p, streamers);

  const rows = (await pg.query<{ id: string; category: string; position: number }>(`select id, category, position from public.works order by position`)).rows;
  assert.equal(rows.length, works.length);
  assert.equal(rows.find((r) => r.id === "zer0oes-logo")?.category, "logo");
  assert.equal((await pg.query<{ title: string }>(`select title from public.works where id = 'zer0oes-chat'`)).rows[0].title, "Titre admin");

  // Relance : rien à ajouter
  const again = await planPortfolio(db, streamers, works);
  assert.equal(again.works.length + again.streamers.length, 0);
  await pg.close();
});
