"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { saveLabAction, saveLabTextsAction } from "@/app/admin/custom-lab-actions";
import { normalizeAlertboxConfig } from "@/lib/custom-lab/alertbox";
import { buildWidgetSrcdoc } from "@/lib/custom-lab/widgetSrcdoc";
import { slugifyWidgetName } from "@/lib/custom-lab/widgetExport";
import { buildStreamlabsLoadDetail, type Platform } from "@/lib/custom-lab/platformEvents";
import { DEFAULT_LAB_SIZE, fieldValues, jsonObject, parseFields, parseLabContent, newLabContent } from "@/lib/custom-lab/model";
import type { CodeFile, LabContent, LabDocument } from "@/lib/custom-lab/types";
import { CustomLabCodePanel, CustomLabPlatformSwitch } from "./CustomLabCodePanel";
import { CustomLabSimulator } from "./CustomLabSimulator";
import { CustomLabFields } from "./CustomLabFields";
import { CustomLabMedia, openLabMedia } from "./CustomLabMedia";
import "./custom-lab.css";
import { MaterialIcon } from "./MaterialIcon";
import { CustomLabActions } from "./CustomLabActions";
import { CustomLabProjectField } from "./CustomLabProjectField";
import { CustomLabSizedStage, CustomLabSizeField } from "./CustomLabSizedStage";
import { CustomLabConversionReport, CustomLabConvert, openLabDrawer, REPORT_DRAWER } from "./CustomLabConvert";
import { staleSources } from "@/lib/custom-lab/convert";
import { isStreamlabsTemplate, STREAMLABS_WIDGETS, streamlabsWidgetLabel, type StreamlabsWidget } from "@/lib/custom-lab/streamlabs-widgets";
import { STREAMLABS_TEMPLATES } from "@/lib/custom-lab/streamlabs-templates";
import { labPlatformZip } from "@/lib/custom-lab/export";
import { LAB_TEXT_DEFAULTS, STREAMLABS_CUSTOM_WIDGET_URL, type LabTexts } from "@/lib/custom-lab/lab-texts";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const noSubscribe = () => () => {};

