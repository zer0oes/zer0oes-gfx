// Conversion du code d'UNE alerte de l'AlertBox StreamElements (custom CSS) vers l'Alert Box Streamlabs
// (custom HTML/CSS), d'après le Follow validé sur Streamlabs :
// - les réglages sont lus dans un bloc CONFIG ("clé": "{clé}") que Streamlabs remplit dans le JS ;
// - les données de l'alerte ({name}…) sont posées dans un bloc caché #alertData, lu par readVar() ;
// - le code d'origine est gardé tel quel : ses écouteurs onWidgetLoad / onEventReceived sont rappelés une
//   seule fois, quand le HTML est présent et a une taille réelle (l'Alert Box prépare l'alerte suivante
//   dans une iframe masquée).
// Rien n'est deviné : ce qui n'a pas d'équivalent est listé en limitation ou en adaptation manuelle.
import { parse } from "acorn";
import type { AlertboxAlertSettings, AlertboxAlertType } from "../alertbox";
import type { FieldDefinition, FieldDefinitions, LabCode } from "../types";
import { ALERT_RULES, UNSUPPORTED_FIELD_TYPES, UNSUPPORTED_VARIABLES, type ConversionStatus } from "./rules";

export type AlertConversionResult = {
  code: LabCode;
  target: AlertboxAlertType;
  status: ConversionStatus;
  converted: string[];
  limitations: string[];
  manual: string[];
};

export type Node = { type: string; start: number; end: number; [key: string]: unknown };

const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;
const placeholder = (name: string) => `__SLVAR_${name}__`;
const PLACEHOLDER = /__SLVAR_(\w+?)__/g;
const HAS_PLACEHOLDER = /__SLVAR_\w+?__/;
const LOAD_EVENTS = ["onWidgetLoad", "onEventReceived"];
// Streamlabs (comme le Follow validé) : variable absente de l'évènement = laissée entre accolades
const UNRESOLVED = String.raw`/^\{\{?\s*\w+\s*\}\}?$/`;

export function walk(node: unknown, visit: (node: Node, parent: Node | null) => void, parent: Node | null = null) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((child) => walk(child, visit, parent)); return; }
  const current = node as Node;
  if (typeof current.type !== "string") return;
  visit(current, parent);
  for (const [key, value] of Object.entries(current)) if (key !== "type" && value && typeof value === "object") walk(value, visit, current);
}

export const quote = (value: string) => JSON.stringify(value);

// Champs Streamlabs : mêmes libellés et valeurs, types traduits
export function streamlabsFields(fields: FieldDefinitions, values: Record<string, unknown>, report: { converted: string[]; limitations: string[] }) {
  const result: FieldDefinitions = {};
  const dropped: string[] = [];
  for (const [key, raw] of Object.entries(fields)) {
    const field: FieldDefinition = { ...raw };
    delete (field as Record<string, unknown>).name;
    const type = String(field.type);
    if (type === "button" || type === "hidden") { dropped.push(`${key} (${UNSUPPORTED_FIELD_TYPES[type]})`); continue; }
    field.type = ({ text: "textfield", number: "textfield", googleFont: "fontpicker", "image-input": "imagepicker", "sound-input": "soundpicker", "video-input": "videopicker", checkbox: "dropdown" } as Record<string, string>)[type] ?? type;
    if (type === "checkbox") {
      field.options = { true: "Oui", false: "Non" };
      field.value = String(Boolean(values[key] ?? raw.value));
    } else field.value = values[key] ?? raw.value;
    if (field.step !== undefined && field.steps === undefined) field.steps = field.step;
    delete field.step;
    result[key] = field;
  }
  const count = Object.keys(result).length;
  if (count) report.converted.push(`${count} champ${count > 1 ? "s" : ""} repris dans les Custom Fields et raccordé${count > 1 ? "s" : ""} au code par le bloc CONFIG.`);
  const translated = Object.entries(fields).filter(([, f]) => ["checkbox", "number"].includes(String(f.type))).map(([k, f]) => `${k} (${UNSUPPORTED_FIELD_TYPES[String(f.type)]})`);
  if (translated.length) report.limitations.push(`Champs sans équivalent direct, transformés en liste ou en texte (le code reçoit toujours la même valeur) : ${translated.join(", ")}.`);
  if (dropped.length) report.limitations.push(`Champs retirés, inexistants sur Streamlabs : ${dropped.join(", ")}.`);
  return result;
}

// Valeur d'un champ dans CONFIG : Streamlabs remplace {clé} par du texte, reconverti au type attendu par le code
export function configEntry(key: string, field: FieldDefinition) {
  const token = quote(`{${key}}`);
  if (field.type === "slider" || field.type === "number") return `Number(${token})`;
  if (field.type === "checkbox") return `${token} === "true"`;
  return token;
}

