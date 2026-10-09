import assert from "node:assert/strict";
import { test } from "node:test";
import { labOverlayHtml, labPlatformZip } from "./export";
import { newLabContent } from "./model";
import { createItem, DEFAULT_OVERLAY } from "./overlay";

test("livraison : zip d'un widget par plateforme", () => {
  const widget = { ...newLabContent("widget"), name: "Mon Widget" };
  const se = labPlatformZip(widget, "streamelements");
  assert.equal(se.filename, "mon-widget-streamelements.zip");
  assert.equal(se.label, "Mon Widget — StreamElements");
  assert.equal(String.fromCharCode(se.data[0], se.data[1]), "PK");
  assert.equal(labPlatformZip(widget, "streamlabs").label, "Mon Widget — Streamlabs");
  assert.equal(labPlatformZip({ ...newLabContent("alertbox"), name: "Alertes" }, "streamlabs").contentType, "application/zip");
});

test("livraison : page HTML autonome d'un overlay", () => {
  const widget = newLabContent("widget");
  const widgetId = "00000000-0000-4000-8000-000000000002";
  const base = { ...DEFAULT_OVERLAY, items: [] };
  const text = { ...createItem(base, "text"), z: 1, props: { content: "<b>Salut</b> & co" } };
  const hidden = { ...createItem(base, "shape"), z: 2, hidden: true };
  const image = { ...createItem(base, "image"), z: 3, props: { src: "javascript:alert(1)" } };
  const frame = { ...createItem(base, "widget"), id: "w1", z: 4, widgetId };
  const overlay = { ...newLabContent("overlay"), name: "Scène", overlay: { ...base, items: [frame, hidden, image, text] } };
  const file = labOverlayHtml(overlay, { [widgetId]: widget });
  const html = new TextDecoder().decode(file.data);
  assert.equal(file.filename, "scene-overlay.html");
  assert.match(html, /#scene\{position:relative;width:1920px;height:1080px/);
  assert.match(html, /&lt;b&gt;Salut&lt;\/b&gt; &amp; co/);
  assert.ok(!html.includes("javascript:alert"));
  assert.equal((html.match(/class="layer"/g) ?? []).length, 3);
  // calques dans l'ordre (texte en dessous, widget au-dessus) et message de chargement envoyé au widget
  assert.ok(html.indexOf("Salut") < html.indexOf('data-frame="w1"'));
  assert.match(html, /const loads=\{"w1":/);
});
