import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bucketsFor,
  deadlineOf,
  declarations,
  movements,
  nextDeclaration,
  outstandingBalances,
  parisDay,
  resolvePeriod,
  revenueByOffer,
  series,
  toCsv,
  totals,
  within,
} from "./dashboard";
import { demoOrders } from "./dashboard-demo";
import { defaultFinance, type FinanceSettings } from "./finance";
import { mergeRefunds } from "./refunds";
import type { Order } from "./store/types";

const f: FinanceSettings = { ...defaultFinance, urssafRate: 25.6, cfpRate: 0.2, vlEnabled: false, stripePercent: 1.5, stripeFixed: 25 };

function order(o: Partial<Order>): Order {
  return {
    id: "o1",
    createdAt: "2026-07-10T10:00:00Z",
    updatedAt: "2026-07-10T10:00:00Z",
    stripeSessionId: "cs_1",
    demo: false,
    packId: "premier-look",
    formulaId: "base",
    offerName: "Premier look",
    paymentType: "total",
    hasLogo: false,
    listPrice: 100000,
    totalPrice: 100000,
    amountPaid: 100000,
    depositPercent: 30,
    logoDiscount: 0,
    customerName: "",
    customerEmail: "a@exemple.fr",
    status: "payee",
    notes: [],
    ...o,
  };
}

test("jour à l'heure de Paris : un paiement du 30 septembre à 23 h 30 UTC compte le 1er octobre", () => {
  assert.equal(parisDay("2026-09-30T23:30:00Z"), "2026-10-01");
  assert.equal(parisDay("2026-12-31T22:59:00Z"), "2026-12-31");
});

test("mouvements : paiement complet, acompte puis solde (frais réels répartis), remboursement", () => {
  const movs = movements(
    [
      order({ id: "total" }),
      order({
        id: "acompte",
        paymentType: "acompte",
        amountPaid: 100000,
        feesPaid: 2000,
        balancePaidAt: "2026-08-20T10:00:00Z",
        refunds: [{ id: "re_1", amount: 5000, at: "2026-09-01T10:00:00Z" }],
      }),
      order({ id: "attente", paymentType: "acompte", amountPaid: 30000 }),
    ],
    [],
    f,
  );
  const of = (id: string) => movs.filter((m) => m.orderId === id).map((m) => [m.kind, m.amount, m.fee, m.day]);
  assert.deepEqual(of("total"), [["complet", 100000, 1525, "2026-07-10"]]);
  assert.deepEqual(of("acompte"), [
    ["acompte", 30000, 600, "2026-07-10"],
    ["solde", 70000, 1400, "2026-08-20"],
    ["remboursement", -5000, 0, "2026-09-01"],
  ]);
  assert.deepEqual(of("attente"), [["acompte", 30000, 475, "2026-07-10"]]);
});

test("acompte : le montant de la facture d'acompte prime sur le recalcul", () => {
  const movs = movements(
    [order({ paymentType: "acompte", amountPaid: 100000, balancePaidAt: "2026-08-01T10:00:00Z" })],
    [{ orderId: "o1", kind: "acompte", amount: 29999 } as never],
    f,
  );
  assert.deepEqual(
    movs.map((m) => m.amount),
    [29999, 70001],
  );
});

test("totaux : remboursements déduits du chiffre d'affaires, cotisations sur le CA, frais non déductibles", () => {
  const movs = movements(
    [order({ id: "a" }), order({ id: "b", amountPaid: 50000, refunds: [{ id: "re", amount: 50000, at: "2026-07-12T10:00:00Z" }] })],
    [],
    f,
  );
  const t = totals(movs, f);
  assert.equal(t.collected, 150000);
  assert.equal(t.refunds, 50000);
  assert.equal(t.revenue, 100000);
  assert.equal(t.urssaf, 25600);
  assert.equal(t.cfp, 200);
  assert.equal(t.vl, 0);
  assert.equal(t.fees, 1525 + 775);
  assert.equal(t.net, 100000 - 2300 - 25800);
  assert.equal(t.feesEstimated, true);
  assert.equal(totals(movs, { ...f, vlEnabled: true, vlRate: 2.2 }).vl, 2200);
  // Remboursement supérieur aux encaissements de la période : pas de cotisation négative
  assert.equal(totals(movs.filter((m) => m.kind === "remboursement"), f).contributions, 0);
});

