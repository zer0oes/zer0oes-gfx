// Conversion d'un pack d'alertes StreamElements vers sa variante Streamlabs. La variante StreamElements
// n'est jamais modifiée : seules les alertes Streamlabs converties, leurs réglages natifs et le rapport
// de conversion changent.
import { normalizeAlertboxConfig, type AlertboxAlertType } from "../alertbox";
import { fieldValues, jsonObject, newLabContent, parseFields } from "../model";
import type { LabAlertConversion, LabCode, LabContent, LabConversion } from "../types";
import { convertAlertToStreamlabs } from "./alert";
import { convertWidgetToStreamlabs } from "./widget";
import { ALERT_RULES } from "./rules";
import { isStreamlabsTemplate } from "../streamlabs-widgets";

export { ALERT_RULES } from "./rules";

// Empreinte courte (FNV-1a) pour savoir si un code a changé depuis la conversion
export function codeHash(code: LabCode | undefined): string {
  const text = JSON.stringify(code ?? null);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export const convertibleAlerts = () => (Object.keys(ALERT_RULES) as AlertboxAlertType[]);
export const targetOf = (type: AlertboxAlertType) => ALERT_RULES[type]!.target;

// Alertes Streamlabs déjà modifiées (à la main, ou depuis la dernière conversion) qui seraient remplacées
export function modifiedTargets(content: LabContent, types: AlertboxAlertType[]): string[] {
  if (content.kind === "widget") {
    const previous = content.conversions?.streamlabs?.alerts.find((alert) => alert.target === "widget")?.outputHash;
    const current = codeHash(content.variants.streamlabs.code);
    return (previous ? current === previous : false) || isStreamlabsTemplate(content.variants.streamlabs.code, newLabContent("widget").variants.streamlabs.code) ? [] : ["widget"];
  }
  const blank = newLabContent("alertbox").variants.streamlabs.alerts;
  const previous = new Map((content.conversions?.streamlabs?.alerts ?? []).map((alert) => [alert.target, alert.outputHash]));
  const targets = [...new Set(types.map(targetOf))];
  return targets.filter((target) => {
    const current = codeHash(content.variants.streamlabs.alerts[target]);
    return current !== (previous.get(target) ?? codeHash(blank[target]));
  });
}

// Alertes StreamElements modifiées depuis la conversion
export function staleSources(content: LabContent): string[] {
  const source = (type: string) => (content.kind === "widget" ? content.variants.streamelements.code : content.variants.streamelements.alerts[type]);
  return (content.conversions?.streamlabs?.alerts ?? []).filter((alert) => codeHash(source(alert.source)) !== alert.sourceHash).map((alert) => alert.source);
}

export function convertPackToStreamlabs(content: LabContent, types: AlertboxAlertType[], now = new Date()): LabContent {
  if (content.kind !== "alertbox") throw new Error("La conversion vers Streamlabs concerne les packs d'alertes.");
  const se = content.variants.streamelements;
  const sl = content.variants.streamlabs;
  const seConfig = normalizeAlertboxConfig(jsonObject(se.settings), "streamelements");
  const slSettings = jsonObject(sl.settings) as { alerts?: Record<string, unknown> };
  const alerts = { ...sl.alerts };
  const settings: Record<string, unknown> = { ...(slSettings.alerts ?? {}) };
  const report: LabAlertConversion[] = [];
  const done = new Set<string>();
  for (const type of types) {
    const code = se.alerts[type];
    if (!code || !ALERT_RULES[type]) continue;
    const target = targetOf(type);
    // Gift Subs Streamlabs : un seul code pour les subs offerts et les community gifts (le premier choisi)
    if (done.has(target)) {
      report.push({ source: type, target, status: "manual", converted: [], limitations: [], manual: [`Non converti : l'alerte Streamlabs « ${target} » reçoit déjà le code de « ${report.find((r) => r.target === target)?.source} ».`], sourceHash: codeHash(code), outputHash: codeHash(alerts[target]) });
      continue;
    }
    const result = convertAlertToStreamlabs(code, type, seConfig.alerts[type], parseFields(code.fields), fieldValues(code));
    alerts[target] = result.code;
    settings[target] = { ...seConfig.alerts[type] };
    result.converted.push("Réglages de l'alerte (activée, son, volume, durée) recopiés sur l'alerte Streamlabs.");
    done.add(target);
    report.push({ source: type, target, status: result.status, converted: result.converted, limitations: result.limitations, manual: result.manual, sourceHash: codeHash(code), outputHash: codeHash(result.code) });
  }
  // Les alertes non reconverties gardent leur rapport précédent
  const kept = (content.conversions?.streamlabs?.alerts ?? []).filter((alert) => !report.some((entry) => entry.target === alert.target));
  const conversion: LabConversion = { at: now.toISOString(), alerts: [...report, ...kept] };
  return {
    ...content,
    variants: { ...content.variants, streamlabs: { ...sl, alerts, settings: JSON.stringify({ ...slSettings, alerts: settings }, null, 2) } },
    conversions: { ...content.conversions, streamlabs: conversion },
  };
}

// Widget : la variante Streamlabs reçoit le code converti, la variante StreamElements ne change pas
export function convertWidgetContent(content: LabContent, now = new Date()): LabContent {
  if (content.kind !== "widget") throw new Error("Cette conversion concerne les widgets.");
  const code = content.variants.streamelements.code;
  const result = convertWidgetToStreamlabs(code, parseFields(code.fields), fieldValues(code), content.streamlabsWidget ?? "custom");
  const entry: LabAlertConversion = { source: "widget", target: "widget", status: result.status, converted: result.converted, limitations: result.limitations, manual: result.manual, sourceHash: codeHash(code), outputHash: codeHash(result.code) };
  return {
    ...content,
    variants: { ...content.variants, streamlabs: { ...content.variants.streamlabs, code: result.code } },
    conversions: { streamlabs: { at: now.toISOString(), alerts: [entry] } },
  };
}

export const STATUS_LABELS: Record<LabAlertConversion["status"], string> = {
  validated: "Validé sur Streamlabs",
  untested: "Converti, non testé",
  manual: "À adapter à la main",
};
