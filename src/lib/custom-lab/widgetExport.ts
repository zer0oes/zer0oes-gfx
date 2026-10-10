// Port verbatim de buildPlatformExport / toStreamElementsFields /
// toStreamlabsFields (public/widget-export.js, retiré à la bascule Phase 4) :
// convertit les Fields d'une plateforme à l'autre et construit les 5 fichiers
// exportés en ZIP (widget.html/css/js, fields.json, README.txt), avec un pont
// de compatibilité JS injecté automatiquement si le code n'utilise que les
// événements de l'autre plateforme.

import { PLATFORM_STREAM_ELEMENTS, PLATFORM_STREAMLABS, type Platform } from "./platformEvents";
import type { FieldDefinition, FieldDefinitions, LabConversion } from "./types";
import { alertboxAlerts, type AlertboxAlertType, type AlertboxConfig } from "./alertbox";

export interface ExportableWidget {
  html: string;
  css: string;
  js: string;
  fields: FieldDefinitions;
}

export interface PlatformExportResult {
  files: Record<string, string>;
  platform: Platform;
  platformName: string;
  bridgeInjected: boolean;
}

export const PLATFORM_DASHBOARD_URLS: Record<Platform, string> = {
  [PLATFORM_STREAM_ELEMENTS]: "https://streamelements.com/dashboard/overlays",
  [PLATFORM_STREAMLABS]: "https://streamlabs.com/dashboard#/widgets/customwidget"
};

export function slugifyWidgetName(name: string): string {
  return (
    String(name)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom-widget"
  );
}

export function buildPlatformExport(widget: ExportableWidget, values: Record<string, unknown>, platform: string): PlatformExportResult {
  const target = platform === PLATFORM_STREAMLABS ? PLATFORM_STREAMLABS : PLATFORM_STREAM_ELEMENTS;
  const fields = target === PLATFORM_STREAMLABS ? toStreamlabsFields(widget.fields, values) : toStreamElementsFields(widget.fields, values);
  const bridgeFields = target === PLATFORM_STREAM_ELEMENTS ? toStreamlabsFields(widget.fields, values) : fields;
  const compatibility = buildCompatibilityBridge(widget.js, target, bridgeFields);
  const platformName = target === PLATFORM_STREAMLABS ? "Streamlabs" : "StreamElements";

  return {
    files: {
      "widget.html": ensureTrailingNewline(widget.html),
      "widget.css": ensureTrailingNewline(widget.css),
      "widget.js": ensureTrailingNewline(`${compatibility.code}${widget.js}`),
      "fields.json": `${JSON.stringify(fields, null, 2)}\n`,
      "README.txt":
        [
          `Export automatique pour ${platformName}`,
          "",
          "Copiez le contenu de widget.html, widget.css, widget.js et fields.json",
          "dans les quatre onglets correspondants du Custom Widget.",
          "",
          compatibility.injected
            ? `Un pont de compatibilité ${compatibility.label} a été ajouté au début de widget.js.`
            : "Aucun pont n'a été nécessaire : le code utilise déjà les événements de cette plateforme.",
          "",
          "Les valeurs configurées dans Streamer Lab sont incluses dans fields.json."
        ].join("\n") + "\n"
    },
    platform: target,
    platformName,
    bridgeInjected: compatibility.injected
  };
}

// AlertBox StreamElements ou Alert Box Streamlabs : un dossier par alerte
// activée, avec SON code et ses valeurs de champs, et un README qui liste les
// réglages natifs à reporter à la main — aucune des deux plateformes ne
// permet de les importer.
export interface AlertboxExportCode extends ExportableWidget {
  values: Record<string, unknown>;
}

// Variations de la Subscriber alert : condition à choisir dans StreamElements
const ALERTBOX_VARIATION_HINTS: Partial<Record<AlertboxAlertType, string>> = {
  resub: "variation de la Subscriber alert, condition : 2 mois cumulés ou plus",
  gift: "variation de la Subscriber alert, condition : sub offert (gift)",
  // Un seul code, qui affiche le nombre de subs offerts : s'il y a plusieurs
  // paliers (au moins 2, 5, 10…), le même code va dans chacun
  community: "variation(s) « Community gifts » de la Subscriber alert : coller ce même code dans chaque palier (au moins 2, 5, 10…)"
};

