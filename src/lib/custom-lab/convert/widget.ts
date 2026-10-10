// Conversion d'un widget StreamElements (Custom Widget) vers un Custom Widget Streamlabs. Contrairement à
// une alerte, le widget tourne en continu : ses écouteurs StreamElements sont gardés et rappelés
// - au chargement Streamlabs (onLoad sur document), avec les réglages des Custom Fields ;
// - à chaque évènement Streamlabs (follow, sub, don, bits, raid), traduit au format StreamElements.
// Aucun widget n'est encore validé sur Streamlabs : le statut reste « converti, non testé ».
import { parse } from "acorn";
import type { FieldDefinitions, LabCode } from "../types";
import { configEntry, quote, streamlabsFields, walk, type Node } from "./alert";
import type { ConversionStatus } from "./rules";

export type WidgetConversionResult = { code: LabCode; status: ConversionStatus; converted: string[]; limitations: string[]; manual: string[] };

const TOKEN = /\{\{\s*(\w+)\s*\}\}/g;
const PLACEHOLDER = /__SLVAR_(\w+?)__/g;
const HAS_PLACEHOLDER = /__SLVAR_\w+?__/;
const LISTENER_EVENTS = ["onWidgetLoad", "onEventReceived", "onSessionUpdate"];

// Listeners StreamElements traduits depuis les évènements Streamlabs
const SUPPORTED_LISTENERS: Record<string, string> = {
  "follower-latest": "follow",
  "subscriber-latest": "sub",
  "tip-latest": "don",
  "cheer-latest": "bits",
  "raid-latest": "raid",
};
// Listeners StreamElements sans équivalent connu dans un Custom Widget Streamlabs
const UNSUPPORTED_LISTENERS: Record<string, string> = {
  message: "messages du chat",
  "delete-message": "suppression d'un message du chat",
  "delete-messages": "suppression des messages d'un viewer",
  "host-latest": "hosts",
  "merch-latest": "achats merch",
  "kvstore:update": "SE_API.store",
  "bot:counter": "compteurs du bot",
  "event:skip": "alerte passée",
  "event:test": "boutons de test de l'éditeur StreamElements",
};

