import { alertboxAlerts } from "./alertbox";
import { DEFAULT_OVERLAY, parseOverlay } from "./overlay";
import type { LabCode, LabContent, LabConversion, LabSize, LabVariant, FieldDefinitions } from "./types";
import { isStreamlabsWidget } from "./streamlabs-widgets";
import { STREAMLABS_ALERT_TEMPLATE } from "./streamlabs-templates";

export const LAB_MAX_BYTES = 2 * 1024 * 1024;
export const LAB_PLATFORMS = ["streamelements", "streamlabs"] as const;
export const CODE_FILES = ["html", "css", "js", "fields", "data"] as const;
export const validLabId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export function jsonObject(source: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(source);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Le JSON doit être un objet.");
  return parsed as Record<string, unknown>;
}

export function parseFields(source: string): FieldDefinitions {
  const fields = jsonObject(source);
  for (const [key, value] of Object.entries(fields)) {
    if (["__proto__", "constructor", "prototype"].includes(key) || !value || typeof value !== "object" || Array.isArray(value) || typeof (value as Record<string, unknown>).type !== "string") throw new Error(`Champ invalide : ${key}`);
  }
  return fields as FieldDefinitions;
}

export function fieldValues(code: LabCode) {
  const defaults = Object.fromEntries(Object.entries(parseFields(code.fields)).map(([key, field]) => [key, field.value]));
  return { ...defaults, ...jsonObject(code.data) };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Document invalide.");
  return value as Record<string, unknown>;
}

function parseCode(raw: unknown): LabCode {
  const code = object(raw);
  const result = Object.fromEntries(CODE_FILES.map((key) => {
    const value = code[key];
    if (typeof value !== "string" || value.length > 1_000_000) throw new Error(`Fichier ${key} invalide ou trop volumineux.`);
    return [key, value];
  })) as LabCode;
  parseFields(result.fields);
  jsonObject(result.data);
  return result;
}

export function parseLabContent(raw: unknown): LabContent {
  if (new TextEncoder().encode(JSON.stringify(raw)).byteLength > LAB_MAX_BYTES) throw new Error("Le projet dépasse 2 Mo.");
  const input = object(raw);
  if (input.description !== undefined && (typeof input.description !== "string" || input.description.length > 500)) throw new Error("Description invalide (500 caractères maximum).");
  if (typeof input.name !== "string" || !input.name.trim() || input.name.length > 120) throw new Error("Nom requis (120 caractères maximum).");
  if (typeof input.project !== "string" || !input.project.trim() || input.project.length > 120) throw new Error("Projet requis (120 caractères maximum).");
  if (input.kind !== "widget" && input.kind !== "alertbox" && input.kind !== "overlay") throw new Error("Type de création invalide.");
  const variants = object(input.variants);
  const parsed = Object.fromEntries(LAB_PLATFORMS.map((platform) => {
    const variant = object(variants[platform]);
    if (typeof variant.settings !== "string") throw new Error("Réglages invalides.");
    jsonObject(variant.settings);
    const alerts = object(variant.alerts);
    const allowed = new Set(alertboxAlerts(platform).map((alert) => alert.type));
    if (Object.keys(alerts).some((key) => !allowed.has(key as never))) throw new Error("Type d'alerte inconnu.");
    if (input.kind === "alertbox" && alertboxAlerts(platform).some(({ type }) => !alerts[type])) throw new Error("Chaque alerte doit posséder son code.");
    return [platform, { code: parseCode(variant.code), settings: variant.settings, alerts: Object.fromEntries(Object.entries(alerts).map(([key, code]) => [key, parseCode(code)])) }];
  })) as LabContent["variants"];
  return { name: input.name.trim(), ...(typeof input.description === "string" ? { description: input.description.trim() } : {}), project: input.project.trim(), kind: input.kind, variants: parsed, ...(input.kind === "overlay" ? { overlay: parseOverlay(input.overlay) } : { size: parseLabSize(input.size, input.kind) }), ...(input.kind === "widget" && isStreamlabsWidget(input.streamlabsWidget) && input.streamlabsWidget !== "custom" ? { streamlabsWidget: input.streamlabsWidget } : {}), ...(input.kind !== "overlay" && input.conversions && object(input.conversions).streamlabs ? { conversions: { streamlabs: parseConversion(object(input.conversions).streamlabs) } } : {}) };
}

