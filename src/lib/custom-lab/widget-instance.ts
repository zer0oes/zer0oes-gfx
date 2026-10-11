import type { LabContent } from "./types";
import type { Platform } from "./platformEvents";
import { jsonObject } from "./model";

const record = (raw: unknown): Record<string, unknown> => raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};

// Les surcharges appartiennent au calque et à sa plateforme, jamais au modèle.
export function widgetInstance(content: LabContent, props: Record<string, unknown>, platform: Platform): LabContent {
  const overrides = record(record(props.widgetOverrides)[platform]);
  const variant = content.variants[platform];
  const merge = (data: string, values: unknown) => JSON.stringify({ ...jsonObject(data), ...record(values) });
  return { ...content, variants: { ...content.variants, [platform]: {
    ...variant,
    code: { ...variant.code, data: merge(variant.code.data, overrides.fields) },
    alerts: Object.fromEntries(Object.entries(variant.alerts).map(([type, code]) => [type, { ...code, data: merge(code.data, record(overrides.alerts)[type]) }])),
    settings: overrides.settings ? JSON.stringify(record(overrides.settings)) : variant.settings,
  } } };
}