const ALERTBOX_README_INTRO: Record<Platform, string[]> = {
  [PLATFORM_STREAM_ELEMENTS]: [
    "Export AlertBox StreamElements (custom CSS)",
    "",
    "Chaque dossier contient le code d'UNE alerte. Dans l'AlertBox de l'overlay :",
    "  1. ouvrir les réglages (roue dentée) de l'alerte indiquée, ou créer la variation indiquée ;",
    "  2. activer « Enable custom CSS », puis « Open editor » ;",
    "  3. coller widget.html, widget.css, widget.js et fields.json dans les onglets HTML, CSS, JS et FIELDS ;",
    "  4. reporter le son, le volume et la durée indiqués (réglages natifs de l'alerte)."
  ],
  [PLATFORM_STREAMLABS]: [
    "Export Alert Box Streamlabs (custom HTML/CSS)",
    "",
    "Chaque dossier contient le code d'UN type d'alerte. Dans les réglages de l'Alert Box Streamlabs :",
    "  1. ouvrir le type d'alerte indiqué ;",
    "  2. activer « Enable Custom HTML/CSS » ;",
    "  3. coller widget.html, widget.css, widget.js et fields.json dans les onglets HTML, CSS, JS et Custom Fields ;",
    "  4. reporter le son, le volume et la durée indiqués (réglages natifs de l'alerte) ;",
    "  5. garder le champ « Durée de l'alerte » égal à la durée réglée dans Streamlabs (il cale l'animation de sortie)."
  ]
};

export function buildAlertboxExport(
  codes: Partial<Record<AlertboxAlertType, AlertboxExportCode>>,
  config: AlertboxConfig,
  platform: Platform = PLATFORM_STREAM_ELEMENTS,
  // Rapport de conversion StreamElements → Streamlabs, repris dans le README
  conversion?: LabConversion
): PlatformExportResult {
  const isStreamlabs = platform === PLATFORM_STREAMLABS;
  const platformName = isStreamlabs ? "Streamlabs" : "StreamElements";
  const alerts = alertboxAlerts(platform);
  const files: Record<string, string> = {};
  const readme = [...ALERTBOX_README_INTRO[isStreamlabs ? PLATFORM_STREAMLABS : PLATFORM_STREAM_ELEMENTS], ""];

  for (const { type, label } of alerts) {
    const settings = config.alerts[type];
    const code = codes[type];
    if (!settings?.enabled || !code) continue;
    const fields = isStreamlabs ? toStreamlabsFields(code.fields, code.values) : toStreamElementsFields(code.fields, code.values);
    files[`${type}/widget.html`] = ensureTrailingNewline(code.html);
    files[`${type}/widget.css`] = ensureTrailingNewline(code.css);
    files[`${type}/widget.js`] = ensureTrailingNewline(code.js);
    files[`${type}/fields.json`] = `${JSON.stringify(fields, null, 2)}\n`;

    const hint = isStreamlabs ? undefined : ALERTBOX_VARIATION_HINTS[type];
    const isLocalSound = settings.sound.startsWith("/");
    readme.push(
      `${type}/ → ${label}${hint ? ` (${hint})` : ""}`,
      `  Son : ${settings.sound ? settings.sound.split("/").pop() : "aucun"}${isLocalSound ? ` (fichier local du labo : à téléverser dans ${platformName})` : ""}`,
      `  Volume : ${Math.round(settings.volume * 100)} %`,
      `  Durée : ${settings.duration} s`,
      ""
    );
  }

  const disabled = alerts.filter(({ type }) => !config.alerts[type]?.enabled).map(({ label }) => label);
  if (disabled.length > 0) readme.push(`Désactivées (à laisser décochées) : ${disabled.join(", ")}`);
  if (isStreamlabs) readme.push("", ...streamlabsTestChecklist(), ...(conversion ? conversionReadme(conversion, config) : []));
  files["README.txt"] = `${readme.join("\n")}\n`;

  return {
    files,
    platform: isStreamlabs ? PLATFORM_STREAMLABS : PLATFORM_STREAM_ELEMENTS,
    platformName: isStreamlabs ? "Alert Box Streamlabs" : "AlertBox StreamElements",
    bridgeInjected: false
  };
}

