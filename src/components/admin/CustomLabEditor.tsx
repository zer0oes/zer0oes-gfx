"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveLabAction } from "@/app/admin/custom-lab-actions";
import { normalizeAlertboxConfig, type AlertboxAlertType } from "@/lib/custom-lab/alertbox";
import { buildWidgetSrcdoc } from "@/lib/custom-lab/widgetSrcdoc";
import { buildAlertboxExport, buildPlatformExport, slugifyWidgetName, type AlertboxExportCode } from "@/lib/custom-lab/widgetExport";
import { buildStreamlabsLoadDetail, type Platform } from "@/lib/custom-lab/platformEvents";
import { createZip } from "@/lib/custom-lab/zip";
import { fieldValues, jsonObject, parseFields, parseLabContent } from "@/lib/custom-lab/model";
import type { CodeFile, LabContent, LabDocument } from "@/lib/custom-lab/types";
import { CustomLabCodePanel, CustomLabPlatformSwitch } from "./CustomLabCodePanel";
import { CustomLabSimulator } from "./CustomLabSimulator";
import { CustomLabFields } from "./CustomLabFields";
import { CustomLabMedia, openLabMedia } from "./CustomLabMedia";
import "./custom-lab.css";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function CustomLabEditor({ initial }: { initial: LabDocument }) {
  const { id, revision: initialRevision } = initial;
  const initialContent: LabContent = { name: initial.name, project: initial.project, kind: initial.kind, variants: initial.variants };
  const [content, setContent] = useState<LabContent>(initialContent);
  const [saved, setSaved] = useState(JSON.stringify(initialContent));
  const revision = useRef(initialRevision);
  const [platform, setPlatform] = useState<Platform>("streamelements");
  const [alertType, setAlertType] = useState("follow");
  const [tab, setTab] = useState<CodeFile | "settings">("html");
  const [preview, setPreview] = useState(content);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [lines, setLines] = useState<string[]>([]);
  const [checker, setChecker] = useState(true);
  const [fieldsCollapsed, setFieldsCollapsed] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const mockStore = useRef<Record<string, unknown>>({});
  const saving = useRef(false);
  const dirty = JSON.stringify(content) !== saved;
  const variant = content.variants[platform];
  const code = content.kind === "alertbox" ? variant.alerts[alertType] : variant.code;

  useEffect(() => {
    const timer = setTimeout(() => setPreview(content), 250);
    return () => clearTimeout(timer);
  }, [content]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const rendered = useMemo(() => {
    try {
      const v = preview.variants[platform];
      const active = preview.kind === "alertbox" ? v.alerts[alertType] : v.code;
      const values = fieldValues(active);
      const fields = parseFields(active.fields);
      const codes = Object.fromEntries(Object.entries(v.alerts).map(([type, c]) => [type, { ...c, values: fieldValues(c) }]));
      let source = buildWidgetSrcdoc(active, values, { platform, checkerClass: checker ? " se-lab-checker" : "", ...(preview.kind === "alertbox" ? { alertbox: { codes, config: normalizeAlertboxConfig(jsonObject(v.settings), platform), platform } } : {}) });
      // Le code créé n'accède ni aux cookies ni au réseau de l'admin. Cette CSP
      // précède tout HTML utilisateur ; les frames AlertBox héritent de ces règles.
      const policy = "default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'self'; style-src 'unsafe-inline' https:; img-src https: data:; media-src https: data:; font-src https: data:; frame-src 'self' about:; connect-src 'none'; form-action 'none'; base-uri 'none'";
      source = source.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="referrer" content="no-referrer">`);
      return { source, values, fields, error: "" };
    } catch (error) { return { source: "", values: {}, fields: {}, error: error instanceof Error ? error.message : "JSON invalide." }; }
  }, [preview, platform, alertType, checker]);

  function dispatch(detail: unknown, type = "onEventReceived") {
    frame.current?.contentWindow?.postMessage({ source: "se-lab", kind: "dispatch", eventType: type, eventTarget: platform === "streamlabs" ? "document" : "window", detail }, "*");
  }
  function loadPreview() {
    const session = { data: {}, count: 0 };
    const detail = platform === "streamlabs" ? buildStreamlabsLoadDetail(rendered.fields, rendered.values, session) : { fieldData: rendered.values, session, recents: [], currency: { code: "EUR", symbol: "€" }, channel: { username: "zer0oes-demo" } };
    dispatch(detail, platform === "streamlabs" ? "onLoad" : "onWidgetLoad");
  }
  useEffect(() => {
    const handle = (event: MessageEvent) => {
      if (!frame.current || event.source !== frame.current.contentWindow || !event.data || event.data.source !== "se-widget") return;
      const message = event.data;
      if (message.kind === "console" && Array.isArray(message.args)) setLines((current) => [...current.slice(-99), message.args.slice(0, 10).map((arg: unknown) => String(arg).slice(0, 2000)).join(" ")]);
      if (message.kind === "se-api-request" && typeof message.id === "string") {
        const key = typeof message.args?.[0] === "string" ? message.args[0] : "";
        let value: unknown = null;
        let error: string | undefined;
        if (!/^[a-zA-Z0-9_-]{1,100}$/.test(key) || ["__proto__", "constructor", "prototype"].includes(key)) error = "Clé invalide.";
        else if (message.method === "store.get") value = mockStore.current[key] ?? null;
        else if (message.method === "store.set") { if (JSON.stringify(message.args?.[1] ?? null).length < 100_000 && Object.keys(mockStore.current).length < 100) mockStore.current[key] = message.args?.[1]; }
        else if (message.method === "counters.get") value = { counter: key, value: 0 };
        else error = "Fonction non simulée.";
        frame.current.contentWindow?.postMessage({ source: "se-lab", kind: "se-api-response", id: message.id, value, error }, "*");
      }
    };
    window.addEventListener("message", handle);
    return () => window.removeEventListener("message", handle);
  }, []);

  function edit(value: string) {
    setContent((current) => {
      const v = current.variants[platform];
      if (tab === "settings") return { ...current, variants: { ...current.variants, [platform]: { ...v, settings: value } } };
      const next = { ...(current.kind === "alertbox" ? v.alerts[alertType] : v.code), [tab]: value };
      return { ...current, variants: { ...current.variants, [platform]: current.kind === "alertbox" ? { ...v, alerts: { ...v.alerts, [alertType]: next } } : { ...v, code: next } } };
    });
  }
  // auto : enregistrement automatique (silencieux si le JSON est momentanément invalide pendant la saisie)
  function save(auto = false) {
    const snapshot = content;
    if (saving.current) return;
    try { parseLabContent(snapshot); } catch (error) { if (!auto) setStatus(error instanceof Error ? error.message : "Document invalide."); return; }
    saving.current = true;
    startTransition(async () => {
      try {
        const result = await saveLabAction(id, revision.current, snapshot);
        if (!result.ok) { setStatus(result.message); return; }
        revision.current = result.revision;
        setSaved(JSON.stringify(snapshot));
        setStatus(`${auto ? "Enregistré automatiquement" : "Création enregistrée"} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`);
      } catch { setStatus("Connexion interrompue. Tes modifications restent dans l’éditeur."); }
      finally { saving.current = false; }
    });
  }
  // Enregistrement automatique 1,5 s après la dernière modification ; Ctrl + S partout dans l'éditeur
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => saveRef.current(true), 1500);
    return () => clearTimeout(timer);
  }, [content, dirty]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveRef.current(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  function exportZip() {
    try {
      parseLabContent(content);
      const codes = Object.fromEntries(Object.entries(variant.alerts).map(([type, c]) => [type, { ...c, fields: parseFields(c.fields), values: fieldValues(c) }])) as Partial<Record<AlertboxAlertType, AlertboxExportCode>>;
      const result = content.kind === "alertbox" ? buildAlertboxExport(codes, normalizeAlertboxConfig(jsonObject(variant.settings), platform), platform) : buildPlatformExport({ ...code, fields: parseFields(code.fields) }, fieldValues(code), platform);
      const bytes = createZip(result.files);
      download(new Uint8Array(bytes).buffer, `${slugifyWidgetName(content.name)}-${platform}.zip`, "application/zip");
      setStatus("Export téléchargé. Les médias doivent être accessibles sur la plateforme destinataire.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Export impossible."); }
  }

  function switchPlatform(value: Platform) {
    setPlatform(value);
    setAlertType("follow");
    mockStore.current = {};
    setPreview(content);
  }
  function updateField(key: string, value: unknown) {
    try {
      const data = JSON.stringify({ ...jsonObject(code.data), [key]: value }, null, 2);
      setContent((current) => {
        const v = current.variants[platform];
        const next = { ...(current.kind === "alertbox" ? v.alerts[alertType] : v.code), data };
        return { ...current, variants: { ...current.variants, [platform]: current.kind === "alertbox" ? { ...v, alerts: { ...v.alerts, [alertType]: next } } : { ...v, code: next } } };
      });
    } catch { setStatus("Corrige le JSON de Data avant de modifier les champs."); }
  }
  const editableFields = useMemo(() => {
    try { return { fields: parseFields(code.fields), values: fieldValues(code), config: normalizeAlertboxConfig(jsonObject(variant.settings), platform) }; }
    catch { return { fields: {}, values: {}, config: normalizeAlertboxConfig({}, platform) }; }
  }, [code, variant.settings, platform]);

  return <div className={`cl-root ${fieldsCollapsed ? "cl-fields-collapsed" : ""}`}>
    <Link href="/admin/laboratoire" onClick={(event) => { if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) event.preventDefault(); }} className="text-sm text-muted hover:text-accent">← Laboratoire</Link>
    <header className="cl-topbar">
      <div><h1>{content.name}</h1><p>{content.kind === "alertbox" ? "Pack d’alertes" : "Widget"} · {dirty ? "Modifications à enregistrer" : "Enregistré"}</p></div>
      <div className="cl-actions">
        <CustomLabPlatformSwitch platform={platform} onChange={switchPlatform} />
        <button type="button" onClick={() => save()} disabled={pending || !dirty} className="cl-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        <button type="button" onClick={() => openLabMedia()} className="cl-secondary">Médias</button>
        <button type="button" onClick={exportZip} className="cl-secondary">Exporter pour {platform === "streamlabs" ? "Streamlabs" : "StreamElements"}</button>
        <button type="button" onClick={() => { try { download(JSON.stringify(parseLabContent(content), null, 2), `${slugifyWidgetName(content.name)}.json`, "application/json"); } catch (error) { setStatus(String(error)); } }} className="cl-secondary">Sauvegarde du projet</button>
      </div>
    </header>
    {status && <p role="status" className="cl-status">{status}</p>}
    <details className="cl-metadata"><summary>Nom et projet</summary><div><label>Nom<input className={input} value={content.name} maxLength={120} onChange={(event) => setContent({ ...content, name: event.target.value })} /></label><label>Projet<input className={input} value={content.project} maxLength={120} onChange={(event) => setContent({ ...content, project: event.target.value })} /></label></div></details>
    <div className={`cl-workspace ${fieldsCollapsed ? "is-collapsed" : ""}`}>
      <div className="cl-main">
        <section aria-label="Aperçu du widget">
          <header className="cl-preview-toolbar"><div><h2>Aperçu du {content.kind === "alertbox" ? "pack d’alertes" : "widget"}</h2><p>{platform === "streamlabs" ? "Streamlabs" : "StreamElements"} · simulation locale</p></div><div className="cl-preview-actions">
            <button type="button" className="cl-icon-button" aria-label="Afficher le damier" aria-pressed={checker} title="Afficher le damier" onClick={() => setChecker(!checker)}>▦</button>
            <button type="button" className="cl-icon-button" aria-label="Recharger l’aperçu" title="Recharger l’aperçu" onClick={() => { setPreview(content); setPreviewKey((key) => key + 1); }}>↻</button>
            <button type="button" className="cl-icon-button" aria-label={fieldsCollapsed ? "Afficher les champs" : "Replier les champs"} aria-expanded={!fieldsCollapsed} title={fieldsCollapsed ? "Afficher les champs" : "Replier les champs"} onClick={() => setFieldsCollapsed(!fieldsCollapsed)}>☷</button>
          </div></header>
          {rendered.error ? <p role="alert" className="cl-error">{rendered.error}</p> : <iframe key={previewKey} ref={frame} title="Aperçu isolé du Laboratoire" sandbox="allow-scripts" allow="autoplay" referrerPolicy="no-referrer" srcDoc={rendered.source} onLoad={loadPreview} className="cl-preview-frame" />}
        </section>
        <CustomLabCodePanel tab={tab} value={tab === "settings" ? variant.settings : code[tab]} platform={platform} dirty={dirty} pending={pending} alertbox={content.kind === "alertbox"} onTab={setTab} onChange={edit} onStatus={setStatus} />
        <section className="cl-console" aria-label="Console"><header><h2>Console · {lines.length}</h2><button type="button" onClick={() => setLines([])}>Effacer</button></header><pre>{lines.join("\n") || "Aucun message."}</pre></section>
      </div>
      {!fieldsCollapsed && <CustomLabFields platform={platform} alertbox={content.kind === "alertbox"} alertType={alertType} fields={editableFields.fields} values={editableFields.values} config={editableFields.config} onAlert={setAlertType} onField={updateField} onSettings={(value) => setContent((current) => ({ ...current, variants: { ...current.variants, [platform]: { ...current.variants[platform], settings: JSON.stringify(value, null, 2) } } }))} />}
    </div>
    <CustomLabMedia />
    <CustomLabSimulator platform={platform} dispatch={dispatch} onStatus={(message) => { setStatus(message); setLines((current) => [...current.slice(-99), message]); }} />
  </div>;
}
