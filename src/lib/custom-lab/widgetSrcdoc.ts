// Port verbatim de buildWidgetSrcdoc / substituteFields (public/app.js) :
// construit le document HTML complet chargé dans l'iframe d'aperçu, avec son
// pont postMessage vers le parent (console, SE_API, réception d'événements).
// Fonction pure, réutilisée à l'identique pour l'aperçu widget plein écran ET
// pour chaque item widget/alerte posé sur le canevas d'un overlay (Phase 3).

import { PLATFORM_STREAM_ELEMENTS, type Platform } from "./platformEvents";
import { ALERTBOX_RUNTIME_SOURCE } from "./alertbox";
import { CHATBOX_RUNTIME, GOAL_RUNTIME, isGoalWidget, STREAMLABS_SETTINGS, type StreamlabsWidget } from "./streamlabs-widgets";

export interface WidgetBundle {
  html: string;
  css: string;
  js: string;
}

export interface BuildSrcdocOptions {
  checkerClass?: string;
  themeClass?: string;
  platform?: Platform;
  transparent?: boolean;
  // Widget natif Streamlabs ciblé : réglages natifs d'aperçu ; chat (messages rendus avec #chatlist_item) et objectifs simulés
  streamlabsWidget?: StreamlabsWidget;
  // AlertBox StreamElements : réglages natifs (alertbox.json) et code de
  // chaque alerte avec ses valeurs de champs. Présent = le document n'exécute
  // pas `bundle` mais l'hôte simulé, qui affiche chaque alerte dans sa propre
  // iframe (cf. alertboxRuntime.js).
  alertbox?: {
    config: unknown;
    // Défaut : StreamElements (Streamlabs : variables et cycle de vie propres)
    platform?: Platform;
    codes: Partial<Record<string, WidgetBundle & { values: Record<string, unknown> }>>;
  };
}

export function substituteFields(source: string, values: Record<string, unknown>): string {
  let result = source;
  for (const [key, value] of Object.entries(values)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, "g"), String(value));
    result = result.replaceAll(`{${key}}`, String(value));
  }
  return result;
}