const STATUS_TEXT = { validated: "validé sur Streamlabs", untested: "converti, NON TESTÉ sur Streamlabs", manual: "à adapter à la main avant utilisation" } as const;

function streamlabsTestChecklist(): string[] {
  return [
    "Tester chaque alerte dans Streamlabs :",
    "  1. dans les réglages de l'Alert Box, cliquer sur « Test » à côté du type d'alerte (ex. « Test Follow ») ;",
    "  2. vérifier que la carte s'affiche en entier, à la bonne taille, avec le pseudo du test ;",
    "  3. vérifier l'animation d'entrée, puis la sortie juste avant la fin de la durée réglée ;",
    "  4. modifier un Custom Field (couleur, texte…) et relancer le test pour vérifier qu'il est pris en compte ;",
    "  5. dans OBS, recharger la source navigateur de l'Alert Box et refaire un test.",
  ];
}

function conversionReadme(conversion: LabConversion, config: AlertboxConfig): string[] {
  const lines = ["", `Conversion depuis StreamElements (${new Date(conversion.at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}) :`];
  for (const alert of conversion.alerts) {
    if (!config.alerts[alert.target as AlertboxAlertType]?.enabled && alert.status !== "manual") continue;
    lines.push("", `${alert.target}/ (depuis ${alert.source}) : ${STATUS_TEXT[alert.status]}`);
    for (const line of alert.limitations) lines.push(`  Limite : ${line}`);
    for (const line of alert.manual) lines.push(`  À adapter : ${line}`);
  }
  return lines;
}

export function toStreamElementsFields(definitions: FieldDefinitions = {}, values: Record<string, unknown> = {}): FieldDefinitions {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, rawDefinition]) => {
      const definition: FieldDefinition = { ...rawDefinition };
      delete (definition as Record<string, unknown>).name;
      definition.type =
        (
          {
            textfield: "text",
            fontpicker: "googleFont",
            imagepicker: "image-input",
            soundpicker: "sound-input",
            videopicker: "video-input",
            description: "hidden"
          } as Record<string, string>
        )[definition.type] || definition.type;
      if (definition.steps !== undefined && definition.step === undefined) definition.step = definition.steps;
      delete definition.steps;
      definition.value = values[name] ?? definition.value;
      return [name, definition];
    })
  );
}

export function toStreamlabsFields(definitions: FieldDefinitions = {}, values: Record<string, unknown> = {}): FieldDefinitions {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, rawDefinition]) => {
      const definition: FieldDefinition = { ...rawDefinition };
      delete (definition as Record<string, unknown>).name;
      definition.type =
        (
          {
            text: "textfield",
            googleFont: "fontpicker",
            "image-input": "imagepicker",
            "sound-input": "soundpicker",
            "video-input": "videopicker"
          } as Record<string, string>
        )[definition.type] || definition.type;
      if (definition.step !== undefined && definition.steps === undefined) definition.steps = definition.step;
      definition.value = values[name] ?? definition.value;
      return [name, definition];
    })
  );
}

interface CompatibilityBridge {
  code: string;
  injected: boolean;
  label: string;
}

