"use client";

import { useMemo, useRef, useState } from "react";
import { CustomLabFieldBuilder } from "./CustomLabFieldBuilder";
import Image from "next/image";
import { CODE_FILES } from "@/lib/custom-lab/model";
import { highlightSource } from "@/lib/custom-lab/syntaxHighlight";
import type { CodeFile } from "@/lib/custom-lab/types";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import { MaterialIcon } from "./MaterialIcon";

export function CustomLabPlatformSwitch({ platform, onChange }: { platform: Platform; onChange: (platform: Platform) => void }) {
  return <div className="cl-platform-switch" role="group" aria-label="Plateforme du code et de la simulation">{(["streamelements", "streamlabs"] as const).map((value) => <button key={value} type="button" aria-pressed={platform === value} aria-label={value === "streamlabs" ? "Streamlabs" : "StreamElements"} title={value === "streamlabs" ? "Streamlabs" : "StreamElements"} onClick={() => onChange(value)}><Image unoptimized src={`/streamerlab/platforms/${value}-icon.svg`} alt="" width={24} height={24} /></button>)}</div>;
}

export function CustomLabCodePanel({ tab, value, platform, dirty, pending, alertbox, onTab, onChange, onStatus }: {
  tab: CodeFile | "settings"; value: string; platform: Platform; dirty: boolean; pending: boolean; alertbox: boolean;
  onTab: (tab: CodeFile | "settings") => void; onChange: (value: string) => void; onStatus: (message: string) => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  // Onglet Fields : vue visuelle (par défaut) ou JSON
  const [fieldsView, setFieldsView] = useState<"visual" | "json">("visual");
  const visual = tab === "fields" && fieldsView === "visual";
  const highlight = useRef<HTMLPreElement>(null);
  const highlighted = useMemo(() => highlightSource(tab === "settings" ? "fields" : tab, value), [tab, value]);
  const filename = tab === "settings" ? "alertbox.json" : tab === "fields" || tab === "data" ? `${tab}.${platform}.json` : `widget.${tab === "js" ? `${platform}.js` : tab}`;
  return <section className="cl-code" aria-labelledby="cl-code-title">
    <header className="cl-panel-heading"><div><span className="cl-eyebrow">CODE DU {alertbox ? "PACK D’ALERTES" : "WIDGET"}</span><h2 id="cl-code-title">Édition en temps réel</h2></div><span className={`cl-save-state ${dirty ? "is-dirty" : "is-synced"}`}><i />{pending ? "Enregistrement…" : dirty ? "Non enregistré" : "Synchronisé"}</span></header>
    <div className="cl-code-tabs" role="tablist" aria-label="Fichiers du widget">{[...CODE_FILES, ...(alertbox ? ["settings" as const] : [])].map((key) => <button key={key} role="tab" type="button" aria-selected={tab === key} aria-controls="cl-code-body" id={`cl-tab-${key}`} data-file={key} onClick={() => { onTab(key); if (highlight.current) { highlight.current.scrollTop = 0; highlight.current.scrollLeft = 0; } }}>{key === "settings" ? "Réglages" : key === "fields" ? "Fields" : key === "data" ? "Data" : key.toUpperCase()}</button>)}</div>
    {tab === "fields" && (
      <div className="flex justify-end border-b border-[var(--cl-line)] bg-[#0f1116] px-2 py-1.5">
        <div role="group" aria-label="Affichage des champs" className="inline-grid grid-flow-col gap-1 rounded-full border border-[var(--cl-line)] p-0.5 text-[11px]">
          {(["visual", "json"] as const).map((v) => <button key={v} type="button" aria-pressed={fieldsView === v} onClick={() => setFieldsView(v)} className={`rounded-full px-3 py-1 ${fieldsView === v ? "bg-[var(--cl-accent)] font-semibold text-[#0d0f13]" : "text-[var(--cl-muted)]"}`}>{v === "visual" ? "Visuel" : "JSON"}</button>)}
        </div>
      </div>
    )}
    {visual ? <div className="max-h-[420px] overflow-auto"><CustomLabFieldBuilder value={value} onChange={onChange} /></div> : <div className="cl-code-body" id="cl-code-body" role="tabpanel" aria-labelledby={`cl-tab-${tab}`}>
      <pre ref={highlight} aria-hidden="true" className="cl-code-highlight"><code dangerouslySetInnerHTML={{ __html: highlighted + "\n" }} /></pre>
      <textarea ref={textarea} aria-label={`Code ${tab} du widget`} wrap="off" autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} onChange={(event) => onChange(event.target.value)} onScroll={(event) => { if (highlight.current) { highlight.current.scrollTop = event.currentTarget.scrollTop; highlight.current.scrollLeft = event.currentTarget.scrollLeft; } }} onKeyDown={(event) => {
        if (event.key === "Tab") { event.preventDefault(); const element = event.currentTarget; const start = element.selectionStart; const end = element.selectionEnd; onChange(`${value.slice(0, start)}  ${value.slice(end)}`); requestAnimationFrame(() => { textarea.current?.setSelectionRange(start + 2, start + 2); }); }
      }} />
      <button type="button" className="cl-copy" aria-label="Copier le code" title="Copier le code" onClick={async () => { try { await navigator.clipboard.writeText(value); onStatus("Code copié."); } catch { onStatus("Copie indisponible. Sélectionne le code pour le copier."); } }}><MaterialIcon name="content_copy" className="size-4" /></button>
    </div>}<footer className="cl-code-footer"><code>{filename}</code><span>Enregistrement automatique · Ctrl + S pour enregistrer tout de suite</span></footer>
  </section>;
}
