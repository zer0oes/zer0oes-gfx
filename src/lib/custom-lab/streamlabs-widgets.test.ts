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
  const doc = buildWidgetSrcdoc(CHATBOX_TEMPLATE, {}, { platform: "streamlabs", chatbox: true });
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
