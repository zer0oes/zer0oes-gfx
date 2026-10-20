import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { supabaseLikePglite } from "./pglite-supabase";

test("carrousel en base : textes bilingues, ordre atomique, accès public interdit", async () => {
  const db = await supabaseLikePglite();
  try {
    const dir = path.join(process.cwd(), "supabase/migrations");
    for (const file of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
    const rows = (await db.query<{ id: string; enabled: boolean; content: Record<string, Record<string, string>> }>("select id, enabled, content from marketing_carousel_slides order by position")).rows;
    assert.equal(rows.length, 2);
    assert.equal(rows[0].content.fr.conditions, "Remise automatique, non cumulable");
    rows.reverse(); rows[0].enabled = false; rows[0].content.en.title = "Edited audit";
    await db.query("select save_marketing_carousel($1::jsonb)", [JSON.stringify(rows)]);
    const saved = (await db.query<{ id: string; enabled: boolean; content: Record<string, Record<string, string>> }>("select * from marketing_carousel_slides order by position")).rows;
    assert.equal(saved[0].id, "audit"); assert.equal(saved[0].enabled, false); assert.equal(saved[0].content.en.title, "Edited audit");
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query("select * from marketing_carousel_slides"), /permission denied/);
      await assert.rejects(db.query("select save_marketing_carousel($1::jsonb)", [JSON.stringify(rows)]), /permission denied/);
      await db.exec("reset role");
    }
  } finally { await db.close(); }
});