function buildCompatibilityBridge(js: string, platform: Platform, fields: FieldDefinitions): CompatibilityBridge {
  const usesStreamElements = /onWidgetLoad|onSessionUpdate|SE_API|detail\s*\?*\.\s*listener/.test(js);
  const usesStreamlabs = /["']onLoad["']|custom_json|customFields/.test(js);

  if (platform === PLATFORM_STREAMLABS && usesStreamElements && !usesStreamlabs) {
    return { code: `${streamlabsTargetBridge()}\n\n`, injected: true, label: "StreamElements → Streamlabs" };
  }
  if (platform === PLATFORM_STREAM_ELEMENTS && usesStreamlabs && !usesStreamElements) {
    return { code: `${streamElementsTargetBridge(fields)}\n\n`, injected: true, label: "Streamlabs → StreamElements" };
  }
  return { code: "", injected: false, label: "" };
}

function streamlabsTargetBridge(): string {
  return `/* Streamer Lab — pont automatique StreamElements → Streamlabs */
(function () {
  if (window.__localWidgetLabStreamlabsBridge) return;
  window.__localWidgetLabStreamlabsBridge = true;

  const valuesFrom = (customJson) => Object.fromEntries(
    Object.entries(customJson || {}).map(([key, field]) => [
      key,
      field && typeof field === "object" && "value" in field ? field.value : field
    ])
  );
  const listenerByType = {
    follow: "follower-latest",
    subscription: "subscriber-latest",
    subscriber: "subscriber-latest",
    sub: "subscriber-latest",
    donation: "tip-latest",
    tip: "tip-latest",
    bits: "cheer-latest",
    cheer: "cheer-latest",
    raid: "raid-latest",
    message: "message"
  };

  if (!window.SE_API) {
    window.SE_API = {
      store: {
        get: async (key) => JSON.parse(localStorage.getItem("widgetLab." + key) || "null"),
        set: async (key, value) => localStorage.setItem("widgetLab." + key, JSON.stringify(value))
      },
      counters: { get: async () => ({ count: 0 }) },
      sanitize: async (message) => message,
      cheerFilter: async (message) => message,
      getOverlayStatus: async () => ({ isEditorMode: false, muted: false }),
      setField: () => {},
      resumeQueue: () => {}
    };
  }

  document.addEventListener("onLoad", function (obj) {
    const detail = obj.detail || {};
    const fieldData = valuesFrom(detail.custom_json || detail.customFields || detail.fieldData);
    window.dispatchEvent(new CustomEvent("onWidgetLoad", { detail: {
      fieldData,
      session: { data: detail.session || {} },
      recents: [],
      currency: { code: "EUR", name: "Euro", symbol: "€" },
      channel: {}
    }}));
  });

  document.addEventListener("onEventReceived", function (obj) {
    const source = obj.detail || {};
    const type = String(source.type || source.tag || "event").toLowerCase();
    const listener = listenerByType[type] || type;
    const event = type === "message"
      ? { data: { ...source, text: source.text || source.message || "", displayName: source.displayName || source.name || source.from || "Viewer" } }
      : { ...source, name: source.name || source.from || "Viewer", amount: source.amount || source.viewers || 0 };
    window.dispatchEvent(new CustomEvent("onEventReceived", { detail: { listener, event } }));
  });
})();`;
}

function streamElementsTargetBridge(fields: FieldDefinitions): string {
  const serializedFields = JSON.stringify(fields).replaceAll("<", "\\u003c");
  return `/* Streamer Lab — pont automatique Streamlabs → StreamElements */
(function () {
  if (window.__localWidgetLabStreamElementsBridge) return;
  window.__localWidgetLabStreamElementsBridge = true;
  const definitions = ${serializedFields};
  const typeByListener = {
    "follower-latest": "follow",
    "subscriber-latest": "subscription",
    "tip-latest": "donation",
    "cheer-latest": "bits",
    "raid-latest": "raid",
    message: "message"
  };

  window.addEventListener("onWidgetLoad", function (obj) {
    const detail = obj.detail || {};
    const values = detail.fieldData || {};
    const custom_json = Object.fromEntries(Object.entries(definitions).map(([key, field]) => [key, {
      ...field,
      value: values[key] !== undefined ? values[key] : field.value
    }]));
    document.dispatchEvent(new CustomEvent("onLoad", { detail: {
      custom_json,
      customFields: custom_json,
      fieldData: values,
      session: detail.session && detail.session.data ? detail.session.data : {}
    }}));
  });

  window.addEventListener("onEventReceived", function (obj) {
    const detail = obj.detail || {};
    const source = detail.event || {};
    const data = source.data || {};
    const type = typeByListener[detail.listener] || source.type || detail.listener || "event";
    const name = source.name || source.from || data.displayName || data.nick || "Viewer";
    document.dispatchEvent(new CustomEvent("onEventReceived", { detail: {
      ...source,
      ...data,
      type,
      tag: type,
      name,
      from: source.from || name,
      amount: Number(source.amount || data.amount || 0),
      message: source.message || data.text || "",
      platform: source.platform || "twitch_account"
    }}));
  });
})();`;
}

function ensureTrailingNewline(value: string): string {
  return value.endsWith("\n") ? value : `${value}\n`;
}
