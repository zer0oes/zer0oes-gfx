import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { supabaseLikePglite } from "./pglite-supabase";

test("accepter un devis crée une seule commande impayée et protège les décisions", async () => {
  const db = await supabaseLikePglite();
  try {
    const dir = path.join(process.cwd(), "supabase/migrations");
    for (const file of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, file), "utf8"));
    const token = "a".repeat(48);
    const content = { status: "propose", name: "Client", email: "client@example.fr", title: "Logo personnalisé",
      description: "Création originale", totalPrice: 50000, validUntil: "2099-01-01", request: { Message: "Mon projet" }, deliverables: ["Logo"] };
    const insert = async (id: string, t: string, c: object) => db.query("insert into project_quotes(id, token, content) values ($1, $2, $3)", [id, t, JSON.stringify(c)]);
    await insert("00000000-0000-4000-8000-000000000001", token, content);
    const accept = async () => (await db.query<{ id: string }>("select respond_project_quote($1, true, '', $2::jsonb) as id", [token, JSON.stringify({ "Univers / ambiance": "Néon", "Création 1 — Logo": "Symbole violet" })])).rows[0].id;
    const id = await accept();
    assert.equal(await accept(), id);
    const orders = (await db.query<{ amount_paid: number; total_price: number; delivery_token: string; brief: Record<string, string> }>("select * from orders")).rows;
    assert.equal(orders.length, 1); assert.equal(orders[0].amount_paid, 0); assert.equal(orders[0].total_price, 50000);
    assert.equal(orders[0].delivery_token, token); assert.equal(orders[0].brief.Message, "Mon projet");
    assert.equal(orders[0].brief["Univers / ambiance"], "Néon");
    assert.equal(orders[0].brief["Création 1 — Logo"], "Symbole violet");
    await insert("00000000-0000-4000-8000-000000000002", "b".repeat(48), { ...content, validUntil: "2000-01-01" });
    await assert.rejects(db.query("select respond_project_quote($1, true)", ["b".repeat(48)]), /expiré/);
    await insert("00000000-0000-4000-8000-000000000003", "c".repeat(48), content);
    await db.query("select respond_project_quote($1, false, $2)", ["c".repeat(48), "Budget trop élevé"]);
    const reason = (await db.query<{ reason: string }>("select content->>'declineReason' as reason from project_quotes where token = $1", ["c".repeat(48)])).rows[0].reason;
    assert.equal(reason, "Budget trop élevé");
    await assert.rejects(db.query("select respond_project_quote($1, true)", ["c".repeat(48)]), /indisponible/);
    const reopen = async (t: string) => (await db.query<{ ok: boolean }>("select reopen_project_quote($1) as ok", [t])).rows[0].ok;
    assert.equal(await reopen(token), false);
    assert.equal(await reopen("b".repeat(48)), false);
    assert.equal(await reopen("c".repeat(48)), true);
    assert.equal(await reopen("c".repeat(48)), false);
    const reopened = (await db.query<{ status: string; reason: string | null }>("select content->>'status' as status, content->>'declineReason' as reason from project_quotes where token = $1", ["c".repeat(48)])).rows[0];
    assert.equal(reopened.status, "propose");
    assert.equal(reopened.reason, null);
    await insert("00000000-0000-4000-8000-000000000004", "d".repeat(48), { ...content, paymentType: "acompte", depositPercent: 30 });
    const depositOrder = (await db.query<{ id: string }>("select respond_project_quote($1, true) as id", ["d".repeat(48)])).rows[0].id;
    const pay = async (key: string, amount: number) => (await db.query<{ ok: boolean }>("select record_quote_payment($1, $2, $3, 300) as ok", [depositOrder, key, amount])).rows[0].ok;
    assert.equal(await pay("pi_wrong", 1000), false);
    assert.equal(await pay("pi_deposit", 15000), true);
    assert.equal(await pay("pi_deposit", 15000), true);
    assert.equal(await pay("pi_other", 15000), false);
    const depositPaid = (await db.query<{ amount_paid: number; deposit_percent: number }>("select amount_paid, deposit_percent from orders where id = $1", [depositOrder])).rows[0];
    assert.equal(depositPaid.amount_paid, 15000);
    assert.equal(depositPaid.deposit_percent, 30);
    await insert("00000000-0000-4000-8000-000000000005", "e".repeat(48), { ...content, paymentType: "acompte", depositPercent: 30 });
    const fullId = (await db.query<{ id: string }>("select respond_project_quote($1, true, '', '{}'::jsonb, 'total') as id", ["e".repeat(48)])).rows[0].id;
    const full = (await db.query<{ payment_type: string; deposit_percent: number }>("select payment_type, deposit_percent from orders where id = $1", [fullId])).rows[0];
    assert.equal(full.payment_type, "total");
    assert.equal(full.deposit_percent, 0);
    await db.exec("grant usage on schema public to anon; grant select on project_quotes to anon; set role anon");
    assert.equal((await db.query("select * from project_quotes")).rows.length, 0);
    await assert.rejects(db.query("select respond_project_quote($1, true)", [token]), /permission denied/);
  } finally { await db.close(); }
});