// projects : noms des projets existants, proposés dans le champ « Projet »
export function CustomLabEditor({ initial, projects = [], labTexts = LAB_TEXT_DEFAULTS }: { initial: LabDocument; projects?: string[]; labTexts?: LabTexts }) {
  const { id, revision: initialRevision } = initial;
  const initialContent: LabContent = { name: initial.name, description: initial.description ?? "", project: initial.project, kind: initial.kind, variants: initial.variants, ...(initial.size ? { size: initial.size } : {}), ...(initial.conversions ? { conversions: initial.conversions } : {}), ...(initial.streamlabsWidget ? { streamlabsWidget: initial.streamlabsWidget } : {}) };
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
  // Panneau de conversion vers Streamlabs : remonté à chaque ouverture
  const [convertKey, setConvertKey] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  // Aperçu créé seulement dans le navigateur : rendu côté serveur, il chargerait avant que onLoad soit branché
  // et le widget ne recevrait pas ses valeurs (onWidgetLoad)
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const mockStore = useRef<Record<string, unknown>>({});
  const saving = useRef(false);
  const dirty = JSON.stringify(content) !== saved;
  const size = content.size ?? DEFAULT_LAB_SIZE[content.kind === "alertbox" ? "alertbox" : "widget"];
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
      let source = buildWidgetSrcdoc(active, values, { platform, checkerClass: checker ? " se-lab-checker" : "", streamlabsWidget: preview.kind === "widget" && platform === "streamlabs" ? preview.streamlabsWidget : undefined, ...(preview.kind === "alertbox" ? { alertbox: { codes, config: normalizeAlertboxConfig(jsonObject(v.settings), platform), platform } } : {}) });
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
  // Type de widget Streamlabs ciblé : si le code Streamlabs est encore un code de base, il est remplacé par le modèle du type
  // choisi (ou par le code d'exemple pour le Widget personnalisé). Un code modifié n'est jamais touché.
  function chooseStreamlabsWidget(target: StreamlabsWidget) {
    const next: LabContent = { ...content, streamlabsWidget: target === "custom" ? undefined : target };
    const example = newLabContent("widget").variants.streamlabs.code;
    const untouched = isStreamlabsTemplate(content.variants.streamlabs.code, example);
    const template = target === "custom" ? example : STREAMLABS_TEMPLATES[target];
    if (untouched && template) {
      next.variants = { ...content.variants, streamlabs: { ...content.variants.streamlabs, code: { ...template } } };
      setStatus(target === "custom" ? "Widget personnalisé : code d'exemple remis dans la version Streamlabs." : `Code de base « ${streamlabsWidgetLabel(target)} » chargé dans la version Streamlabs.`);
    } else if (!untouched) setStatus(`Widget Streamlabs : ${streamlabsWidgetLabel(target)}. Le code Streamlabs déjà modifié est conservé.`);
    else setStatus(`Widget Streamlabs : ${streamlabsWidgetLabel(target)}.`);
    setContent(next);
  }

  function exportZip() {
    try {
      const file = labPlatformZip(content, platform);
      download(new Uint8Array(file.data).buffer, file.filename, file.contentType);
      setStatus("Export téléchargé. Les médias doivent être accessibles sur la plateforme destinataire.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Export impossible."); }
  }


  function switchPlatform(value: Platform) {
    setPlatform(value);
    setAlertType("follow");
    mockStore.current = {};
    setPreview(content);
  }
  // Conversion vers Streamlabs : la variante Streamlabs est remplacée, puis affichée avec son rapport
  function converted(next: LabContent, target: string) {
    setContent(next);
    setPreview(next);
    setPlatform("streamlabs");
    if (next.kind === "alertbox") setAlertType(target);
    setTab("html");
    mockStore.current = {};
    setStatus("Version Streamlabs générée. Vérifie le rapport, puis teste-la dans Streamlabs.");
    openLabDrawer(REPORT_DRAWER);
  }
  const stale = staleSources(content);

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
    <Link href="/admin/laboratoire" onClick={(event) => { if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) event.preventDefault(); }} className="text-sm text-muted hover:text-foreground">← Laboratoire</Link>
    <header className="cl-topbar">
      <div><h1>{content.name}</h1><p>{content.kind === "alertbox" ? "Pack d’alertes" : "Widget"} · {pending ? "Enregistrement…" : dirty ? "Modifications à enregistrer" : "Enregistré"}</p></div>
      <div className="cl-actions">
        <CustomLabPlatformSwitch platform={platform} onChange={switchPlatform} />
        <CustomLabActions id={id} kind={content.kind} name={content.name} platform={platform} dirty={dirty} onMedia={() => openLabMedia()} onExport={exportZip} {...(content.kind === "alertbox" || content.kind === "widget" ? { onConvert: () => setConvertKey((key) => key + 1), ...(content.conversions?.streamlabs ? { onReport: () => openLabDrawer(REPORT_DRAWER) } : {}) } : {})} onBackup={() => { try { download(JSON.stringify(parseLabContent(content), null, 2), `${slugifyWidgetName(content.name)}.json`, "application/json"); } catch (error) { setStatus(String(error)); } }} />
      </div>
    </header>
    {status && <p role="status" className="cl-status">{status}</p>}
    {platform === "streamlabs" && stale.length > 0 && <p role="status" className="cl-status">La version StreamElements a changé depuis la conversion vers Streamlabs. <button type="button" className="underline" onClick={() => openLabDrawer(REPORT_DRAWER)}>Voir le rapport</button></p>}
    <details className="cl-metadata"><summary>Nom, projet et taille</summary><div className="cl-metadata-grid">
      <label>Nom<input className={input} value={content.name} maxLength={120} onChange={(event) => setContent({ ...content, name: event.target.value })} /></label>
      <CustomLabProjectField value={content.project} projects={projects} onChange={(project) => setContent((current) => ({ ...current, project }))} />
      <CustomLabSizeField size={size} onChange={(next) => setContent({ ...content, size: next })} />
      <label className="cl-span-all">Description<textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={content.description ?? ""} maxLength={500} rows={2} placeholder="Usage, particularités, client…" onChange={(e) => setContent({ ...content, description: e.target.value })} /></label>
      {content.kind === "widget" && <>
        <label>Widget Streamlabs<select className={input} value={content.streamlabsWidget ?? "custom"} onChange={(event) => chooseStreamlabsWidget(event.target.value as StreamlabsWidget)}>{STREAMLABS_WIDGETS.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}</select></label>
        {!content.streamlabsWidget && <div className="sm:col-span-2 grid gap-1 pb-1 text-sm">
          <a href={STREAMLABS_CUSTOM_WIDGET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 font-semibold text-[var(--cl-accent)] hover:underline">{labTexts["laboratoire.streamlabs.lien"]}<MaterialIcon name="open_in_new" className="size-4" /></a>
          <span className="text-xs text-[var(--cl-muted)]">{labTexts["laboratoire.streamlabs.note"]}</span>
          <details className="text-xs"><summary className="w-fit cursor-pointer text-[var(--cl-muted)] hover:text-[var(--cl-accent)]">Modifier ces textes</summary>
            <form action={saveLabTextsAction} className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="!text-xs">Texte du lien<input name="laboratoire.streamlabs.lien" defaultValue={labTexts["laboratoire.streamlabs.lien"]} maxLength={300} /></label>
              <label className="!text-xs">Note<input name="laboratoire.streamlabs.note" defaultValue={labTexts["laboratoire.streamlabs.note"]} maxLength={300} /></label>
              <button className="cl-secondary">Enregistrer</button>
            </form>
          </details>
        </div>}
      </>}
    </div></details>
    <div className={`cl-workspace ${fieldsCollapsed ? "is-collapsed" : ""}`}>
      <div className="cl-main">
        <section aria-label="Aperçu du widget">
          <header className="cl-preview-toolbar"><div><h2>Aperçu du {content.kind === "alertbox" ? "pack d’alertes" : "widget"}</h2><p>{platform === "streamlabs" ? "Streamlabs" : "StreamElements"} · {size.width} × {size.height} px · simulation locale</p></div><div className="cl-preview-actions">
            <button type="button" className="cl-icon-button" aria-label="Afficher le damier" aria-pressed={checker} title="Afficher le damier" onClick={() => setChecker(!checker)}><MaterialIcon name="grid_on" className="size-4" /></button>
            <button type="button" className="cl-icon-button" aria-label="Recharger l’aperçu" title="Recharger l’aperçu" onClick={() => { setPreview(content); setPreviewKey((key) => key + 1); }}><MaterialIcon name="refresh" className="size-4" /></button>
            <button type="button" className="cl-icon-button" aria-label={fieldsCollapsed ? "Afficher les champs" : "Replier les champs"} aria-expanded={!fieldsCollapsed} title={fieldsCollapsed ? "Afficher les champs" : "Replier les champs"} onClick={() => setFieldsCollapsed(!fieldsCollapsed)}><MaterialIcon name="view_sidebar" className="size-4" /></button>
          </div></header>
          {rendered.error ? <p role="alert" className="cl-error">{rendered.error}</p> : <CustomLabSizedStage size={size}>{hydrated && <iframe key={previewKey} ref={frame} title="Aperçu isolé du Laboratoire" sandbox="allow-scripts" allow="autoplay" referrerPolicy="no-referrer" srcDoc={rendered.source} onLoad={loadPreview} className="block h-full w-full border-0 bg-[#11141a]" style={{ colorScheme: "normal" }} />}</CustomLabSizedStage>}
        </section>
        <CustomLabCodePanel tab={tab} value={tab === "settings" ? variant.settings : code[tab]} platform={platform} dirty={dirty} pending={pending} alertbox={content.kind === "alertbox"} onTab={setTab} onChange={edit} onStatus={setStatus} />
        <section className="cl-console" aria-label="Console"><header><h2>Console · {lines.length}</h2><button type="button" onClick={() => setLines([])}>Effacer</button></header><pre>{lines.join("\n") || "Aucun message."}</pre></section>
      </div>
      {!fieldsCollapsed && <CustomLabFields platform={platform} alertbox={content.kind === "alertbox"} alertType={alertType} fields={editableFields.fields} values={editableFields.values} config={editableFields.config} onAlert={setAlertType} onField={updateField} onSettings={(value) => setContent((current) => ({ ...current, variants: { ...current.variants, [platform]: { ...current.variants[platform], settings: JSON.stringify(value, null, 2) } } }))} />}
    </div>
    <CustomLabMedia />
    <CustomLabConversionReport content={content} />
    {convertKey > 0 && <CustomLabConvert key={convertKey} content={content} onConverted={converted} />}
    <CustomLabSimulator platform={platform} dispatch={dispatch} onStatus={(message) => { setStatus(message); setLines((current) => [...current.slice(-99), message]); }} />
  </div>;
}