// Rapport de conversion vers Streamlabs : textes courts, nombre d'alertes borné
function parseConversion(raw: unknown): LabConversion {
  const input = object(raw);
  const text = (value: unknown, max = 600) => { if (typeof value !== "string" || value.length > max) throw new Error("Rapport de conversion invalide."); return value; };
  const list = (value: unknown) => { if (!Array.isArray(value) || value.length > 40) throw new Error("Rapport de conversion invalide."); return value.map((entry) => text(entry)); };
  if (!Array.isArray(input.alerts) || input.alerts.length > 20) throw new Error("Rapport de conversion invalide.");
  return {
    at: text(input.at, 40),
    alerts: input.alerts.map((raw) => {
      const alert = object(raw);
      const status = alert.status === "validated" || alert.status === "untested" || alert.status === "manual" ? alert.status : "manual";
      return { source: text(alert.source, 40), target: text(alert.target, 40), status, converted: list(alert.converted), limitations: list(alert.limitations), manual: list(alert.manual), sourceHash: text(alert.sourceHash, 16), outputHash: text(alert.outputHash, 16) };
    }),
  };
}

// Taille par défaut d'un widget et d'un pack d'alertes (pixels)
export const DEFAULT_LAB_SIZE = { widget: { width: 600, height: 300 }, alertbox: { width: 800, height: 600 } } as const;
export const LAB_SIZE_PRESETS = [[1920, 1080], [1280, 720], [800, 600], [600, 300], [500, 500], [400, 150]] as const;

export function parseLabSize(raw: unknown, kind: "widget" | "alertbox"): LabSize {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const n = (v: unknown, max: number, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(20, Math.round(v))) : fallback);
  return { width: n(o.width, 7680, DEFAULT_LAB_SIZE[kind].width), height: n(o.height, 4320, DEFAULT_LAB_SIZE[kind].height) };
}

export function newLabContent(kind: LabContent["kind"] = "widget"): LabContent {
  const code: LabCode = {
    html: '<div id="alert">Prêt pour le live</div>',
    css: '#alert { font: bold 36px sans-serif; color: #fff; background: #6d28d9; padding: 24px; border-radius: 16px; }',
    js: 'window.addEventListener("onEventReceived", (e) => { const event = e.detail.event || e.detail; document.getElementById("alert").textContent = "Merci " + (event.name || "Viewer") + " !"; });',
    fields: '{"accent":{"type":"colorpicker","label":"Couleur","value":"#6d28d9"}}',
    data: '{}',
  };
  const variant = (platform: typeof LAB_PLATFORMS[number]): LabVariant => ({
    code: { ...code, ...(platform === "streamlabs" ? { js: code.js.replace('window.addEventListener', 'document.addEventListener') } : {}) },
    settings: '{}',
    // Streamlabs : code de base de la Fenêtre d'alertes fourni par zer0oes
    alerts: Object.fromEntries(alertboxAlerts(platform).map(({ type }) => [type, platform === "streamlabs" ? { ...STREAMLABS_ALERT_TEMPLATE } : { ...code, html: '<div id="alert">{name}</div>', js: '' }])),
  });
  const name = kind === "widget" ? "Nouveau widget" : kind === "overlay" ? "Nouvel overlay" : "Nouveau pack d’alertes";
  return { name, project: "Bibliothèque", kind, variants: { streamelements: variant("streamelements"), streamlabs: variant("streamlabs") }, ...(kind === "overlay" ? { overlay: { ...DEFAULT_OVERLAY, items: [] } } : { size: { ...DEFAULT_LAB_SIZE[kind] } }) };
}
