"use client";

import { useRef, useState } from "react";
import { ALERTBOX_ALERTS, STREAMLABS_ALERTBOX_ALERTS, normalizeAlertboxConfig, type AlertboxAlertType } from "@/lib/custom-lab/alertbox";
import { ALERT_RULES, STATUS_LABELS, codeHash, convertPackToStreamlabs, convertWidgetContent, modifiedTargets, staleSources, targetOf } from "@/lib/custom-lab/convert";
import { jsonObject, newLabContent } from "@/lib/custom-lab/model";
import type { LabAlertConversion, LabContent } from "@/lib/custom-lab/types";
import { Drawer } from "./Drawer";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";

export const CONVERT_DRAWER = "laboratoire-convertir";
export const REPORT_DRAWER = "laboratoire-rapport";
export const openLabDrawer = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.showModal();
const closeLabDrawer = (id: string) => (document.getElementById(id) as HTMLDialogElement | null)?.close();

const STATUS_STYLE: Record<LabAlertConversion["status"], { icon: MaterialIconName; className: string }> = {
  validated: { icon: "check_circle", className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" },
  untested: { icon: "schedule", className: "border-amber-400/40 bg-amber-400/10 text-amber-200" },
  manual: { icon: "build", className: "border-red-400/40 bg-red-400/10 text-red-300" },
};
const streamlabsLabel = (type: string) => (type === "widget" ? "Custom Widget" : STREAMLABS_ALERTBOX_ALERTS.find((alert) => alert.type === type)?.label ?? type);
const streamElementsLabel = (type: string) => (type === "widget" ? "Custom Widget" : ALERTBOX_ALERTS.find((alert) => alert.type === type)?.label ?? type);

function StatusBadge({ status }: { status: LabAlertConversion["status"] }) {
  const style = STATUS_STYLE[status];
  return <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.className}`}><MaterialIcon name={style.icon} className="size-3.5" />{STATUS_LABELS[status]}</span>;
}

// Conversion d'un pack d'alertes StreamElements vers sa variante Streamlabs : choix des alertes, confirmation
// si des alertes Streamlabs modifiées seraient remplacées. La variante StreamElements n'est pas touchée.
// Monté (avec une nouvelle key) à chaque ouverture : le panneau s'ouvre avec les alertes activées cochées.
export function CustomLabConvert({ content, onConverted }: { content: LabContent; onConverted: (next: LabContent, firstTarget: AlertboxAlertType) => void }) {
  const widget = content.kind === "widget";
  const config = (() => { try { return normalizeAlertboxConfig(jsonObject(content.variants.streamelements.settings), "streamelements"); } catch { return normalizeAlertboxConfig({}, "streamelements"); } })();
  const convertible = ALERTBOX_ALERTS.filter(({ type }) => ALERT_RULES[type]);
  // Cochées par défaut : les alertes activées dont le code a été écrit (pas le modèle vide d'un nouveau pack)
  const [selected, setSelected] = useState<AlertboxAlertType[]>(() => {
    const blank = newLabContent("alertbox").variants.streamelements.alerts;
    return convertible.filter(({ type }) => config.alerts[type]?.enabled && codeHash(content.variants.streamelements.alerts[type]) !== codeHash(blank[type])).map(({ type }) => type);
  });
  const [error, setError] = useState("");
  const confirm = useRef<HTMLDialogElement>(null);
  const modified = modifiedTargets(content, widget ? [] : selected);

  const run = () => {
    try {
      const next = widget ? convertWidgetContent(content) : convertPackToStreamlabs(content, selected);
      confirm.current?.close();
      closeLabDrawer(CONVERT_DRAWER);
      onConverted(next, widget ? "follow" : targetOf(selected[0]));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Conversion impossible."); }
  };

  return <>
    <Drawer id={CONVERT_DRAWER} kicker="Laboratoire" title="Convertir vers Streamlabs" openOnLoad footer={<>
      {error ? <span role="alert" className="text-xs text-red-300">{error}</span> : <span className="text-xs text-muted">{widget ? "Custom Widget" : `${selected.length} alerte${selected.length > 1 ? "s" : ""}`}</span>}
      <button type="button" disabled={!widget && !selected.length} onClick={() => (modified.length ? confirm.current?.showModal() : run())} className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60"><MaterialIcon name="sync_alt" className="size-4" />Convertir</button>
    </>}>
      {widget ? <>
      <p className="text-sm text-muted">Le code StreamElements reste tel quel. Le widget converti remplit les onglets HTML, CSS, JS, Fields et Data de la version Streamlabs.</p>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3"><span><span className="block text-sm font-semibold">Custom Widget</span><span className="block text-xs text-muted">Réglages au chargement, évènements follow, sub, don, bits et raid</span></span><StatusBadge status="untested" /></div>
      <p className="text-xs text-muted">Aucun widget n’a encore été testé sur Streamlabs : il restera « Converti, non testé » jusqu’à ton premier test réel.</p>
      </> : <>
      <p className="text-sm text-muted">Le code StreamElements reste tel quel. Les alertes choisies remplissent les onglets HTML, CSS, JS, Fields et Data de la version Streamlabs, avec leurs réglages (son, volume, durée).</p>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {convertible.map(({ type, label }) => {
          const rule = ALERT_RULES[type]!;
          const checked = selected.includes(type);
          return <li key={type}>
            <label className="flex cursor-pointer items-center gap-3 px-4 py-3">
              <input type="checkbox" checked={checked} onChange={(event) => setSelected((current) => event.target.checked ? convertible.map((a) => a.type).filter((t) => t === type || current.includes(t)) : current.filter((t) => t !== type))} className="size-4 accent-[var(--color-accent)]" />
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-muted">→ {streamlabsLabel(rule.target)}{config.alerts[type]?.enabled ? "" : " · désactivée"}</span></span>
              <StatusBadge status={rule.validated ? "validated" : "untested"} />
            </label>
          </li>;
        })}
      </ul>
      <p className="text-xs text-muted">Seules les alertes testées pour de vrai sur Streamlabs sont marquées « Validé ». Le rapport liste ce qui a été converti, les limites et ce qui reste à adapter à la main.</p>
      </>}
    </Drawer>
    <dialog ref={confirm} aria-label="Remplacer les alertes Streamlabs modifiées" onClick={(event) => { if (event.target === event.currentTarget) confirm.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
      <p className="font-display text-lg font-bold">{widget ? "Es-tu sûre de vouloir remplacer la version Streamlabs ?" : "Es-tu sûre de vouloir remplacer ces alertes Streamlabs ?"}</p>
      <p className="mt-2 text-sm text-muted">{widget ? "Le code Streamlabs de ce widget a été modifié." : `Elles ont été modifiées : ${modified.map(streamlabsLabel).join(", ")}.`}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={() => confirm.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
        <button type="button" onClick={run} className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Remplacer</button>
      </div>
    </dialog>
  </>;
}

function ReportList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  if (!items.length) return null;
  return <div><p className={`mb-1 text-xs font-bold uppercase tracking-wider ${tone}`}>{title}</p><ul className="list-disc space-y-1 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

// Rapport de la dernière conversion : par alerte, ce qui a été converti, les limites et les adaptations manuelles
export function CustomLabConversionReport({ content }: { content: LabContent }) {
  const report = content.conversions?.streamlabs;
  const stale = staleSources(content);
  return <Drawer id={REPORT_DRAWER} kicker="Laboratoire" title="Rapport de conversion">
    {!report ? <p className="text-sm text-muted">Aucune conversion pour l’instant. Lance « Convertir vers Streamlabs » depuis l’onglet StreamElements.</p> : <>
      <p className="text-sm text-muted">Conversion du {new Date(report.at).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}. Seuls les éléments « Validé sur Streamlabs » y ont été testés pour de vrai : teste les autres dans Streamlabs avant de les livrer.</p>
      {stale.length > 0 && <p role="status" className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">La version StreamElements a changé depuis la conversion : {stale.map(streamElementsLabel).join(", ")}. Relance la conversion pour reprendre ces modifications.</p>}
      {report.alerts.map((alert) => <section key={alert.source} className="space-y-3 rounded-xl border border-border p-4">
        <header className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{streamElementsLabel(alert.source)} → {streamlabsLabel(alert.target)}</h4><StatusBadge status={alert.status} /></header>
        <ReportList title="Converti" items={alert.converted} tone="text-emerald-300" />
        <ReportList title="Limites" items={alert.limitations} tone="text-amber-200" />
        <ReportList title="À adapter à la main" items={alert.manual} tone="text-red-300" />
      </section>)}
    </>}
  </Drawer>;
}
