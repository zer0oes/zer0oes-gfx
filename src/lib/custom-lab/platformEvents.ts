// Port quasi verbatim de public/platform-adapters.js — logique pure de
// conversion d'événements/format entre StreamElements et Streamlabs,
// partagée par l'aperçu widget, le simulateur d'événements et le rechargement
// live SSE.

export const PLATFORM_STREAM_ELEMENTS = "streamelements";
export const PLATFORM_STREAMLABS = "streamlabs";
export type Platform = typeof PLATFORM_STREAM_ELEMENTS | typeof PLATFORM_STREAMLABS;

export function normalizePlatform(value: unknown): Platform {
  return value === PLATFORM_STREAMLABS ? PLATFORM_STREAMLABS : PLATFORM_STREAM_ELEMENTS;
}

export interface FieldDefinition {
  value?: unknown;
  [key: string]: unknown;
}

export function buildStreamlabsLoadDetail(
  definitions: Record<string, FieldDefinition> | undefined,
  values: Record<string, unknown> | undefined,
  session: unknown = {}
): { custom_json: Record<string, unknown>; customFields: Record<string, unknown>; fieldData: Record<string, unknown>; session: unknown } {
  const customJson = Object.fromEntries(
    Object.entries(definitions || {}).map(([name, definition]) => [
      name,
      { ...definition, name, value: values?.[name] ?? definition.value }
    ])
  );

  return {
    custom_json: customJson,
    customFields: customJson,
    fieldData: { ...values },
    session
  };
}

export interface PlatformEventDetail {
  listener?: string;
  event?: Record<string, unknown>;
}

export function toStreamlabsEvent(detail: PlatformEventDetail = {}): Record<string, unknown> {
  const listener = String(detail.listener || "").toLowerCase();
  const event = detail.event || {};
  const data = (event.data as Record<string, unknown>) || {};
  const listenerTypeMap: Record<string, string> = {
    "follower-latest": "follow",
    "subscriber-latest": "subscription",
    "tip-latest": "donation",
    "cheer-latest": "bits",
    "raid-latest": "raid",
    message: "message"
  };
  const type = listenerTypeMap[listener] || String(event.type || listener.replace(/-latest$/, "") || "event").toLowerCase();

  const name = event.name || event.from || data.displayName || data.nick || "Viewer";
  const amount = Number(event.amount ?? data.amount ?? 0) || 0;
  const message = event.message ?? data.text ?? data.message ?? "";
  const platform = event.platform || data.platform || "twitch_account";

  return {
    ...event,
    ...data,
    type,
    tag: event.tag || type,
    name,
    from: event.from || name,
    amount,
    message,
    text: data.text ?? event.text ?? message,
    platform,
    isTest: event.isTest ?? true,
    payload: event.payload || data,
    ...(type === "raid" ? { viewers: Number(event.viewers ?? amount) || 0 } : {}),
    ...(type === "donation"
      ? { currency: event.currency || "EUR", formattedAmount: event.formattedAmount || `${amount.toFixed(2)} €` }
      : {})
  };
}
