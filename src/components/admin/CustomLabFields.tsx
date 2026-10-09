"use client";
import { useState } from "react";
import { alertboxAlerts, type AlertboxConfig } from "@/lib/custom-lab/alertbox";
import type { FieldDefinitions } from "@/lib/custom-lab/types";
import type { Platform } from "@/lib/custom-lab/platformEvents";

export function CustomLabFields({ platform, alertbox, alertType, fields, values, config, onAlert, onField, onSettings }: {
  platform: Platform; alertbox: boolean; alertType: string; fields: FieldDefinitions; values: Record<string, unknown>; config: AlertboxConfig;
  onAlert: (type: string) => void; onField: (key: string, value: unknown) => void; onSettings: (value: AlertboxConfig) => void;
}) {
  const [tab, setTab] = useState<"alerts" | "fields">("alerts");
  const settings = config.alerts[alertType as keyof typeof config.alerts];
  const keys = Object.entries(fields).filter(([, field]) => field.type !== "hidden");
  return <aside className="cl-fields" aria-label="Champs et réglages">
    {alertbox ? <><div className="cl-side-tabs" role="tablist" aria-label="Réglages de l’AlertBox"><button role="tab" aria-selected={tab === "alerts"} onClick={() => setTab("alerts")}>Alertes</button><button role="tab" aria-selected={tab === "fields"} onClick={() => setTab("fields")}>Champs</button></div><label>Code et champs de l’alerte<select aria-label="Alerte à modifier" value={alertType} onChange={(e) => onAlert(e.target.value)}>{alertboxAlerts(platform).map(({ type, label }) => <option key={type} value={type}>{label}</option>)}</select></label></> : <header className="cl-fields-heading"><h2>Champs</h2><span>fields.{platform}.json</span></header>}
    {alertbox && tab === "alerts" && settings ? <div className="cl-fields-list">
      <p className="cl-field-label">{alertboxAlerts(platform).find(({ type }) => type === alertType)?.label}</p>
      <label className="cl-checkbox">Activer l’alerte<input type="checkbox" checked={settings.enabled} onChange={(e) => onSettings({ ...config, alerts: { ...config.alerts, [alertType]: { ...settings, enabled: e.target.checked } } })} /></label>
      <label>Son (URL)<input type="url" value={settings.sound} onChange={(e) => onSettings({ ...config, alerts: { ...config.alerts, [alertType]: { ...settings, sound: e.target.value } } })} /></label>
      <label>Volume ({Math.round(settings.volume * 100)} %)<input type="range" min="0" max="1" step="0.01" value={settings.volume} onChange={(e) => onSettings({ ...config, alerts: { ...config.alerts, [alertType]: { ...settings, volume: Number(e.target.value) } } })} /></label>
      <label>Durée (secondes)<input type="number" min="1" max="120" value={settings.duration} onChange={(e) => onSettings({ ...config, alerts: { ...config.alerts, [alertType]: { ...settings, duration: Math.max(1, Number(e.target.value)) } } })} /></label>
    </div> : <div className="cl-fields-list">{!keys.length && <p>Aucun champ défini. Ajoute les paramètres dans l’onglet Fields.</p>}{keys.map(([key, field]) => {
      const value = values[key] ?? field.value ?? "";
      const numeric = ["number", "slider"].includes(field.type);
      const secret = /(secret|token|password|api[_-]?key)/i.test(key);
      return <label key={key}>{field.label || key}
        {field.type === "dropdown" ? <select value={String(value)} onChange={(e) => onField(key, e.target.value)}>{Object.entries(field.options ?? {}).map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select>
          : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(value)} onChange={(e) => onField(key, e.target.checked)} />
            : field.type === "button" ? <span className="cl-field-hint">À tester avec un événement JSON personnalisé.</span>
              : <input type={secret ? "password" : field.type === "colorpicker" ? "color" : field.type === "slider" ? "range" : numeric ? "number" : "text"} value={String(value)} min={field.min} max={field.max} step={field.step ?? field.steps} onChange={(e) => onField(key, numeric ? Number(e.target.value) : e.target.value)} />}
      </label>;
    })}</div>}
  </aside>;
}
