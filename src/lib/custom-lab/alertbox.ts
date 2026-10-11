// AlertBox StreamElements (« custom CSS ») : réglages natifs par alerte
// (alertbox.json) et accès typé à la simulation alertboxRuntime.js — injectée
// telle quelle dans l'aperçu, cf. widgetSrcdoc.ts.
import runtimeSource from "./alertboxRuntimeSource";

// StreamElements : follow… charity ; Streamlabs : follow, sub, resub, giftsub,
// bits, raid, tip, merch, charity (types de son Alert Box).
export type AlertboxAlertType =
  | "follow"
  | "sub"
  | "resub"
  | "gift"
  | "community"
  | "cheer"
  | "tip"
  | "raid"
  | "purchase"
  | "charity"
  | "giftsub"
  | "bits"
  | "merch";

export type AlertboxPlatform = "streamelements" | "streamlabs";

export interface AlertboxAlertSettings {
  enabled: boolean;
  sound: string;
  // 0 à 1, comme {{audioVolume}}
  volume: number;
  // secondes, comme {{widgetDuration}}
  duration: number;
}

export interface AlertboxConfig {
  alerts: Record<AlertboxAlertType, AlertboxAlertSettings>;
}

// Libellés repris de l'AlertBox StreamElements (Follower alert, Subscriber
// alert…) ; resub, gift et community y sont des variations de la Subscriber
// alert, chacune avec son propre code.
export interface AlertboxAlertInfo {
  type: AlertboxAlertType;
  label: string;
  icon: string;
  hint?: string;
}

export const ALERTBOX_ALERTS: AlertboxAlertInfo[] = [
  { type: "follow", label: "Follower alert", icon: "favorite" },
  { type: "sub", label: "Subscriber alert", icon: "star_shine" },
  { type: "resub", label: "Resub", icon: "star_shine", hint: "Variation de la Subscriber alert" },
  { type: "gift", label: "Sub offert", icon: "redeem", hint: "Variation de la Subscriber alert" },
  { type: "community", label: "Community gift", icon: "featured_seasonal_and_gifts", hint: "Variation de la Subscriber alert" },
  { type: "cheer", label: "Cheer alert", icon: "diamond_shine" },
  { type: "tip", label: "Tip alert", icon: "money_bag" },
  { type: "raid", label: "Raid alert", icon: "bolt" },
  { type: "purchase", label: "Purchase alert", icon: "shopping_bag" },
  { type: "charity", label: "Charity campaign donation alert", icon: "volunteer_activism" }
];

// Libellés de l'Alert Box Streamlabs (un réglage par type d'alerte)
export const STREAMLABS_ALERTBOX_ALERTS: AlertboxAlertInfo[] = [
  { type: "follow", label: "Follows", icon: "favorite" },
  { type: "sub", label: "Subscriptions", icon: "star_shine" },
  { type: "resub", label: "Resubs", icon: "star_shine" },
  { type: "giftsub", label: "Gift Subs", icon: "redeem", hint: "Subs offerts (un ou plusieurs)" },
  { type: "bits", label: "Bits", icon: "diamond_shine" },
  { type: "raid", label: "Raids", icon: "bolt" },
  { type: "tip", label: "Donations", icon: "money_bag" },
  { type: "merch", label: "Merch", icon: "shopping_bag" },
  { type: "charity", label: "Charity", icon: "volunteer_activism" }
];

export function alertboxAlerts(platform: AlertboxPlatform | string): AlertboxAlertInfo[] {
  return platform === "streamlabs" ? STREAMLABS_ALERTBOX_ALERTS : ALERTBOX_ALERTS;
}

export function alertboxPlatformLabel(platform: AlertboxPlatform | string): string {
  return platform === "streamlabs" ? "Alert Box Streamlabs" : "AlertBox StreamElements";
}

// Code d'une alerte tel que l'hôte le reçoit : champs déjà remplacés, et
// valeurs envoyées dans onWidgetLoad.
export interface AlertboxHostCode {
  html: string;
  css: string;
  js: string;
  fieldData: Record<string, unknown>;
}

export interface AlertboxRuntime {
  ALERT_TYPES: AlertboxAlertType[];
  TYPES_BY_PLATFORM: Record<AlertboxPlatform, AlertboxAlertType[]>;
  normalizeConfig(raw: unknown, platform?: AlertboxPlatform): AlertboxConfig;
  escapeHtml(value: unknown): string;
  detectAlertType(listener: string, event: Record<string, unknown> | null, platform?: AlertboxPlatform): AlertboxAlertType | null;
  buildAlertVariables(
    type: AlertboxAlertType,
    event: Record<string, unknown>,
    settings: AlertboxAlertSettings,
    currency?: { symbol?: string },
    platform?: AlertboxPlatform
  ): Record<string, string>;
  substituteAlertVariables(source: string, vars: Record<string, string>): string;
  buildAlertDocument(
    code: { html: string; css: string; js: string },
    vars: Record<string, string>,
    loadDetail: Record<string, unknown>,
    platform?: AlertboxPlatform
  ): string;
  createHost(options: {
    codes: Partial<Record<AlertboxAlertType, AlertboxHostCode>>;
    config: unknown;
    platform?: AlertboxPlatform;
    stage: HTMLElement;
    window?: Window;
    log?: (level: "info" | "warn", message: string) => void;
    playSound?: (settings: AlertboxAlertSettings, type: AlertboxAlertType) => void;
  }): { handleEvent(detail: unknown): void; config: AlertboxConfig };
}

// Source à injecter dans un <script> : on neutralise par sécurité toute
// fermeture de balise (le fichier n'en contient pas, cf. son en-tête).
export const ALERTBOX_RUNTIME_SOURCE: string = runtimeSource.replace(/<\/script/gi, "<\\/script");

let runtime: AlertboxRuntime | null = null;

// Même code que celui exécuté dans l'aperçu, évalué ici pour le panneau de
// réglages et les tests.
export function loadAlertboxRuntime(): AlertboxRuntime {
  if (!runtime) runtime = new Function(`${runtimeSource}\nreturn AlertboxRuntime;`)() as AlertboxRuntime;
  return runtime;
}

export function normalizeAlertboxConfig(raw: unknown, platform: AlertboxPlatform = "streamelements"): AlertboxConfig {
  return loadAlertboxRuntime().normalizeConfig(raw, platform);
}