export function convertWidgetToStreamlabs(source: LabCode, fields: FieldDefinitions, values: Record<string, unknown>): WidgetConversionResult {
  const converted: string[] = [];
  const limitations: string[] = [];
  const manual: string[] = [];
  const fieldKeys = new Set(Object.keys(fields));
  const unknown = new Set<string>();

  const markup = (text: string) => text.replace(TOKEN, (match, name: string) => {
    if (fieldKeys.has(name)) return `{${name}}`;
    unknown.add(name);
    return match;
  });

  const config = /\b(?:const|let|var|function)\s+CONFIG\b/.test(source.js) ? "STREAMLABS_CONFIG" : "CONFIG";
  const prepared = source.js.replace(TOKEN, (_, name: string) => `__SLVAR_${name}__`);
  let body = prepared;
  const found = { onWidgetLoad: 0, onEventReceived: 0, onSessionUpdate: 0 };
  let parsed = true;
  try {
    const program = parse(prepared, { ecmaVersion: "latest", sourceType: "script", allowReturnOutsideFunction: true, allowHashBang: true });
    const edits: { start: number; end: number; text: string }[] = [];
    const expression = (name: string) => {
      if (fieldKeys.has(name)) return `${config}[${quote(name)}]`;
      unknown.add(name);
      return `undefined /* {{${name}}} : variable inconnue */`;
    };
    walk(program, (node: Node) => {
      if (node.type === "CallExpression") {
        const callee = node.callee as Node & { object?: Node & { name?: string }; property?: Node & { name?: string }; name?: string };
        const args = node.arguments as (Node & { value?: unknown })[];
        const isAdd = (callee.type === "MemberExpression" && callee.property?.name === "addEventListener" && callee.object?.type === "Identifier" && ["window", "document"].includes(String(callee.object.name))) || (callee.type === "Identifier" && callee.name === "addEventListener");
        const event = args[0]?.type === "Literal" ? String(args[0].value) : "";
        if (isAdd && LISTENER_EVENTS.includes(event)) {
          edits.push({ start: callee.start, end: callee.end, text: "streamlabsOn" });
          found[event as keyof typeof found] += 1;
        }
      }
      if (node.type === "Identifier" && typeof node.name === "string") {
        const match = /^__SLVAR_(\w+?)__$/.exec(node.name);
        if (match) edits.push({ start: node.start, end: node.end, text: expression(match[1]) });
      }
      // Dans une chaîne, {réglage} est remplacé par Streamlabs comme {{réglage}} par StreamElements
      if ((node.type === "Literal" && typeof node.value === "string" && HAS_PLACEHOLDER.test(String(node.raw))) || (node.type === "TemplateElement" && HAS_PLACEHOLDER.test(String((node.value as { raw: string }).raw)))) {
        const raw = prepared.slice(node.start, node.end);
        edits.push({ start: node.start, end: node.end, text: raw.replace(PLACEHOLDER, (_, name: string) => (fieldKeys.has(name) ? `{${name}}` : (unknown.add(name), `{{${name}}}`))) });
      }
    });
    edits.sort((a, b) => b.start - a.start);
    for (const edit of edits) body = body.slice(0, edit.start) + edit.text + body.slice(edit.end);
  } catch (error) {
    parsed = false;
    manual.push(`Le JavaScript n'a pas pu être analysé (${error instanceof Error ? error.message : "erreur de syntaxe"}) : il est gardé en commentaire, à adapter à la main.`);
  }

  if (parsed) {
    if (found.onWidgetLoad) converted.push("Écouteur onWidgetLoad raccordé au chargement Streamlabs (onLoad), avec les valeurs des Custom Fields.");
    else limitations.push("Aucun écouteur onWidgetLoad dans le code : les réglages restent disponibles dans le bloc CONFIG.");
    const listeners = [...new Set([...source.js.matchAll(/["'`]([a-z]+(?:-[a-z]+)*(?::[a-z]+)?)["'`]/g)].map((m) => m[1]))];
    const supported = listeners.filter((l) => SUPPORTED_LISTENERS[l]);
    const unsupported = listeners.filter((l) => UNSUPPORTED_LISTENERS[l]);
    const goals = listeners.filter((l) => /-(goal|session|count|week|month|total|recent)$/.test(l));
    if (found.onEventReceived) converted.push(`Écouteur onEventReceived raccordé aux évènements Streamlabs${supported.length ? ` : ${supported.map((l) => `${l} (${SUPPORTED_LISTENERS[l]})`).join(", ")}` : " (follow, sub, don, bits, raid)"}.`);
    if (unsupported.length) manual.push(`Évènements StreamElements sans équivalent vérifié sur Streamlabs : ${unsupported.map((l) => `${l} (${UNSUPPORTED_LISTENERS[l]})`).join(", ")}.`);
    if (found.onSessionUpdate || goals.length || /\.detail\s*\.\s*session\b/.test(source.js)) limitations.push(`Données de session StreamElements (compteurs, objectifs, derniers évènements${goals.length ? ` : ${goals.join(", ")}` : ""}) absentes sur Streamlabs : le widget les reçoit vides.`);
    if (/\bSE_API\b/.test(source.js)) manual.push("SE_API (store, compteurs, setField…) n'existe pas sur Streamlabs : à remplacer à la main.");
    if (/\.detail\s*\.\s*(recents|channel|currency)\b/.test(source.js)) limitations.push("recents, channel et currency de onWidgetLoad sont reçus vides (currency : EUR).");
    if (found.onEventReceived) limitations.push("Subs offerts, community gifts et événements groupés : le format Streamlabs n'a pas été vérifié, à tester.");
  }

  const streamFields = streamlabsFields(fields, values, { converted, limitations });
  const entries = Object.entries(fields).filter(([key]) => key in streamFields).map(([key, field]) => `  ${quote(key)}: ${configEntry(key, field)},`);
  const js = [
    "// Version Streamlabs générée par le Laboratoire à partir de la version StreamElements.",
    "// Streamlabs remplace chaque {réglage} par la valeur des Custom Fields.",
    "(() => {",
    `const ${config} = {`,
    ...entries,
    "};",
    "",
    "// Écouteurs StreamElements du code d'origine, rappelés par les évènements Streamlabs",
    "const streamlabsHandlers = { onWidgetLoad: [], onEventReceived: [], onSessionUpdate: [] };",
    "function streamlabsOn(type, handler){ if (streamlabsHandlers[type] && typeof handler === \"function\") streamlabsHandlers[type].push(handler); }",
    "",
    "// ---------- Code d'origine ----------",
    parsed ? body.replace(PLACEHOLDER, (_, name: string) => `{{${name}}}`) : `/*\n${source.js.replace(/\*\//g, "* /")}\n*/`,
    "// ---------- Fin du code d'origine ----------",
    "",
    "// Valeurs des Custom Fields reçues au chargement (sinon celles du bloc CONFIG)",
    "function streamlabsFieldData(detail){",
    "  const source = detail && (detail.custom_json || detail.customFields || detail.fieldData);",
    `  const values = { ...${config} };`,
    "  if (!source || typeof source !== \"object\") return values;",
    "  for (const [key, field] of Object.entries(source)) {",
    `    if (!(key in ${config})) continue;`,
    "    const value = field && typeof field === \"object\" && \"value\" in field ? field.value : field;",
    `    values[key] = typeof ${config}[key] === "number" ? Number(value) : typeof ${config}[key] === "boolean" ? String(value) === "true" : value;`,
    "  }",
    "  return values;",
    "}",
    "let streamlabsLoaded = false;",
    "function startStreamlabsWidget(detail){",
    "  if (streamlabsLoaded) return;",
    "  streamlabsLoaded = true;",
    "  const load = { detail: { fieldData: streamlabsFieldData(detail), session: { data: {} }, recents: [], currency: { code: \"EUR\", name: \"Euro\", symbol: \"€\" }, channel: {} } };",
    "  streamlabsHandlers.onWidgetLoad.forEach((handler) => handler(load));",
    "}",
    "document.addEventListener(\"onLoad\", (obj) => startStreamlabsWidget(obj && obj.detail));",
    "// Si Streamlabs n'envoie pas onLoad, le widget démarre quand même avec les réglages du bloc CONFIG",
    "window.setTimeout(() => startStreamlabsWidget(null), 1500);",
    "",
    "// Évènements Streamlabs → format StreamElements (listener + event)",
    "const STREAMLABS_LISTENERS = { follow: \"follower-latest\", subscription: \"subscriber-latest\", resub: \"subscriber-latest\", sub: \"subscriber-latest\", donation: \"tip-latest\", tip: \"tip-latest\", bits: \"cheer-latest\", cheer: \"cheer-latest\", raid: \"raid-latest\" };",
    "document.addEventListener(\"onEventReceived\", (obj) => {",
    "  const source = (obj && obj.detail) || {};",
    "  const type = String(source.type || source.tag || \"\").toLowerCase();",
    "  const listener = STREAMLABS_LISTENERS[type];",
    "  if (!listener) return;",
    "  const name = source.name || source.from || source.display_name || \"\";",
    "  const amount = Number(source.amount ?? source.months ?? source.viewers ?? source.count ?? 0) || 0;",
    "  const event = { type: listener.replace(/-latest$/, \"\"), name, displayName: name, amount, count: amount, message: source.message || \"\", currency: source.currency || \"\", sender: source.gifter || source.from_display_name || \"\", gifted: Boolean(source.gifter), isTest: Boolean(source.isTest), data: { displayName: name, amount, message: source.message || \"\" } };",
    "  streamlabsHandlers.onEventReceived.forEach((handler) => handler({ detail: { listener, event } }));",
    "});",
    "})();",
    "",
  ].join("\n");
  converted.push("Chargement Streamlabs ajouté : les réglages arrivent par onLoad, ou au bout de 1,5 s depuis le bloc CONFIG si onLoad n'arrive pas.");

  const html = markup(source.html);
  const css = markup(source.css);
  if (unknown.size) manual.push(`Variables inconnues laissées telles quelles : ${[...unknown].map((name) => `{{${name}}}`).join(", ")}.`);

  return {
    code: { html, css, js, fields: `${JSON.stringify(streamFields, null, 2)}\n`, data: `${JSON.stringify(Object.fromEntries(Object.entries(values).filter(([key]) => key in streamFields).map(([key, value]) => [key, fields[key]?.type === "checkbox" ? String(Boolean(value)) : value])), null, 2)}\n` },
    status: manual.length ? "manual" : "untested",
    converted,
    limitations,
    manual,
  };
}
