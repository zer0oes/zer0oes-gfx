import assert from "node:assert/strict";
import { test } from "node:test";
import { labPlatformZip } from "./export";
import { newLabContent, parseLabContent } from "./model";
import { CHATBOX_TEMPLATE, streamlabsWidgetLabel, streamlabsWidgetReadme } from "./streamlabs-widgets";
import { buildWidgetSrcdoc } from "./widgetSrcdoc";

test("widget Streamlabs ciblé : conservé pour un widget, ignoré sinon", () => {
  assert.equal(parseLabContent({ ...newLabContent("widget"), streamlabsWidget: "chatbox" }).streamlabsWidget, "chatbox");
  assert.equal(parseLabContent({ ...newLabContent("widget"), streamlabsWidget: "custom" }).streamlabsWidget, undefined);
  assert.equal(parseLabContent({ ...newLabContent("widget"), streamlabsWidget: "inconnu" }).streamlabsWidget, undefined);
  assert.equal(parseLabContent({ ...newLabContent("alertbox"), streamlabsWidget: "chatbox" }).streamlabsWidget, undefined);
  assert.equal(streamlabsWidgetLabel(undefined), "Widget personnalisé");
  assert.equal(streamlabsWidgetLabel("chatbox"), "Fenêtre de chat");
});

test("Fenêtre de chat : aperçu simulé et guide d'export", () => {
  const doc = buildWidgetSrcdoc(CHATBOX_TEMPLATE, {}, { platform: "streamlabs", streamlabsWidget: "chatbox" });
  assert.match(doc, /window\.__SL_CHATBOX__/);
  assert.match(doc, /font-size: 16px;/);
  assert.match(doc, /id="chatlist_item"/);
  // sans Fenêtre de chat : pas de simulation, variables natives laissées telles quelles
  assert.doesNotMatch(buildWidgetSrcdoc(CHATBOX_TEMPLATE, {}, { platform: "streamlabs" }), /window\.__SL_CHATBOX__ =/);
  assert.equal(streamlabsWidgetReadme("custom"), null);
  assert.match(streamlabsWidgetReadme("chatbox")!, /Fenêtre de chat/);

  const widget = { ...newLabContent("widget"), name: "Chat", streamlabsWidget: "chatbox" as const };
  widget.variants.streamlabs.code = { ...CHATBOX_TEMPLATE };
  const zip = new TextDecoder().decode(labPlatformZip(widget, "streamlabs").data);
  assert.match(zip, /Export Streamlabs — Fenêtre de chat/);
  assert.doesNotMatch(new TextDecoder().decode(labPlatformZip(widget, "streamelements").data), /Fenêtre de chat/);
});

test("conversion vers la Fenêtre de chat : les messages Streamlabs arrivent au code StreamElements", async () => {
  const { convertWidgetToStreamlabs } = await import("./convert/widget");
  const source = {
    html: '<div id="chat"></div>',
    css: "",
    js: "window.addEventListener('onEventReceived', (obj) => { if (obj.detail.listener !== 'message') return; window.received.push(obj.detail.event.data.displayName + ': ' + obj.detail.event.data.text + ' ' + obj.detail.event.data.displayColor); });",
    fields: "{}",
    data: "{}",
  };
  const result = convertWidgetToStreamlabs(source, {}, {}, "chatbox");
  assert.match(result.code.html, /id="log"[^>]*display:none/);
  assert.match(result.code.html, /id="chatlist_item"/);
  assert.ok(!result.manual.some((line) => /messages du chat/.test(line)));
  assert.ok(result.converted.some((line) => /Fenêtre de chat/.test(line)));

  // Exécution du code converti avec un document simulé
  const doc = new EventTarget();
  const received: string[] = [];
  const run = new Function("document", "window", result.code.js);
  run(doc, { received, setTimeout: () => 0, addEventListener: () => {} });
  doc.dispatchEvent(Object.assign(new Event("onEventReceived"), { detail: { command: "PRIVMSG", body: "Salut <3", from: "astro", messageId: "m1", tags: { "display-name": "Astro", color: "#ff00aa", badges: "moderator/1" } } }));
  assert.deepEqual(received, ["Astro: Salut <3 #ff00aa"]);

  // Widget personnalisé : le chat reste signalé comme non pris en charge
  const custom = convertWidgetToStreamlabs(source, {}, {}, "custom");
  assert.ok(custom.manual.some((line) => /messages du chat/.test(line)));
  assert.doesNotMatch(custom.code.html, /chatlist_item/);
});

test("codes de base Streamlabs : modèles par type, code non modifié reconnu", async () => {
  const { STREAMLABS_TEMPLATES } = await import("./streamlabs-templates");
  const { isStreamlabsTemplate } = await import("./streamlabs-widgets");
  const example = newLabContent("widget").variants.streamlabs.code;
  for (const type of ["chatbox", "eventlist", "viewer-count", "donation-goal", "follower-goal", "subscriber-goal", "bit-goal"] as const) {
    assert.ok(STREAMLABS_TEMPLATES[type]?.html.trim(), type);
    assert.equal(isStreamlabsTemplate(STREAMLABS_TEMPLATES[type]!, example), true);
  }
  assert.match(STREAMLABS_TEMPLATES["donation-goal"]!.js, /goalLoad/);
  assert.match(STREAMLABS_TEMPLATES.eventlist!.html, /eventlist_item/);
  assert.equal(isStreamlabsTemplate(example, example), true);
  assert.equal(isStreamlabsTemplate({ ...example, js: "console.log('modifié')" }, example), false);
  // Objectif : réglages d'aperçu et simulation goalLoad / goalEvent
  const doc = buildWidgetSrcdoc(STREAMLABS_TEMPLATES["follower-goal"]!, {}, { platform: "streamlabs", streamlabsWidget: "follower-goal" });
  assert.match(doc, /height: 48px;/);
  assert.match(doc, /goalLoad/);
  assert.match(doc, /window\.__SL_AFTER__ =/);
});
