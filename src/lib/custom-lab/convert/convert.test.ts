import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "acorn";
import { labPlatformZip } from "../export";
import { newLabContent, parseLabContent } from "../model";
import { convertAlertToStreamlabs } from "./alert";
import { codeHash, convertPackToStreamlabs, modifiedTargets, staleSources } from "./index";

// Alerte Follow StreamElements de référence, sur le modèle du Follow validé sur Streamlabs
const FOLLOW = {
  html: '<div class="stage" id="stage"><div class="card" id="alert"><div id="alertTitle"></div><span id="alertName"></span></div></div>\n<div id="alertData" hidden><span data-var="name">{{name}}</span></div>',
  css: ":root { --accent: {{accent_color}}; }\n.card { width: var(--w); }",
  js: [
    "let SETTINGS = {};",
    "function readVar(key){ const el = document.querySelector('#alertData [data-var=\"' + key + '\"]'); return el ? el.textContent.trim() : ''; }",
    "function refreshSettingsFromFieldData(raw){ SETTINGS = { title: String(raw.alert_title), width: Number(raw.card_width), glitch: raw.glitch_enabled }; }",
    "function showAlert(){ document.getElementById('alertName').textContent = readVar('name') || 'Anonyme'; }",
    "const duration = {{widgetDuration}} * 1000;",
    "const welcome = 'Bienvenue {{name}} !';",
    "window.addEventListener('onWidgetLoad', (obj) => { refreshSettingsFromFieldData(obj.detail.fieldData); showAlert(); });",
  ].join("\n"),
  fields: JSON.stringify({
    alert_title: { type: "text", label: "Titre", value: "Fol_|low" },
    accent_color: { type: "colorpicker", label: "Accent", value: "#FF4D8D" },
    card_width: { type: "slider", label: "Largeur", value: 240, min: 140, max: 800, step: 10 },
    glitch_enabled: { type: "checkbox", label: "Glitch", value: true },
    reset: { type: "button", label: "Réinitialiser" },
  }),
  data: JSON.stringify({ card_width: 320 }),
};
const SETTINGS = { enabled: true, sound: "", volume: 0.5, duration: 8 };

function convertFollow() {
  return convertAlertToStreamlabs(FOLLOW, "follow", SETTINGS, JSON.parse(FOLLOW.fields), { ...Object.fromEntries(Object.entries(JSON.parse(FOLLOW.fields) as Record<string, { value?: unknown }>).map(([k, f]) => [k, f.value])), card_width: 320 });
}

