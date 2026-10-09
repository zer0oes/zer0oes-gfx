import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldValues, jsonObject, newLabContent } from "./model";
import { widgetInstance } from "./widget-instance";

test("réglages d'un calque widget : appliqués à sa plateforme sans modifier le modèle", () => {
  const widget = newLabContent("widget");
  const instance = widgetInstance(widget, { widgetOverrides: { streamelements: { fields: { accent: "#ff0000" } } } }, "streamelements");
  assert.equal(fieldValues(instance.variants.streamelements.code).accent, "#ff0000");
  // autre plateforme et modèle inchangés
  assert.equal(fieldValues(instance.variants.streamlabs.code).accent, "#6d28d9");
  assert.equal(fieldValues(widget.variants.streamelements.code).accent, "#6d28d9");
  // sans surcharge : mêmes valeurs que le modèle
  assert.deepEqual(fieldValues(widgetInstance(widget, {}, "streamelements").variants.streamelements.code), fieldValues(widget.variants.streamelements.code));
});

test("réglages d'un calque pack d'alertes : par alerte et réglages de l'AlertBox", () => {
  const pack = newLabContent("alertbox");
  const instance = widgetInstance(pack, { widgetOverrides: { streamlabs: { alerts: { follow: { accent: "#00ff00" } }, settings: { alerts: {} } } } }, "streamlabs");
  assert.equal(fieldValues(instance.variants.streamlabs.alerts.follow).accent, "#00ff00");
  assert.equal(fieldValues(instance.variants.streamlabs.alerts.subscriber ?? instance.variants.streamlabs.alerts[Object.keys(instance.variants.streamlabs.alerts)[1]]).accent, "#6d28d9");
  assert.deepEqual(jsonObject(instance.variants.streamlabs.settings), { alerts: {} });
  assert.equal(pack.variants.streamlabs.settings, "{}");
});
