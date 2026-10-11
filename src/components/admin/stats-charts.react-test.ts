import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { summarize, type StatEvent } from "../../lib/stats";
import { VisitsChart } from "./stats-charts";

test("les chiffres de production correspondent aux barres et au tableau, sans superposition", () => {
  const counts = [[5, 3, 16], [6, 11, 68], [7, 7, 17], [8, 5, 14], [9, 4, 4], [10, 2, 2], [11, 7, 7]];
  const events: StatEvent[] = counts.flatMap(([day, visitors, views]) => Array.from({ length: views }, (_, i) => ({
    createdAt: `2026-10-${String(day).padStart(2, "0")}T12:00:00Z`,
    kind: "vue" as const, path: "/", visitor: String(i % visitors),
  })));
  const summary = summarize(events, { start: "2026-10-01", end: "2026-10-31" });
  assert.equal(summary.visitors, 39);
  assert.equal(summary.views, 128);
  const html = renderToStaticMarkup(createElement(VisitsChart, { points: summary.points }));
  const rects = [...html.matchAll(/<rect\b[^>]*>/g)].map(([tag]) => Object.fromEntries(
    [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
  ));
  for (const [day, visitors, views] of counts) {
    const visitorBar = rects.find((r) => r["aria-label"] === `${day} oct. : ${visitors} visiteurs`)!;
    const viewBar = rects.find((r) => r["aria-label"] === `${day} oct. : ${views} pages vues`)!;
    assert.ok(visitorBar);
    assert.ok(viewBar);
    assert.notEqual(visitorBar.fill, viewBar.fill);
    assert.ok(Number(visitorBar.x) + Number(visitorBar.width) < Number(viewBar.x), "les deux séries restent visibles, même à valeurs égales");
    assert.ok(Math.abs(Number(visitorBar.height) / Number(viewBar.height) - visitors / views) < 1e-10);
    assert.ok(Math.abs(Number(viewBar.height) / 190 - views / 100) < 1e-10);
    assert.equal(Number(visitorBar.y) + Number(visitorBar.height), Number(viewBar.y) + Number(viewBar.height));
    assert.match(html, new RegExp(`<th[^>]*>${day} oct\\.</th><td[^>]*>${visitors}</td><td[^>]*>${views}</td>`));
    assert.ok(html.includes(`data-chart-value="${visitors} visiteurs · ${views} pages vues"`));
  }
});

test("le lien de chaque jour conserve sa date et la sélection, y compris sans visite", () => {
  const points = summarize([], { start: "2026-10-05", end: "2026-10-06" }).points;
  const html = renderToStaticMarkup(createElement(VisitsChart, {
    points, dayHref: "/admin/statistiques?periode=mois&ref=2026-10", selectedDay: "2026-10-06",
  }));
  assert.match(html, /jour=2026-10-05/);
  assert.match(html, /aria-current="date"[^>]*href="[^"]*jour=2026-10-06"/);
  assert.match(html, /data-chart-value="0 visiteurs · 0 pages vues"/);
});