test("périodes : trimestre en cours par défaut, mois, année, personnalisée, valeurs invalides", () => {
  const today = "2026-10-03";
  const q = resolvePeriod({}, today);
  assert.deepEqual([q.kind, q.start, q.end, q.label, q.prevRef, q.nextRef], ["trimestre", "2026-10-01", "2026-12-31", "4e trimestre 2026", "2026-T3", "2027-T1"]);
  assert.equal(resolvePeriod({ periode: "trimestre", ref: "2026-T1" }, today).label, "1er trimestre 2026");
  const m = resolvePeriod({ periode: "mois", ref: "2024-02" }, today);
  assert.deepEqual([m.start, m.end, m.label, m.prevRef, m.nextRef], ["2024-02-01", "2024-02-29", "février 2024", "2024-01", "2024-03"]);
  assert.equal(resolvePeriod({ periode: "mois", ref: "2026-13" }, today).ref, "2026-10");
  assert.deepEqual([resolvePeriod({ periode: "annee", ref: "2025" }, today).start, resolvePeriod({ periode: "annee" }, today).end], ["2025-01-01", "2026-12-31"]);
  const p = resolvePeriod({ periode: "perso", debut: "2026-03-15", fin: "2026-05-02" }, today);
  assert.deepEqual([p.kind, p.start, p.end], ["perso", "2026-03-15", "2026-05-02"]);
  for (const bad of [{ debut: "2026-05-02", fin: "2026-03-15" }, { debut: "2026-02-30", fin: "2026-03-01" }, { debut: "x", fin: "y" }]) {
    const r = resolvePeriod({ periode: "perso", ...bad }, today);
    assert.deepEqual([r.kind, r.start], ["perso", "2026-10-01"]);
  }
});

test("graphiques : par jour sur un mois, par mois au-delà ; cumuls", () => {
  assert.equal(bucketsFor({ start: "2026-10-01", end: "2026-10-31" }).length, 31);
  const q = bucketsFor({ start: "2026-07-01", end: "2026-09-30" });
  assert.deepEqual(q.map((b) => b.key), ["2026-07", "2026-08", "2026-09"]);
  assert.equal(bucketsFor({ start: "2026-01-01", end: "2026-12-31" }).length, 12);
  const partial = bucketsFor({ start: "2026-03-15", end: "2026-05-02" });
  assert.deepEqual([partial[0].start, partial.at(-1)!.end], ["2026-03-15", "2026-05-02"]);

  const movs = movements([order({ id: "a" }), order({ id: "b", createdAt: "2026-09-05T10:00:00Z" })], [], f);
  const s = series(movs, { start: "2026-07-01", end: "2026-09-30" }, f, "2026-08-15");
  assert.deepEqual(s.map((p) => p.future), [false, false, true]);
  assert.deepEqual(s.map((p) => p.axis), ["juil. 26", "août", "sept."]);
  assert.deepEqual(s.map((p) => p.complet), [100000, 0, 100000]);
  assert.deepEqual(s.map((p) => p.cumulativeRevenue), [100000, 100000, 200000]);
  assert.equal(s.at(-1)!.cumulativeNet, totals(movs, f).net);
});

test("URSSAF : échéance à la fin du mois suivant la période", () => {
  assert.equal(deadlineOf("2026-09-30"), "2026-10-31");
  assert.equal(deadlineOf("2026-12-31"), "2027-01-31");
  assert.equal(deadlineOf("2028-01-31"), "2028-02-29");
});

