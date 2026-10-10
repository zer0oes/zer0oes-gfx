// Document HTML d'aperçu d'une création (widget ou pack d'alertes) pour une plateforme, dans une iframe isolée.
// Partagé par l'éditeur de widgets et l'éditeur d'overlays.
import { normalizeAlertboxConfig } from "./alertbox";
import { fieldValues, jsonObject, parseFields } from "./model";
import { buildStreamlabsLoadDetail, type Platform } from "./platformEvents";
import type { FieldDefinitions, LabContent } from "./types";
import { buildWidgetSrcdoc } from "./widgetSrcdoc";

// Le code créé n'accède ni aux cookies ni au réseau de l'admin. Cette CSP précède tout HTML utilisateur ;
// les frames AlertBox héritent de ces règles.
const POLICY = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'self'; style-src 'unsafe-inline' https:; img-src https: data:; media-src https: data:; font-src https: data:; frame-src 'self' about:; connect-src 'none'; form-action 'none'; base-uri 'none'";

export type LabPreview = { source: string; values: Record<string, unknown>; fields: FieldDefinitions; error: string };

export function buildLabPreview(content: LabContent, platform: Platform, options: { alertType?: string; checker?: boolean; transparent?: boolean } = {}): LabPreview {
  try {
    const v = content.variants[platform];
    const active = content.kind === "alertbox" ? v.alerts[options.alertType ?? "follow"] : v.code;
    const values = fieldValues(active);
    const fields = parseFields(active.fields);
    const codes = Object.fromEntries(Object.entries(v.alerts).map(([type, c]) => [type, { ...c, values: fieldValues(c) }]));
    let source = buildWidgetSrcdoc(active, values, {
      platform,
      checkerClass: options.checker ? " se-lab-checker" : "",
      transparent: options.transparent === true,
      streamlabsWidget: content.kind === "widget" && platform === "streamlabs" ? content.streamlabsWidget : undefined,
      ...(content.kind === "alertbox" ? { alertbox: { codes, config: normalizeAlertboxConfig(jsonObject(v.settings), platform), platform } } : {}),
    });
    source = source.replace("<head>", `<head><meta http-equiv="Content-Security-Policy" content="${POLICY}"><meta name="referrer" content="no-referrer">`);
    return { source, values, fields, error: "" };
  } catch (error) {
    return { source: "", values: {}, fields: {}, error: error instanceof Error ? error.message : "JSON invalide." };
  }
}

// Message de chargement envoyé au widget une fois l'iframe prête (onWidgetLoad / onLoad)
export function labLoadMessage(preview: LabPreview, platform: Platform) {
  const session = { data: {}, count: 0 };
  const detail = platform === "streamlabs"
    ? buildStreamlabsLoadDetail(preview.fields, preview.values, session)
    : { fieldData: preview.values, session, recents: [], currency: { code: "EUR", symbol: "€" }, channel: { username: "zer0oes-demo" } };
  return { source: "se-lab", kind: "dispatch", eventType: platform === "streamlabs" ? "onLoad" : "onWidgetLoad", eventTarget: platform === "streamlabs" ? "document" : "window", detail };
}

export function labEventMessage(detail: unknown, platform: Platform, eventType = "onEventReceived") {
  return { source: "se-lab", kind: "dispatch", eventType, eventTarget: platform === "streamlabs" ? "document" : "window", detail };
}