export function convertAlertToStreamlabs(
  source: LabCode,
  type: AlertboxAlertType,
  settings: AlertboxAlertSettings,
  fields: FieldDefinitions,
  values: Record<string, unknown>,
): AlertConversionResult {
  const rule = ALERT_RULES[type];
  if (!rule) throw new Error(`Aucune règle de conversion pour l'alerte « ${type} ».`);
  const converted: string[] = [];
  const limitations: string[] = [...(rule.notes ?? [])];
  const manual: string[] = [];
  const fieldKeys = new Set(Object.keys(fields));
  const unknown = new Set<string>();
  const removed = new Set<string>();
  const renamed = new Map<string, string>();

  // {{variable}} → équivalent Streamlabs ; null : à vider ; undefined : inconnue
  const resolve = (name: string): { kind: "field" | "alert" | "duration" | "empty" | "unknown"; value: string } => {
    if (fieldKeys.has(name)) return { kind: "field", value: name };
    if (name === "widgetDuration") return { kind: "duration", value: String(settings.duration) };
    if (name in rule.variables) {
      const target = rule.variables[name];
      if (target === null) { removed.add(name); return { kind: "empty", value: "" }; }
      renamed.set(name, target);
      return { kind: "alert", value: target };
    }
    if (UNSUPPORTED_VARIABLES.includes(name) || ["sender", "items", "currency", "amount", "count", "months", "message", "userMessage", "messageRaw"].includes(name)) { removed.add(name); return { kind: "empty", value: "" }; }
    unknown.add(name);
    return { kind: "unknown", value: `{{${name}}}` };
  };

  // HTML et CSS : remplacement des variables par celles de Streamlabs
  const markup = (text: string) => text.replace(TOKEN, (_, name: string) => {
    const r = resolve(name);
    return r.kind === "field" || r.kind === "alert" ? `{${r.value}}` : r.value;
  });

  // ---------- JS ----------
  const names = { config: "CONFIG", readVar: "readVar" };
  if (/\b(?:const|let|var|function)\s+CONFIG\b/.test(source.js)) names.config = "STREAMLABS_CONFIG";
  if (/\b(?:const|let|var|function)\s+readVar\b/.test(source.js)) names.readVar = "readStreamlabsVar";
  const usedData = new Set(rule.data);
  const prepared = source.js.replace(TOKEN, (_, name: string) => placeholder(name));
  let body = prepared;
  let listeners = { onWidgetLoad: 0, onEventReceived: 0 };
  let parsed = true;
  try {
    const program = parse(prepared, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true, allowHashBang: true });
    const edits: { start: number; end: number; text: string }[] = [];
    // Expression JS d'une variable StreamElements écrite hors d'une chaîne
    const expression = (name: string) => {
      const r = resolve(name);
      if (r.kind === "field") return `${names.config}[${quote(name)}]`;
      if (r.kind === "duration") return `Number(${names.config}.alert_duration_seconds)`;
      if (r.kind === "alert") { usedData.add(r.value); return `${names.readVar}(${quote(r.value)})`; }
      return r.kind === "unknown" ? `undefined /* {{${name}}} : variable inconnue */` : quote("");
    };
    walk(program, (node) => {
      // Écouteurs de l'AlertBox : enregistrés, puis appelés au démarrage Streamlabs
      if (node.type === "CallExpression") {
        const callee = node.callee as Node & { object?: Node & { name?: string }; property?: Node & { name?: string }; name?: string };
        const args = node.arguments as (Node & { value?: unknown })[];
        const isAdd = (callee.type === "MemberExpression" && callee.property?.name === "addEventListener" && callee.object?.type === "Identifier" && ["window", "document"].includes(String(callee.object.name))) || (callee.type === "Identifier" && callee.name === "addEventListener");
        const event = args[0]?.type === "Literal" ? String(args[0].value) : "";
        if (isAdd && LOAD_EVENTS.includes(event)) {
          edits.push({ start: callee.start, end: callee.end, text: "streamlabsOn" });
          listeners = { ...listeners, [event]: listeners[event as keyof typeof listeners] + 1 };
        }
      }
      if (node.type === "Identifier" && typeof node.name === "string") {
        const match = /^__SLVAR_(\w+?)__$/.exec(node.name);
        if (match) edits.push({ start: node.start, end: node.end, text: expression(match[1]) });
      }
      // Variable au milieu d'une chaîne : la chaîne devient une concaténation
      if (node.type === "Literal" && typeof node.value === "string" && HAS_PLACEHOLDER.test(node.value)) {
        const parts: string[] = [];
        let last = 0;
        for (const match of node.value.matchAll(PLACEHOLDER)) {
          if (match.index > last) parts.push(quote(node.value.slice(last, match.index)));
          const r = resolve(match[1]);
          parts.push(r.kind === "field" ? quote(`{${match[1]}}`) : expression(match[1]));
          last = match.index + match[0].length;
        }
        if (last < node.value.length) parts.push(quote(node.value.slice(last)));
        edits.push({ start: node.start, end: node.end, text: parts.length === 1 ? parts[0] : `(${parts.join(" + ")})` });
      }
      if (node.type === "TemplateElement") {
        const raw = String((node.value as { raw: string }).raw);
        if (HAS_PLACEHOLDER.test(raw)) {
          edits.push({ start: node.start, end: node.end, text: raw.replace(PLACEHOLDER, (_, name: string) => resolve(name).kind === "field" ? `{${name}}` : `\${${expression(name)}}`) });
        }
      }
    });
    edits.sort((a, b) => b.start - a.start);
    for (const edit of edits) body = body.slice(0, edit.start) + edit.text + body.slice(edit.end);
  } catch (error) {
    parsed = false;
    manual.push(`Le JavaScript n'a pas pu être analysé (${error instanceof Error ? error.message : "erreur de syntaxe"}) : il est gardé en commentaire, à adapter à la main.`);
  }

  if (parsed) {
    if (listeners.onWidgetLoad) converted.push("Écouteur onWidgetLoad raccordé : il reçoit les réglages du bloc CONFIG au démarrage.");
    else limitations.push("Aucun écouteur onWidgetLoad dans le code : les réglages restent disponibles dans le bloc CONFIG.");
    if (listeners.onEventReceived) converted.push("Écouteur onEventReceived raccordé : il reçoit une seule fois les données de l'alerte (bloc #alertData).");
    if (/\bSE_API\b/.test(source.js)) manual.push("SE_API (store, compteurs…) n'existe pas sur Streamlabs : à remplacer à la main.");
    const extra = [...new Set([...source.js.matchAll(/\.detail\s*\.\s*(session|recents|channel|currency)\b/g)].map((m) => m[1]))];
    if (extra.length) limitations.push(`Données StreamElements absentes de l'Alert Box Streamlabs, reçues vides : ${extra.join(", ")}.`);
  }

  // CONFIG : un réglage par champ, plus la durée de l'alerte
  const streamFields = streamlabsFields(fields, values, { converted, limitations });
  const config = Object.entries(fields).filter(([key]) => key in streamFields).map(([key, field]) => `  ${quote(key)}: ${configEntry(key, field)},`);
  config.push(`  "alert_duration_seconds": ${settings.duration}`);
  converted.push(`Durée de l'alerte : ${settings.duration} s (réglage de l'alerte), à garder identique dans Streamlabs.`);

  // Premier élément affiché du HTML qui porte un id : sa taille dit si l'iframe est vraiment visible
  const ready = [...source.html.matchAll(/<([a-z][\w-]*)\b[^>]*?\bid\s*=\s*["']([^"']+)["']/gi)]
    .find(([, tag, id]) => !["link", "script", "style", "meta", "template", "audio", "source"].includes(tag.toLowerCase()) && id !== "alertData")?.[2];
  const loadDetail = `{ detail: { fieldData: ${names.config}, session: { data: {} }, recents: [], currency: { code: "", symbol: "" }, channel: {} } }`;
  const amountVar = ["amount", "months", "count"].find((key) => usedData.has(key));
  const eventDetail = `{ detail: { listener: ${quote(rule.listener)}, event: { type: ${quote(rule.listener.replace(/-latest$/, ""))}, name: ${names.readVar}("name")${amountVar ? `, amount: Number(String(${names.readVar}(${quote(amountVar)})).replace(/[^\\d.,-]/g, "").replace(",", ".")) || 0` : ""}${usedData.has("message") ? `, message: ${names.readVar}("message")` : ""} } } }`;

  const js = [
    "// Version Streamlabs générée par le Laboratoire à partir de la version StreamElements.",
    "// Streamlabs remplace chaque {réglage} par la valeur des Custom Fields.",
    "(() => {",
    `const ${names.config} = {`,
    ...config,
    "};",
    "",
    "// Données de l'alerte, remplies par Streamlabs dans le bloc caché #alertData du HTML.",
    `function ${names.readVar}(key){`,
    `  const el = document.querySelector('#alertData [data-var="' + key + '"]');`,
    `  const text = el ? el.textContent.trim() : "";`,
    `  return ${UNRESOLVED}.test(text) ? "" : text;`,
    "}",
    "",
    "// Écouteurs StreamElements du code d'origine, appelés une seule fois au démarrage",
    "const streamlabsHandlers = { onWidgetLoad: [], onEventReceived: [] };",
    "function streamlabsOn(type, handler){ if (streamlabsHandlers[type] && typeof handler === \"function\") streamlabsHandlers[type].push(handler); }",
    "",
    "// ---------- Code d'origine ----------",
    parsed ? body.replace(PLACEHOLDER, (_, name: string) => `{{${name}}}`) : `/*\n${source.js.replace(/\*\//g, "* /")}\n*/`,
    "// ---------- Fin du code d'origine ----------",
    "",
    "// L'Alert Box peut injecter le HTML après le chargement et préparer l'alerte dans une iframe masquée :",
    "// on attend les éléments et une surface réelle avant de lancer l'alerte.",
    "let streamlabsBooted = false;",
    "let streamlabsTimer = 0;",
    "let streamlabsObserver = null;",
    "function streamlabsReady(){",
    "  if (!document.body || !document.getElementById(\"alertData\")) return false;",
    "  if (window.innerWidth <= 0 || window.innerHeight <= 0) return false;",
    ...(ready ? [`  const root = document.getElementById(${quote(ready)});`, "  if (!root) return false;", "  const box = root.getBoundingClientRect();", "  if (box.width <= 0 || box.height <= 0) return false;"] : []),
    "  return true;",
    "}",
    "function startStreamlabsAlert(){",
    "  if (streamlabsBooted || !streamlabsReady()) return;",
    "  streamlabsBooted = true;",
    "  clearInterval(streamlabsTimer);",
    "  if (streamlabsObserver) streamlabsObserver.disconnect();",
    "  window.removeEventListener(\"resize\", startStreamlabsAlert);",
    `  streamlabsHandlers.onWidgetLoad.forEach((handler) => handler(${loadDetail}));`,
    `  streamlabsHandlers.onEventReceived.forEach((handler) => handler(${eventDetail}));`,
    "}",
    "streamlabsObserver = new MutationObserver(startStreamlabsAlert);",
    "streamlabsObserver.observe(document.documentElement, { childList: true, subtree: true });",
    "streamlabsTimer = window.setInterval(startStreamlabsAlert, 100);",
    "window.addEventListener(\"resize\", startStreamlabsAlert);",
    "document.addEventListener(\"DOMContentLoaded\", startStreamlabsAlert, { once: true });",
    "startStreamlabsAlert();",
    "})();",
    "",
  ].join("\n");
  converted.push(`Démarrage Streamlabs ajouté : l'alerte se lance une seule fois, quand le HTML est présent${ready ? ` et que #${ready} a une taille réelle` : " et que la fenêtre a une taille réelle"}.`);

  // HTML : variables converties et bloc #alertData (les anciens blocs #alertData sont remplacés)
  let html = markup(source.html).replace(/<!--[^>]*-->\s*<div id=["']alertData["'][\s\S]*?<\/div>|<div id=["']alertData["'][\s\S]*?<\/div>/g, "").trimEnd();
  html += `\n\n<!-- Données de l'alerte, remplies par Streamlabs --><div id="alertData" hidden>${[...usedData].map((key) => `<span data-var="${key}">{${key}}</span>`).join("")}</div>\n`;
  const css = markup(source.css);
  converted.push(`Données de l'alerte placées dans le bloc #alertData : ${[...usedData].map((key) => `{${key}}`).join(", ")}.`);
  if (renamed.size) converted.push(`Variables converties : ${[...renamed].map(([from, to]) => `{{${from}}} → {${to}}`).join(", ")}.`);
  if (removed.size) limitations.push(`Variables sans équivalent sur Streamlabs, remplacées par du vide : ${[...removed].map((name) => `{{${name}}}`).join(", ")}.`);
  if (unknown.size) manual.push(`Variables inconnues laissées telles quelles : ${[...unknown].map((name) => `{{${name}}}`).join(", ")}.`);

  const status: ConversionStatus = manual.length ? "manual" : rule.validated ? "validated" : "untested";
  return {
    code: { html, css, js, fields: `${JSON.stringify(streamFields, null, 2)}\n`, data: `${JSON.stringify(Object.fromEntries(Object.entries(values).filter(([key]) => key in streamFields).map(([key, value]) => [key, fields[key]?.type === "checkbox" ? String(Boolean(value)) : value])), null, 2)}\n` },
    target: rule.target,
    status,
    converted,
    limitations,
    manual,
  };
}
