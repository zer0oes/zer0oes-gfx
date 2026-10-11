import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_OVERLAY, MAX_OVERLAY_ITEMS, createItem, itemLabel, itemsBounds, parseOverlay, snapGuide, snapPosition, snapTargets } from "./overlay";

test("overlay : un nouveau calque est centré, au-dessus des autres", () => {
  const first = createItem(DEFAULT_OVERLAY, "shape");
  assert.equal(first.x, (1920 - 320) / 2);
  assert.equal(first.y, (1080 - 200) / 2);
  assert.equal(first.z, 1);
  const second = createItem({ ...DEFAULT_OVERLAY, items: [first] }, "text");
  assert.equal(second.z, 2);
  assert.equal(itemLabel(second), "Texte");
  assert.equal(itemLabel({ ...second, name: "  Titre  " }), "Titre");
});

test("overlay : aimantation sur les bords, centres et autres calques", () => {
  const data = { ...DEFAULT_OVERLAY, items: [{ ...createItem(DEFAULT_OVERLAY, "shape"), id: "a", x: 100, w: 200 }] };
  const targets = snapTargets(data, "x", "b");
  assert.ok(targets.includes(960) && targets.includes(100) && targets.includes(300));
  assert.deepEqual(snapPosition(305, 50, targets, 8), { pos: 300, guide: 300 });
  // centre du calque (len / 2) aligné sur le centre de la scène
  assert.deepEqual(snapPosition(932, 50, targets, 8), { pos: 935, guide: 960 });
  assert.deepEqual(snapPosition(500, 50, targets, 8), { pos: 500, guide: null });
  // le calque déplacé et les calques masqués ne servent pas de repère
  assert.ok(!snapTargets(data, "x", "a").includes(100));
});

test("overlay : lecture tolérante et bornée", () => {
  const parsed = parseOverlay({
    width: 99999,
    height: "x",
    items: [
      { type: "text", id: "ok-1", x: 10.4, y: -99999, w: 1, props: { content: "A" } },
      { type: "script", id: "bad" },
      { type: "widget", widgetId: "pas-un-uuid", props: [] },
      null,
    ],
  });
  assert.equal(parsed.width, 7680);
  assert.equal(parsed.height, 1080);
  assert.equal(parsed.items.length, 2);
  assert.deepEqual([parsed.items[0].x, parsed.items[0].y, parsed.items[0].w], [10, -1080, 8]);
  assert.equal(parsed.items[1].widgetId, undefined);
  assert.deepEqual(parsed.items[1].props, {});
  assert.equal(parseOverlay({ items: Array.from({ length: 300 }, () => ({ type: "shape" })) }).items.length, MAX_OVERLAY_ITEMS);
  assert.deepEqual(parseOverlay(null), { ...DEFAULT_OVERLAY, items: [] });
});

test("overlay : groupes et repères conservés, valeurs invalides écartées", () => {
  const parsed = parseOverlay({
    width: 1920, height: 1080,
    items: [{ type: "text", id: "a", group: "g-1" }, { type: "shape", id: "b", group: "<script>" }],
    guides: { x: [960, -5, "x", 4000], y: [540.4] },
  });
  assert.equal(parsed.items[0].group, "g-1");
  assert.equal(parsed.items[1].group, undefined);
  assert.deepEqual(parsed.guides, { x: [960], y: [540] });
  assert.equal(parseOverlay({ guides: { x: [], y: [] } }).guides, undefined);
});

test("overlay : repères des règles, aimantation et rectangle englobant", () => {
  const data = { width: 1000, height: 500, items: [], guides: { x: [300], y: [] } };
  assert.ok(snapTargets(data, "x", [], true).includes(300));
  assert.ok(!snapTargets(data, "x", []).includes(300));
  assert.equal(snapGuide(497, [500], 8), 500);
  assert.equal(snapGuide(480, [500], 8), 480);
  const a = createItem(data, "shape", { x: 10, y: 20, w: 100, h: 50 });
  const b = createItem(data, "shape", { x: 200, y: 5, w: 10, h: 10 });
  assert.deepEqual(itemsBounds([a, b]), { x: 10, y: 5, w: 200, h: 65 });
});
