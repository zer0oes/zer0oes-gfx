"use client";
import { useState } from "react";
import { CustomLabFields } from "./CustomLabFields";
import { widgetInstance } from "@/lib/custom-lab/widget-instance";
import { fieldValues, jsonObject, parseFields } from "@/lib/custom-lab/model";
import { normalizeAlertboxConfig } from "@/lib/custom-lab/alertbox";
import type { LabContent } from "@/lib/custom-lab/types";
import type { Platform } from "@/lib/custom-lab/platformEvents";

export function CustomLabWidgetSettings({ content, props, platform, onChange }: { content: LabContent; props: Record<string, unknown>; platform: Platform; onChange: (patch: Record<string, unknown>) => void }) {
  const [alert, setAlert] = useState("follow");
  const all = (props.widgetOverrides ?? {}) as Record<string, Record<string, unknown>>;
  const current = all[platform] ?? {};
  const update = (patch: Record<string, unknown>) => onChange({ widgetOverrides: { ...all, [platform]: { ...current, ...patch } } });
  const instance = widgetInstance(content, props, platform);
  const variant = instance.variants[platform];
  const code = content.kind === "alertbox" ? variant.alerts[alert] : variant.code;
  return <section className="cl-widget-settings space-y-3 border-t border-border pt-4">
    <h3 className="text-sm font-semibold">Réglages de ce widget</h3>
    <p className="text-xs text-muted">Propres à ce calque sur {platform === "streamlabs" ? "Streamlabs" : "StreamElements"}. Le modèle de la bibliothèque reste inchangé.</p>
    <CustomLabFields platform={platform} alertbox={content.kind === "alertbox"} alertType={alert} fields={parseFields(code.fields)} values={fieldValues(code)} config={normalizeAlertboxConfig(jsonObject(variant.settings), platform)} onAlert={setAlert} onField={(key, value) => {
      if (content.kind === "alertbox") { const alerts = (current.alerts ?? {}) as Record<string, Record<string, unknown>>; update({ alerts: { ...alerts, [alert]: { ...alerts[alert], [key]: value } } }); }
      else update({ fields: { ...(current.fields as Record<string, unknown> ?? {}), [key]: value } });
    }} onSettings={(settings) => update({ settings })} />
    <button type="button" className="cl-secondary" onClick={() => onChange({ widgetOverrides: { ...all, [platform]: {} } })}>Reprendre les réglages du modèle</button>
  </section>;
}
