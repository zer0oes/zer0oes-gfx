import assert from "node:assert/strict";
import { test } from "node:test";
import { codePlatforms, overlayPlatforms } from "./compatibility";
import { newLabContent } from "./model";

test("compatibilité : plateformes dont le code est rempli (code d'exemple non compté)", () => {
  const widget = newLabContent("widget");
  assert.deepEqual(codePlatforms(widget), []);
  widget.variants.streamelements.code = { ...widget.variants.streamelements.code, html: "<div>Mon widget</div>" };
  assert.deepEqual(codePlatforms(widget), ["streamelements"]);
  widget.variants.streamlabs.code = { ...widget.variants.streamlabs.code, html: " ", css: "", js: "" };
  assert.deepEqual(codePlatforms(widget), ["streamelements"]);
  widget.variants.streamlabs.code = { ...widget.variants.streamlabs.code, js: "document.title = 'x';" };
  assert.deepEqual(codePlatforms(widget), ["streamelements", "streamlabs"]);

  const pack = newLabContent("alertbox");
  assert.deepEqual(codePlatforms(pack), []);
  pack.variants.streamlabs.alerts.follow = { ...pack.variants.streamlabs.alerts.follow, css: "#alert { color: red; }" };
  assert.deepEqual(codePlatforms(pack), ["streamlabs"]);
  assert.deepEqual(codePlatforms(newLabContent("overlay")), []);
});

test("compatibilité d'un overlay : plateformes communes à ses widgets", () => {
  const of: Record<string, ("streamelements" | "streamlabs")[]> = { a: ["streamelements", "streamlabs"], b: ["streamelements"] };
  assert.deepEqual(overlayPlatforms(["a", "b"], (id) => of[id]), ["streamelements"]);
  assert.deepEqual(overlayPlatforms(["a"], (id) => of[id]), ["streamelements", "streamlabs"]);
  assert.deepEqual(overlayPlatforms([], (id) => of[id]), ["streamelements", "streamlabs"]);
});

test("compatibilité : un code de base Streamlabs (Fenêtre de chat, objectif…) ne compte pas", async () => {
  const { STREAMLABS_TEMPLATES } = await import("./streamlabs-templates");
  const widget = newLabContent("widget");
  widget.variants.streamelements.code = { ...widget.variants.streamelements.code, html: "<div>Chat</div>" };
  widget.variants.streamlabs.code = { ...STREAMLABS_TEMPLATES.chatbox! };
  assert.deepEqual(codePlatforms(widget), ["streamelements"]);
  widget.variants.streamlabs.code = { ...STREAMLABS_TEMPLATES.chatbox!, css: "#log { color: red; }" };
  assert.deepEqual(codePlatforms(widget), ["streamelements", "streamlabs"]);
});
