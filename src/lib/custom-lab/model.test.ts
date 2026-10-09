import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldValues, newLabContent, parseLabContent, parseLabSize } from "./model";
import { buildPlatformExport, buildAlertboxExport } from "./widgetExport";
import { alertboxAlerts, normalizeAlertboxConfig } from "./alertbox";
import { buildWidgetSrcdoc } from "./widgetSrcdoc";
import { createZip } from "./zip";

test("les créations gardent deux variantes indépendantes, sans métadonnées importées", () => {
  const content = newLabContent();
  content.variants.streamlabs.code.html = "Streamlabs";
  assert.notEqual(content.variants.streamelements.code.html, "Streamlabs");
  const parsed = parseLabContent({ ...content, id: "foreign", token: "secret" });
  assert.equal("token" in parsed, false);
  assert.equal("id" in parsed, false);
  assert.deepEqual(parsed, content);
});

test("JSON mal formé, champs dangereux, codes incomplets et projets trop volumineux sont refusés", () => {
  const content = newLabContent();
  assert.throws(() => parseLabContent({ ...content, name: "" }));
  content.variants.streamlabs.code.fields = '[]';
  assert.throws(() => parseLabContent(content));
  content.variants.streamlabs.code.fields = '{"__proto__":{"type":"text"}}';
  assert.throws(() => parseLabContent(content));
  content.variants.streamlabs.code.fields = '{}';
  content.variants.streamlabs.code.data = '{';
  assert.throws(() => parseLabContent(content));
  content.variants.streamlabs.code.data = '{}';
  content.variants.streamlabs.code.js = "x".repeat(1_000_001);
  assert.throws(() => parseLabContent(content));
});

test("les valeurs de Data sont appliquées et les exports gardent les paramètres", () => {
  const code = newLabContent().variants.streamelements.code;
  code.data = '{"accent":"#ff0000"}';
  const values = fieldValues(code);
  assert.equal(values.accent, "#ff0000");
  for (const platform of ["streamelements", "streamlabs"] as const) {
    const exported = buildPlatformExport({ ...code, fields: JSON.parse(code.fields) }, values, platform);
    assert.match(exported.files["fields.json"], /#ff0000/);
    assert.equal(exported.platform, platform);
    assert.equal(new DataView(createZip(exported.files).buffer).getUint32(0, true), 0x04034b50);
  }
});

test("les packs d'alertes exportent un dossier par alerte de chaque plateforme", () => {
  const content = parseLabContent(newLabContent("alertbox"));
  for (const platform of ["streamelements", "streamlabs"] as const) {
    const variant = content.variants[platform];
    const codes = Object.fromEntries(Object.entries(variant.alerts).map(([type, code]) => [type, { ...code, fields: {}, values: {} }]));
    const exported = buildAlertboxExport(codes, normalizeAlertboxConfig({}, platform), platform);
    for (const { type } of alertboxAlerts(platform)) assert.ok(exported.files[`${type}/widget.html`]);
    const copy = structuredClone(content);
    delete copy.variants[platform].alerts.follow;
    assert.throws(() => parseLabContent(copy));
  }
});

test("le code JS contenant une fermeture script reste dans la chaîne exécutable", () => {
  const source = buildWidgetSrcdoc({ html: "<p>Widget</p>", css: "", js: 'console.log("</script>")' }, {});
  assert.ok(!source.includes('console.log("</script>")'));
  assert.match(source, /\\u003c/);
});

test("taille d'un widget ou d'un pack d'alertes : valeur par défaut et bornes", () => {
  assert.deepEqual(newLabContent("widget").size, { width: 600, height: 300 });
  assert.deepEqual(newLabContent("alertbox").size, { width: 800, height: 600 });
  assert.equal(newLabContent("overlay").size, undefined);
  assert.deepEqual(parseLabSize({ width: 99999, height: 1.6 }, "widget"), { width: 7680, height: 20 });
  assert.deepEqual(parseLabSize("x", "alertbox"), { width: 800, height: 600 });
  const { size, ...old } = newLabContent("widget");
  assert.ok(size);
  assert.deepEqual(parseLabContent(old).size, { width: 600, height: 300 });
});
