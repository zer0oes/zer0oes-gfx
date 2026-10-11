import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { series } from "../../lib/dashboard";
import { defaultFinance } from "../../lib/finance";
import { CumulativeChart, PaymentsChart } from "./charts";

const points = () => {
  const rows = series([], { start: "2026-10-01", end: "2026-10-31" }, defaultFinance, "2026-10-02");
  Object.assign(rows[0], { complet: 7000, acompte: 1000, solde: 2000, revenue: 10000, net: 8000, cumulativeRevenue: 10000, cumulativeNet: 8000 });
  Object.assign(rows[1], { refunds: 15000, revenue: -15000, net: -15000, cumulativeRevenue: -5000, cumulativeNet: -7000 });
  return rows;
};

test("encaissements : les segments restent empilés et les remboursements sous zéro", () => {
  const html = renderToStaticMarkup(createElement(PaymentsChart, { points: points() }));
  const rects = [...html.matchAll(/<rect\b[^>]*>/g)].map(([tag]) => Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
  ));
  const segments = rects.filter((r) => r["data-chart-total"] && r["data-chart-label"].startsWith("1 oct."));
  assert.equal(segments.length, 3);
  assert.equal(new Set(segments.map((r) => r.x)).size, 1);
  assert.ok(Math.abs(Number(segments[0].height) / Number(segments[1].height) - 7) < 1e-10);
  assert.ok(Math.abs(Number(segments[1].y) + Number(segments[1].height) - Number(segments[0].y)) < 1e-10);
  const refund = rects.find((r) => r["data-chart-label"]?.includes("Remboursements"))!;
  assert.ok(Number(refund.height) > 0);
  assert.ok(Number(refund.y) >= Number(segments[0].y) + Number(segments[0].height) - 1e-10);
  assert.match(html, /aria-label="31 oct\. : à venir"/);
  assert.match(html, />31<\/text>/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test("cumul : les courbes s'arrêtent aux jours écoulés et conservent le net négatif", () => {
  const html = renderToStaticMarkup(createElement(CumulativeChart, { points: points() }));
  const lines = [...html.matchAll(/<polyline points="([^"]*)"/g)].map(([, values]) => values.split(" ").map((pair) => pair.split(",").map(Number)));
  assert.equal(lines.length, 2);
  assert.equal(lines[0].length, 2);
  assert.equal(lines[1].length, 2);
  assert.ok(lines[1][1][1] > lines[0][1][1], "le net inférieur au CA est plus bas sur l'axe");
  assert.match(html, /aria-label="Période à venir"/);
  assert.match(html, />31<\/text>/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
