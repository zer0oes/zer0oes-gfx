import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { supabaseLikePglite } from "./pglite-supabase";

test("quota commun : 10 réservations maximum, événements idempotents et devis atomique", async () => {
  const db = await supabaseLikePglite();
  try {
    const dir = path.join(process.cwd(), "supabase/migrations");
    for (const file of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
    const reserve = async (id: string) => (await db.query<{ ok: boolean }>("select reserve_launch_slot($1) as ok", [id])).rows[0].ok;
    const settle = (id: string, paid: boolean) => db.query("select settle_launch_slot($1, $2)", [id, paid]);
    const remaining = async () => (await db.query<{ n: number }>("select (launch_offer_state()->>'remaining')::int as n")).rows[0].n;
    assert.equal(await reserve(randomUUID()), false, "campagne inactive par défaut");
    await db.exec("update launch_offer set enabled = true, starts_at = now() + interval '1 day'");
    assert.equal(await reserve(randomUUID()), false, "aucune réservation avant la date de début");
    await db.exec("update launch_offer set starts_at = now() - interval '1 minute'");
    const ids = Array.from({ length: 12 }, () => randomUUID());
    const results = await Promise.all(ids.map(reserve));
    assert.equal((await db.query<{ n: number }>("select (launch_offer_state()->>'ordersRemaining')::int as n")).rows[0].n, 10, "les réservations seules ne sont pas des commandes");
    assert.equal(results.filter(Boolean).length, 10);
    assert.equal(await reserve(ids[0]), true);
    assert.equal(await remaining(), 0);
    await settle(ids[0], true);
    await settle(ids[0], false);
    assert.equal(await remaining(), 0, "un paiement confirmé ne peut être libéré par un événement tardif");
    await settle(ids[1], false);
    await settle(ids[1], false);
    assert.equal(await remaining(), 1);
    const token = "e".repeat(48);
    const q = { status: "propose", name: "Client", email: "client@example.fr", title: "Univers complet", description: "Pack", totalPrice: 100000, launchPercent: 50, validUntil: "2099-01-01", request: {}, deliverables: ["Logo"] };
    await db.query("insert into project_quotes(id, token, content) values ($1, $2, $3)", [randomUUID(), token, JSON.stringify(q)]);
    const accept = async (price: number) => (await db.query<{ id: string }>("select respond_project_quote($1, true, '', '{}'::jsonb, 'acompte', $2) as id", [token, price])).rows[0].id;
    await assert.rejects(accept(100000), /prix a changé/);
    assert.equal(await remaining(), 1, "une demande au prix périmé annule sa réservation");
    const id = await accept(50000);
    assert.equal(await accept(50000), id);
    const order = (await db.query<{ total_price: number; list_price: number; promo_code: string }>("select * from orders where id = $1", [id])).rows[0];
    assert.equal(order.total_price, 50000);
    assert.equal(order.list_price, 100000);
    assert.equal(order.promo_code, "LANCEMENT-2026");
    assert.equal((await db.query<{ n: number }>("select (launch_offer_state()->>'ordersRemaining')::int as n")).rows[0].n, 9, "seule la vraie commande créée a consommé une place affichée");
    assert.equal(await remaining(), 0);
    assert.equal(await reserve(ids[11]), false);
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(db.query("select reserve_launch_slot($1)", [randomUUID()]), /permission denied/);
      await db.exec("reset role");
    }
  } finally { await db.close(); }
});