export function buildWidgetSrcdoc(
  bundle: WidgetBundle,
  values: Record<string, unknown>,
  { checkerClass = "", themeClass = "", platform = PLATFORM_STREAM_ELEMENTS, transparent = false, alertbox, streamlabsWidget }: BuildSrcdocOptions = {}
): string {
  const nativeSettings = streamlabsWidget ? STREAMLABS_SETTINGS[streamlabsWidget] : undefined;
  if (nativeSettings) values = { ...nativeSettings, ...values };
  const html = substituteFields(bundle.html, values);
  const css = substituteFields(bundle.css, values);
  const js = substituteFields(bundle.js, values);
  const toScriptJson = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c");
  const executableJs = toScriptJson(js);

  // AlertBox : ce document n'affiche rien lui-même, chaque alerte vit dans sa
  // propre iframe créée par l'hôte, avec les variables de l'alerte.
  const isAlertbox = alertbox != null;
  const headCss = isAlertbox
    ? "#alertbox-stage{position:fixed;inset:0;pointer-events:none}.alertbox-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:transparent}"
    : css;
  const bodyHtml = isAlertbox ? `<div id="alertbox-stage"></div>` : html;
  const hostCodes = isAlertbox
    ? Object.fromEntries(
        Object.entries(alertbox.codes).flatMap(([type, code]) =>
          code
            ? [[type, { html: substituteFields(code.html, code.values), css: substituteFields(code.css, code.values), js: substituteFields(code.js, code.values), fieldData: code.values }]]
            : []
        )
      )
    : {};
  const runWidget = isAlertbox
    ? `${ALERTBOX_RUNTIME_SOURCE}
  AlertboxRuntime.createHost({ codes: ${toScriptJson(hostCodes)}, config: ${toScriptJson(alertbox.config)}, platform: ${toScriptJson(alertbox.platform ?? PLATFORM_STREAM_ELEMENTS)}, stage: document.getElementById("alertbox-stage") });`
    : `try { (new Function(${executableJs}))(); } catch (error) { console.error(error.stack || error.message); }`;

  // Sur le canevas d'overlay (Phase 3), chaque widget est un item parmi
  // d'autres posés sur le damier commun : son iframe ne doit jamais peindre
  // sa propre surface, sinon on voit un rectangle opaque plutôt que le
  // widget composité sur le fond commun.
  const surfaceCss = transparent
    ? `html.se-lab-preview, html.se-lab-preview body { background: transparent !important; }`
    : `html.se-lab-preview { background: #11141a !important; }
  html.se-lab-preview.se-lab-light { background: #f2f4f7 !important; }
  html.se-lab-preview body { background: transparent !important; }
  html.se-lab-preview.se-lab-checker {
    background-color: #15171c !important;
    background-image:
      linear-gradient(45deg, #252932 25%, transparent 25%),
      linear-gradient(-45deg, #252932 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #252932 75%),
      linear-gradient(-45deg, transparent 75%, #252932 75%) !important;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0 !important;
    background-size: 20px 20px !important;
  }
  html.se-lab-preview.se-lab-checker.se-lab-light {
    background-color: #f4f6f9 !important;
    background-image:
      linear-gradient(45deg, #dfe3e9 25%, transparent 25%),
      linear-gradient(-45deg, #dfe3e9 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #dfe3e9 75%),
      linear-gradient(-45deg, transparent 75%, #dfe3e9 75%) !important;
  }`;

  return `<!doctype html>
<html class="se-lab-preview${transparent ? "" : checkerClass}${transparent ? "" : themeClass}"><head><meta charset="utf-8"><style>${headCss}</style>
<style id="se-lab-surface">
  ${surfaceCss}
</style><script src="/streamerlab/jquery.min.js"></script></head>
<body>${bodyHtml}
<script>
(() => {
  const pending = new Map();
  let callId = 0;
  const send = (kind, payload = {}) => parent.postMessage({ source: "se-widget", kind, ...payload }, "*");
  const request = (method, args = []) => new Promise((resolve, reject) => {
    const id = String(++callId);
    pending.set(id, { resolve, reject });
    send("se-api-request", { id, method, args });
  });
  const serialize = (value) => {
    if (typeof value === "string") return value;
    try { return JSON.stringify(value); } catch { return String(value); }
  };
  for (const level of ["log", "info", "warn", "error"]) {
    const original = console[level].bind(console);
    console[level] = (...args) => {
      send("console", { level, args: args.map(serialize) });
      original(...args);
    };
  }
  window.addEventListener("error", (event) => send("console", { level: "error", args: [event.message] }));
  window.addEventListener("unhandledrejection", (event) => send("console", { level: "error", args: [serialize(event.reason)] }));
  window.addEventListener("message", (message) => {
    const data = message.data;
    if (!data || data.source !== "se-lab") return;
    if (data.kind === "dispatch") {
      if (data.eventType === "onLoad" && data.detail?.custom_json) {
        window.fieldData = data.detail.custom_json;
        window.customFields = data.detail.custom_json;
      }
      const eventTarget = data.eventTarget === "document" ? document : window;
      const detail = window.__SL_CHATBOX__ ? window.__SL_CHATBOX__(data.eventType, data.detail) : data.detail;
      eventTarget.dispatchEvent(new CustomEvent(data.eventType, { detail }));
      if (window.__SL_AFTER__) window.__SL_AFTER__(data.eventType, detail);
    }
    if (data.kind === "se-api-response") {
      const promise = pending.get(data.id);
      if (!promise) return;
      pending.delete(data.id);
      data.error ? promise.reject(new Error(data.error)) : promise.resolve(data.value);
    }
  });
  window.__WIDGET_PLATFORM__ = ${JSON.stringify(platform)};
  if (window.__WIDGET_PLATFORM__ === "streamelements") window.SE_API = {
    store: {
      get: (key) => request("store.get", [key]),
      set: (key, value) => request("store.set", [key, value])
    },
    counters: { get: (key) => request("counters.get", [key]) },
    sanitize: (text) => Promise.resolve(text),
    cheerFilter: (text) => Promise.resolve(text),
    getOverlayStatus: () => Promise.resolve({ isEditorMode: true, muted: false }),
    setField: (key, value, shouldReload = true) => send("set-field", { key, value, shouldReload }),
    resumeQueue: () => send("queue-resume")
  };
  ${streamlabsWidget === "chatbox" ? CHATBOX_RUNTIME : isGoalWidget(streamlabsWidget) ? GOAL_RUNTIME : ""}
  ${runWidget}
})();
</script></body></html>`;
}