test("Follow : réglages en {champ} dans CONFIG, données dans #alertData, démarrage Streamlabs", () => {
  const result = convertFollow();
  assert.equal(result.target, "follow");
  assert.equal(result.status, "validated");
  const { js, html, css } = result.code;
  // Le code de l'Alert Box Streamlabs reste du JavaScript valide avant comme après le remplacement des {champs}
  parse(js, { ecmaVersion: "latest" });
  const replaced = js.replaceAll("{alert_title}", "Fol_|low").replaceAll("{accent_color}", "#FF4D8D").replaceAll("{card_width}", "320").replaceAll("{glitch_enabled}", "true");
  parse(replaced, { ecmaVersion: "latest" });
  assert.match(js, /const CONFIG = \{/);
  assert.match(js, /"alert_title": "\{alert_title\}"/);
  assert.match(js, /"card_width": Number\("\{card_width\}"\)/);
  assert.match(js, /"glitch_enabled": "\{glitch_enabled\}" === "true"/);
  assert.match(js, /"alert_duration_seconds": 8/);
  assert.ok(!js.includes('"reset"'));
  // Le readVar d'origine est gardé : celui de la conversion est renommé
  assert.match(js, /function readStreamlabsVar\(key\)/);
  assert.match(js, /streamlabsOn\('onWidgetLoad'/);
  assert.match(js, /Number\(CONFIG\.alert_duration_seconds\) \* 1000/);
  assert.match(js, /\('Bienvenue ' \+ readStreamlabsVar\("name"\) \+ ' !'\)|\("Bienvenue " \+ readStreamlabsVar\("name"\) \+ " !"\)/);
  assert.match(js, /getElementById\("stage"\)/);
  assert.ok(!/\{\{/.test(js));
  assert.equal((html.match(/id="alertData"/g) ?? []).length, 1);
  assert.match(html, /<span data-var="name">\{name\}<\/span>/);
  assert.match(css, /--accent: \{accent_color\}/);
  const fields = JSON.parse(result.code.fields);
  assert.equal(fields.alert_title.type, "textfield");
  assert.equal(fields.card_width.steps, 10);
  assert.equal(fields.card_width.value, 320);
  assert.equal(fields.glitch_enabled.type, "dropdown");
  assert.equal(fields.reset, undefined);
  assert.equal(JSON.parse(result.code.data).glitch_enabled, "true");
  assert.ok(result.limitations.some((line) => line.includes("reset")));
});

test("le code que la conversion ne sait pas lire est signalé, jamais présenté comme compatible", () => {
  const broken = convertAlertToStreamlabs({ ...FOLLOW, js: "window.addEventListener('onWidgetLoad', (obj) => {" }, "follow", SETTINGS, {}, {});
  assert.equal(broken.status, "manual");
  assert.match(broken.code.js, /\/\*\nwindow\.addEventListener/);
  const unknown = convertAlertToStreamlabs({ ...FOLLOW, html: "<div>{{mystere}}</div>", js: "SE_API.store.get('x');" }, "follow", SETTINGS, {}, {});
  assert.equal(unknown.status, "manual");
  assert.ok(unknown.manual.some((line) => line.includes("{{mystere}}")));
  assert.ok(unknown.manual.some((line) => line.includes("SE_API")));
});

test("types d'alertes : variables et statut selon la règle du type", () => {
  const sub = convertAlertToStreamlabs({ ...FOLLOW, html: "<b id=\"x\">{{name}} · {{amount}} mois · {{tier}}</b>", css: "", js: "" }, "sub", SETTINGS, {}, {});
  assert.equal(sub.status, "untested");
  assert.match(sub.code.html, /\{name\} · \{months\} mois · </);
  assert.ok(sub.limitations.some((line) => line.includes("{{tier}}")));
  assert.equal(convertAlertToStreamlabs({ ...FOLLOW, css: "", js: "" }, "cheer", SETTINGS, {}, {}).target, "bits");
});

test("pack : seule la variante Streamlabs change, avec réglages et rapport", () => {
  const content = newLabContent("alertbox");
  content.variants.streamelements.alerts.follow = FOLLOW;
  content.variants.streamelements.settings = JSON.stringify({ alerts: { follow: { enabled: true, sound: "", volume: 0.3, duration: 6 } } });
  const before = JSON.stringify(content.variants.streamelements);
  assert.deepEqual(modifiedTargets(content, ["follow"]), []);
  const converted = convertPackToStreamlabs(content, ["follow", "gift", "community"], new Date("2026-10-10T10:00:00Z"));
  assert.equal(JSON.stringify(converted.variants.streamelements), before);
  assert.match(converted.variants.streamlabs.alerts.follow.js, /"alert_duration_seconds": 6/);
  assert.equal(JSON.parse(converted.variants.streamlabs.settings).alerts.follow.volume, 0.3);
  const report = converted.conversions!.streamlabs!;
  assert.equal(report.alerts.find((a) => a.source === "follow")!.status, "validated");
  assert.equal(report.alerts.find((a) => a.source === "community")!.status, "manual");
  // ZIP Streamlabs : README avec la checklist de test et le statut de chaque alerte
  const readme = new TextDecoder().decode(labPlatformZip(converted, "streamlabs").data);
  assert.match(readme, /Tester chaque alerte dans Streamlabs/);
  assert.match(readme, /follow\/ \(depuis follow\) : validé sur Streamlabs/);
  assert.match(readme, /giftsub\/ \(depuis gift\) : converti, NON TESTÉ sur Streamlabs/);
  // Rapport conservé à l'enregistrement
  assert.deepEqual(parseLabContent(converted).conversions, converted.conversions);
  assert.deepEqual(modifiedTargets(converted, ["follow"]), []);
  // Modification à la main côté Streamlabs, puis côté StreamElements
  converted.variants.streamlabs.alerts.follow = { ...converted.variants.streamlabs.alerts.follow, css: "/* retouche */" };
  assert.deepEqual(modifiedTargets(converted, ["follow"]), ["follow"]);
  assert.deepEqual(staleSources(converted), []);
  converted.variants.streamelements.alerts.follow = { ...FOLLOW, css: "" };
  assert.deepEqual(staleSources(converted), ["follow"]);
  assert.notEqual(codeHash(FOLLOW), codeHash({ ...FOLLOW, css: "" }));
});