test("URSSAF : déclarations trimestrielles et mensuelles, prochaine échéance", () => {
  const movs = movements([order({ createdAt: "2026-08-10T10:00:00Z" })], [], f);
  const year = declarations(movs, f, { start: "2026-01-01", end: "2026-12-31" }, "2026-10-03");
  assert.deepEqual(
    year.map((d) => [d.label, d.state, d.deadline]),
    [
      ["T1 2026", "echue", "2026-04-30"],
      ["T2 2026", "echue", "2026-07-31"],
      ["T3 2026", "a_declarer", "2026-10-31"],
      ["T4 2026", "en_cours", "2027-01-31"],
    ],
  );
  assert.deepEqual([year[2].revenue, year[2].contributions], [100000, 25800]);

  const next = nextDeclaration(movs, f, "2026-10-03");
  assert.deepEqual([next.label, next.state, next.revenue], ["T3 2026", "a_declarer", 100000]);
  assert.deepEqual([nextDeclaration(movs, f, "2026-11-15").label, nextDeclaration(movs, f, "2026-11-15").state], ["T4 2026", "en_cours"]);

  const monthly = { ...f, urssafPeriodicity: "mensuelle" as const };
  assert.equal(nextDeclaration(movs, monthly, "2026-09-10").label, "août 2026");
  assert.equal(declarations(movs, monthly, { start: "2026-07-01", end: "2026-09-30" }, "2026-10-03").length, 3);
  // Un mois choisi en régime trimestriel : le trimestre qui le contient
  assert.deepEqual(declarations(movs, f, { start: "2026-08-01", end: "2026-08-31" }, "2026-10-03").map((d) => d.label), ["T3 2026"]);
});

test("soldes restant à encaisser : hors commandes remboursées", () => {
  const r = outstandingBalances([
    order({ id: "a", paymentType: "acompte", amountPaid: 30000 }),
    order({ id: "b", paymentType: "acompte", amountPaid: 30000, refunds: [{ id: "re", amount: 30000, at: "2026-07-11T10:00:00Z" }] }),
    order({ id: "c" }),
  ]);
  assert.deepEqual(r, { amount: 70000, count: 1 });
});

test("CA par offre et filtre de période", () => {
  const movs = movements([order({ id: "a" }), order({ id: "b", offerName: "Identité signature", amountPaid: 200000, totalPrice: 200000 })], [], f);
  assert.deepEqual(revenueByOffer(movs).map((r) => r.offer), ["Identité signature", "Premier look"]);
  assert.equal(movs.filter((m) => within(m, "2026-07-11", "2026-07-31")).length, 0);
});

test("export CSV : Excel français, formules neutralisées", () => {
  const csv = toCsv(movements([order({ customerEmail: "=HYPERLINK(\"x\")", offerName: "Offre; spéciale" })], [], f));
  assert.ok(csv.startsWith("﻿Date;Type;"));
  const line = csv.split("\r\n")[1];
  assert.equal(line, `2026-07-10;Paiement complet;"Offre; spéciale";"'=HYPERLINK(""x"")";o1;1000,00;15,25;oui`);
});

test("remboursements : fusion idempotente, ceux de l'autre paiement conservés", () => {
  const deposit = [{ id: "re_a", amount: 1000, at: "2026-07-01T00:00:00Z", paymentIntentId: "pi_acompte" }];
  const once = mergeRefunds(deposit, "pi_solde", [{ id: "re_b", amount: 500, at: "2026-08-01T00:00:00Z" }]);
  const twice = mergeRefunds(once, "pi_solde", [{ id: "re_b", amount: 500, at: "2026-08-01T00:00:00Z" }]);
  assert.deepEqual(twice, once);
  assert.deepEqual(
    once.map((r) => [r.id, r.paymentIntentId]),
    [
      ["re_a", "pi_acompte"],
      ["re_b", "pi_solde"],
    ],
  );
});

test("données d'exemple : reproductibles et jusqu'à aujourd'hui", () => {
  const a = demoOrders("2026-10-03");
  assert.deepEqual(a, demoOrders("2026-10-03"));
  assert.ok(a.length > 30);
  assert.ok(a.every((o) => o.demo && parisDay(o.createdAt) <= "2026-10-03" && (!o.balancePaidAt || parisDay(o.balancePaidAt) <= "2026-10-03")));
  assert.ok(a.some((o) => o.refunds?.length));
});
