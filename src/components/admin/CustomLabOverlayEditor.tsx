"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveLabAction } from "@/app/admin/custom-lab-actions";
import { parseLabContent } from "@/lib/custom-lab/model";
import { DEFAULT_OVERLAY, ITEM_LABELS, MIN_ITEM_SIZE, createItem, itemLabel, newItemId, snapPosition, snapTargets, type OverlayData, type OverlayItem, type OverlayItemType } from "@/lib/custom-lab/overlay";
import { buildLabPreview, labEventMessage, labLoadMessage } from "@/lib/custom-lab/preview";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import type { LabContent, LabDocument } from "@/lib/custom-lab/types";
import { slugifyWidgetName } from "@/lib/custom-lab/widgetExport";
import { CustomLabPlatformSwitch } from "./CustomLabCodePanel";
import { CustomLabMedia, openLabMedia } from "./CustomLabMedia";
import { CustomLabSimulator } from "./CustomLabSimulator";
import { usePointerSort } from "./usePointerSort";
import "./custom-lab.css";
import { MaterialIcon } from "./MaterialIcon";
import { CustomLabDeliver } from "./CustomLabDeliver";

// Création utilisable dans un calque « widget » (widget ou pack d'alertes de la bibliothèque)
export type OverlaySource = { id: string; name: string; project: string; content: LabContent };

const input = "w-full rounded-md border border-[var(--cl-line)] bg-[#0d0f13] px-2 py-1.5 text-xs";
const toolButton = "inline-flex items-center gap-1 rounded-full border border-[var(--cl-line)] bg-[#151720] px-3 py-1.5 text-xs font-semibold text-[#dddfea] hover:border-[var(--cl-accent)]";
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Handle = (typeof HANDLES)[number];
const handlePos: Record<Handle, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
};

function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Contenu d'un calque dans la scène
function ItemContent({ item, source, platform, register }: { item: OverlayItem; source?: OverlaySource; platform: Platform; register: (id: string, el: HTMLIFrameElement | null) => void }) {
  const p = item.props;
  if (item.type === "text") {
    return (
      <div
        className="h-full w-full overflow-hidden whitespace-pre-wrap break-words"
        style={{
          fontFamily: String(p.fontFamily || "inherit"),
          fontSize: `${Number(p.fontSize) || 48}px`,
          fontWeight: Number(p.fontWeight) || 700,
          color: String(p.color || "#fff"),
          textAlign: (p.align as "left" | "center" | "right") || "left",
          lineHeight: Number(p.lineHeight) || 1.2,
          letterSpacing: `${Number(p.letterSpacing) || 0}px`,
          textShadow: p.shadow ? `0 4px ${Number(p.shadowBlur) || 0}px ${String(p.shadowColor || "#000")}` : "none",
        }}
      >
        {String(p.content ?? "")}
      </div>
    );
  }
  if (item.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return p.src ? <img src={String(p.src)} alt="" draggable={false} className="h-full w-full" style={{ objectFit: (p.fit as "contain" | "cover") || "contain" }} /> : <Placeholder label="Image : choisis un fichier" />;
  }
  if (item.type === "video") {
    return p.src ? <video src={String(p.src)} autoPlay loop={p.loop !== false} muted={p.muted !== false} playsInline className="h-full w-full" style={{ objectFit: (p.fit as "contain" | "cover") || "cover" }} /> : <Placeholder label="Vidéo : choisis un fichier" />;
  }
  if (item.type === "shape") {
    return (
      <div
        className="h-full w-full"
        style={{
          background: String(p.fill || "transparent"),
          border: Number(p.strokeWidth) > 0 ? `${Number(p.strokeWidth)}px solid ${String(p.stroke)}` : "none",
          borderRadius: p.shape === "ellipse" ? "50%" : `${Number(p.radius) || 0}px`,
          opacity: p.opacity === undefined ? 1 : Number(p.opacity),
        }}
      />
    );
  }
  return <WidgetFrame item={item} source={source} platform={platform} register={register} />;
}

function Placeholder({ label }: { label: string }) {
  return <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-white/30 bg-white/5 text-2xl text-white/60">{label}</div>;
}

// Widget ou pack d'alertes de la bibliothèque, rendu dans une iframe isolée (comme dans l'éditeur de widgets)
function WidgetFrame({ item, source, platform, register }: { item: OverlayItem; source?: OverlaySource; platform: Platform; register: (id: string, el: HTMLIFrameElement | null) => void }) {
  const preview = useMemo(() => (source ? buildLabPreview(source.content, platform, { transparent: true }) : null), [source, platform]);
  const frame = useRef<HTMLIFrameElement | null>(null);
  if (!source) return <Placeholder label="Widget : choisis une création" />;
  if (!preview?.source) return <Placeholder label={preview?.error || "Aperçu indisponible"} />;
  return (
    <iframe
      ref={(el) => {
        frame.current = el;
        register(item.id, el);
      }}
      title={source.name}
      sandbox="allow-scripts"
      allow="autoplay"
      referrerPolicy="no-referrer"
      srcDoc={preview.source}
      onLoad={() => frame.current?.contentWindow?.postMessage(labLoadMessage(preview, platform), "*")}
      style={{ colorScheme: "normal" }}
      className="pointer-events-none h-full w-full border-0 bg-transparent"
    />
  );
}

// Éditeur d'overlays par calques : scène à l'échelle, déplacement et redimensionnement à la souris avec
// aimantation, calques réordonnables, propriétés par type, annuler / rétablir, enregistrement automatique.
export function CustomLabOverlayEditor({ initial, sources, projects = [] }: { initial: LabDocument; sources: OverlaySource[]; projects?: string[] }) {
  const { id } = initial;
  const initialContent: LabContent = { name: initial.name, project: initial.project, kind: "overlay", variants: initial.variants, overlay: initial.overlay ?? DEFAULT_OVERLAY };
  const [content, setContent] = useState<LabContent>(initialContent);
  const [saved, setSaved] = useState(JSON.stringify(initialContent));
  const revision = useRef(initial.revision);
  const saving = useRef(false);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<"layers" | "props">("layers");
  const [platform, setPlatform] = useState<Platform>("streamelements");
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [scale, setScale] = useState(0.5);
  const past = useRef<OverlayData[]>([]);
  const future = useRef<OverlayData[]>([]);
  // Nombre d'étapes à annuler / rétablir (copie des piles, lisible pendant le rendu)
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const stageBox = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const data = content.overlay ?? DEFAULT_OVERLAY;
  const dirty = JSON.stringify(content) !== saved;
  const byId = useMemo(() => new Map(sources.map((s) => [s.id, s])), [sources]);
  const current = data.items.find((it) => it.id === selected) ?? null;
  // Taille d'origine de la création affichée dans le calque widget sélectionné
  const currentSize = current?.type === "widget" && current.widgetId ? byId.get(current.widgetId)?.content.size : undefined;

  // --- Données et historique ---
  // Scène la plus récente (lue par les gestes et l'historique, mise à jour à chaque modification)
  const latest = useRef<OverlayData>(initialContent.overlay ?? DEFAULT_OVERLAY);
  const apply = useCallback((after: OverlayData) => {
    latest.current = after;
    setContent((c) => ({ ...c, overlay: after }));
  }, []);
  const setData = useCallback((next: OverlayData | ((d: OverlayData) => OverlayData), record = true) => {
    const before = latest.current;
    const after = typeof next === "function" ? next(before) : next;
    if (record) {
      past.current = [...past.current.slice(-99), before];
      future.current = [];
      setHist({ undo: past.current.length, redo: 0 });
    }
    apply(after);
  }, [apply]);
  const updateItem = useCallback((itemId: string, patch: Partial<OverlayItem>, record = true) => setData((d) => ({ ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }), record), [setData]);
  const updateProps = (itemId: string, patch: Record<string, unknown>) => setData((d) => ({ ...d, items: d.items.map((it) => (it.id === itemId ? { ...it, props: { ...it.props, ...patch } } : it)) }));
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current = [latest.current, ...future.current].slice(0, 100);
    apply(prev);
    setHist({ undo: past.current.length, redo: future.current.length });
  }, [apply]);
  const redo = useCallback(() => {
    const next = future.current.shift();
    if (!next) return;
    past.current = [...past.current, latest.current];
    apply(next);
    setHist({ undo: past.current.length, redo: future.current.length });
  }, [apply]);

  // Taille d'une création de la bibliothèque, centrée dans la scène
  const sourceSize = (widgetId: string) => {
    const size = byId.get(widgetId)?.content.size;
    return size ? { w: size.width, h: size.height, x: Math.round((data.width - size.width) / 2), y: Math.round((data.height - size.height) / 2) } : {};
  };
  const add = (type: OverlayItemType, extra: Partial<OverlayItem> = {}) => {
    const item = createItem(data, type, extra);
    setData((d) => ({ ...d, items: [...d.items, item] }));
    setSelected(item.id);
    setPanel("props");
  };
  const remove = useCallback((itemId: string) => {
    setData((d) => ({ ...d, items: d.items.filter((it) => it.id !== itemId) }));
    setSelected(null);
  }, [setData]);
  const duplicate = useCallback((itemId: string) => {
    const it = data.items.find((x) => x.id === itemId);
    if (!it) return;
    const copy = { ...structuredClone(it), id: newItemId(), x: it.x + 24, y: it.y + 24, z: Math.max(...data.items.map((x) => x.z), 0) + 1, name: it.name ? `${it.name} (copie)` : undefined };
    setData((d) => ({ ...d, items: [...d.items, copy] }));
    setSelected(copy.id);
  }, [data.items, setData]);

  // --- Enregistrement (manuel, automatique, Ctrl + S) ---
  function save(auto = false) {
    const snapshot = content;
    if (saving.current) return;
    try {
      parseLabContent(snapshot);
    } catch (error) {
      if (!auto) setStatus(error instanceof Error ? error.message : "Document invalide.");
      return;
    }
    saving.current = true;
    startTransition(async () => {
      try {
        const result = await saveLabAction(id, revision.current, snapshot);
        if (!result.ok) return setStatus(result.message);
        revision.current = result.revision;
        setSaved(JSON.stringify(snapshot));
        setStatus(`${auto ? "Enregistré automatiquement" : "Overlay enregistré"} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`);
      } catch {
        setStatus("Connexion interrompue. Tes modifications restent dans l’éditeur.");
      } finally {
        saving.current = false;
      }
    });
  }
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => saveRef.current(true), 1500);
    return () => clearTimeout(timer);
  }, [content, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // --- Raccourcis clavier ---
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input, textarea, select, [contenteditable]");
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
        return;
      }
      if (typing) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (!selected) return;
      const it = data.items.find((x) => x.id === selected);
      if (!it) return;
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(selected);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(selected);
      } else if (e.key.startsWith("Arrow") && !it.locked) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        updateItem(selected, { x: it.x + dx, y: it.y + dy });
      } else if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected, data.items, undo, redo, remove, duplicate, updateItem]);

  // --- Échelle de la scène (ajustée à la largeur disponible) ---
  useEffect(() => {
    const el = stageBox.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / data.width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.width]);

  // --- Déplacement et redimensionnement à la souris ---
  function startDrag(e: React.PointerEvent, item: OverlayItem, handle?: Handle) {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelected(item.id);
    if (item.locked) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, item: { ...item } };
    const tx = snapTargets(data, "x", item.id);
    const ty = snapTargets(data, "y", item.id);
    const threshold = 8 / scale;
    let recorded = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / scale;
      const dy = (ev.clientY - start.y) / scale;
      if (!recorded && Math.abs(dx) + Math.abs(dy) < 1) return;
      const it = start.item;
      let { x, y, w, h } = it;
      let gx: number | null = null;
      let gy: number | null = null;
      if (!handle) {
        const sx = ev.altKey ? { pos: Math.round(it.x + dx), guide: null } : snapPosition(it.x + dx, it.w, tx, threshold);
        const sy = ev.altKey ? { pos: Math.round(it.y + dy), guide: null } : snapPosition(it.y + dy, it.h, ty, threshold);
        x = sx.pos;
        y = sy.pos;
        gx = sx.guide;
        gy = sy.guide;
      } else {
        if (handle.includes("e")) w = Math.max(MIN_ITEM_SIZE, Math.round(it.w + dx));
        if (handle.includes("s")) h = Math.max(MIN_ITEM_SIZE, Math.round(it.h + dy));
        if (handle.includes("w")) {
          w = Math.max(MIN_ITEM_SIZE, Math.round(it.w - dx));
          x = it.x + it.w - w;
        }
        if (handle.includes("n")) {
          h = Math.max(MIN_ITEM_SIZE, Math.round(it.h - dy));
          y = it.y + it.h - h;
        }
        // Maj : garde les proportions (poignées d'angle)
        if (ev.shiftKey && handle.length === 2) {
          const ratio = it.w / it.h;
          if (w / h > ratio) w = Math.round(h * ratio);
          else h = Math.round(w / ratio);
          if (handle.includes("w")) x = it.x + it.w - w;
          if (handle.includes("n")) y = it.y + it.h - h;
        }
      }
      updateItem(it.id, { x, y, w, h }, !recorded);
      recorded = true;
      setGuides({ x: gx, y: gy });
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  // --- Événements simulés : envoyés à tous les widgets de la scène ---
  const register = useCallback((itemId: string, el: HTMLIFrameElement | null) => {
    if (el) frames.current.set(itemId, el);
    else frames.current.delete(itemId);
  }, []);
  const dispatch = (detail: unknown) => {
    for (const el of frames.current.values()) el.contentWindow?.postMessage(labEventMessage(detail, platform), "*");
  };

  // --- Calques (du plus haut au plus bas), réordonnables par poignée ---
  const layers = [...data.items].sort((a, b) => b.z - a.z);
  const sort = usePointerSort((from, to) => {
    const order = [...layers];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    const n = order.length;
    setData((d) => ({ ...d, items: d.items.map((it) => ({ ...it, z: n - order.findIndex((o) => o.id === it.id) })) }));
  });

  const widgetName = (wid: string) => byId.get(wid)?.name;
  const p = current?.props ?? {};
  const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? 0 : Math.round(Number(v)));

  return (
    <div className="cl-root">
      <Link href="/admin/laboratoire" onClick={(event) => { if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) event.preventDefault(); }} className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent"><MaterialIcon name="arrow_back" className="size-4" />Laboratoire</Link>
      <header className="cl-topbar">
        <div>
          <h1>{content.name}</h1>
          <p>Overlay · {data.width} × {data.height} · {pending ? "Enregistrement…" : dirty ? "Modifications à enregistrer" : "Enregistré"}</p>
        </div>
        <div className="cl-actions">
          <CustomLabPlatformSwitch platform={platform} onChange={setPlatform} />
          <button type="button" onClick={() => openLabMedia()} className="cl-secondary">Médias</button>
          <CustomLabDeliver id={id} kind={"overlay"} name={content.name} platform={platform} dirty={dirty} className="cl-secondary disabled:cursor-not-allowed disabled:opacity-50" />
          <button type="button" onClick={() => { try { download(JSON.stringify(parseLabContent(content), null, 2), `${slugifyWidgetName(content.name)}.json`, "application/json"); } catch (error) { setStatus(String(error)); } }} className="cl-secondary">Sauvegarde du projet</button>
        </div>
      </header>
      {status && <p role="status" className="cl-status">{status}</p>}
      <details className="cl-metadata">
        <summary>Nom, projet et format</summary>
        <div>
          <label>Nom<input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={content.name} maxLength={120} onChange={(e) => setContent({ ...content, name: e.target.value })} /></label>
          <label>Projet<input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" list="cl-projects" value={content.project} maxLength={120} onChange={(e) => setContent({ ...content, project: e.target.value })} /><datalist id="cl-projects">{projects.map((name) => <option key={name} value={name} />)}</datalist></label>
          <label>Format<select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={`${data.width}x${data.height}`} onChange={(e) => { const [w, h] = e.target.value.split("x").map(Number); setData((d) => ({ ...d, width: w, height: h })); }}>{[[1920, 1080], [1280, 720], [2560, 1440], [1080, 1920]].map(([w, h]) => <option key={`${w}x${h}`} value={`${w}x${h}`}>{w} × {h}{h > w ? " (vertical)" : ""}</option>)}</select></label>
        </div>
      </details>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["text", "image", "video", "shape"] as const).map((type) => (
          <button key={type} type="button" className={toolButton} onClick={() => type === "image" || type === "video" ? openLabMedia(type === "image" ? "image" : "video", (url) => add(type, { props: { ...createItem(data, type).props, src: url } })) : add(type)}>+ {ITEM_LABELS[type]}</button>
        ))}
        <select aria-label="Ajouter un widget de la bibliothèque" className={`${toolButton} !w-auto pr-8`} value="" onChange={(e) => { if (e.target.value) add("widget", { widgetId: e.target.value, name: byId.get(e.target.value)?.name, ...sourceSize(e.target.value) }); }}>
          <option value="">+ Widget ou alertes…</option>
          {sources.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.project} · {s.content.kind === "alertbox" ? "alertes" : "widget"}</option>)}
        </select>
        <span className="mx-1 h-5 w-px bg-[var(--cl-line)]" />
        <button type="button" className={toolButton} onClick={undo} disabled={!hist.undo} title="Annuler (Ctrl + Z)"><MaterialIcon name="undo" className="size-4" />Annuler</button>
        <button type="button" className={toolButton} onClick={redo} disabled={!hist.redo} title="Rétablir (Ctrl + Y)"><MaterialIcon name="redo" className="size-4" />Rétablir</button>
        <span className="ml-auto text-[11px] text-[var(--cl-muted)]">Zoom {Math.round(scale * 100)} % · Alt : sans aimantation · Maj : proportions</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={stageBox} className="min-w-0">
          <div className="relative overflow-hidden rounded-md border border-[var(--cl-line)]" style={{ width: data.width * scale, height: data.height * scale }} onPointerDown={() => setSelected(null)}>
            <div className="absolute left-0 top-0 origin-top-left bg-[repeating-conic-gradient(#1b1d26_0_25%,#14161d_0_50%)] bg-[length:32px_32px]" style={{ width: data.width, height: data.height, transform: `scale(${scale})` }}>
              {[...data.items].sort((a, b) => a.z - b.z).map((item) =>
                item.hidden ? null : (
                  <div
                    key={item.id}
                    onPointerDown={(e) => startDrag(e, item)}
                    onDoubleClick={() => setPanel("props")}
                    className={`absolute select-none ${item.locked ? "" : "cursor-move"}`}
                    style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z }}
                  >
                    <ItemContent item={item} source={item.widgetId ? byId.get(item.widgetId) : undefined} platform={platform} register={register} />
                    {selected === item.id && (
                      <div className="pointer-events-none absolute inset-0 outline outline-[3px] outline-[var(--cl-accent)]" style={{ outlineWidth: 2 / scale }}>
                        {!item.locked &&
                          HANDLES.map((h) => (
                            <span
                              key={h}
                              onPointerDown={(e) => startDrag(e, item, h)}
                              className={`pointer-events-auto absolute rounded-sm border border-[#0d0f13] bg-[var(--cl-accent)] ${handlePos[h]}`}
                              style={{ width: 12 / scale, height: 12 / scale }}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                ),
              )}
              {guides.x !== null && <div className="pointer-events-none absolute top-0 h-full bg-pink-400" style={{ left: guides.x, width: 1 / scale, zIndex: 100000 }} />}
              {guides.y !== null && <div className="pointer-events-none absolute left-0 w-full bg-pink-400" style={{ top: guides.y, height: 1 / scale, zIndex: 100000 }} />}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--cl-muted)]">Clic : sélectionner · Glisser : déplacer · Poignées : redimensionner · Flèches : décaler (Maj : 10 px) · Suppr : supprimer · Ctrl + D : dupliquer</p>
        </div>

        <aside className="cl-fields !static !max-h-none">
          <div className="cl-side-tabs" role="tablist" aria-label="Panneau de l'overlay">
            <button role="tab" aria-selected={panel === "layers"} onClick={() => setPanel("layers")}>Calques ({data.items.length})</button>
            <button role="tab" aria-selected={panel === "props"} onClick={() => setPanel("props")}>Propriétés</button>
          </div>

          {panel === "layers" ? (
            <ul data-sort-list className="mt-4 space-y-1">
              {layers.map((item, i) => {
                const handle = sort.handle(i);
                return (
                  <li key={item.id} className={`flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs ${selected === item.id ? "border-[var(--cl-accent)] bg-[#ac8bfa1a]" : "border-[var(--cl-line)]"} ${sort.drag?.from === i ? "opacity-40" : ""}`}>
                    <span {...handle} role="button" tabIndex={0} aria-label={`Déplacer le calque ${itemLabel(item, widgetName)}`} className="inline-flex cursor-grab text-[var(--cl-muted)]"><MaterialIcon name="drag_indicator" className="size-4" /></span>
                    <button type="button" onClick={() => { setSelected(item.id); setPanel("props"); }} className="min-w-0 flex-1 truncate text-left">
                      <span className="mr-1 text-[10px] text-[var(--cl-muted)]">{ITEM_LABELS[item.type]}</span>
                      {itemLabel(item, widgetName)}
                    </button>
                    <button type="button" onClick={() => updateItem(item.id, { hidden: !item.hidden })} title={item.hidden ? "Afficher" : "Masquer"} aria-label={item.hidden ? "Afficher le calque" : "Masquer le calque"} className={`inline-flex ${item.hidden ? "text-[var(--cl-muted)]" : ""}`}><MaterialIcon name={item.hidden ? "visibility_off" : "visibility"} className="size-4" /></button>
                    <button type="button" onClick={() => updateItem(item.id, { locked: !item.locked })} title={item.locked ? "Déverrouiller" : "Verrouiller"} aria-label={item.locked ? "Déverrouiller le calque" : "Verrouiller le calque"} className={`inline-flex ${item.locked ? "text-[var(--cl-accent)]" : "text-[var(--cl-muted)]"}`}><MaterialIcon name={item.locked ? "lock" : "lock_open"} className="size-4" /></button>
                  </li>
                );
              })}
              {!data.items.length && <p className="cl-field-hint">Aucun calque : ajoute un texte, une image ou un widget.</p>}
            </ul>
          ) : !current ? (
            <p className="cl-field-hint mt-4">Sélectionne un calque dans la scène ou dans la liste des calques.</p>
          ) : (
            <div className="mt-4 grid gap-3 text-xs">
              <label className="grid gap-1">Nom du calque<input className={input} value={current.name ?? ""} placeholder={itemLabel({ ...current, name: undefined }, widgetName)} onChange={(e) => updateItem(current.id, { name: e.target.value })} /></label>
              <div className="grid grid-cols-4 gap-2">
                {(["x", "y", "w", "h"] as const).map((k) => (
                  <label key={k} className="grid gap-1">{k === "w" ? "Larg." : k === "h" ? "Haut." : k.toUpperCase()}<input className={input} type="number" value={current[k]} onChange={(e) => updateItem(current.id, { [k]: k === "w" || k === "h" ? Math.max(MIN_ITEM_SIZE, num(e.target.value)) : num(e.target.value) })} /></label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={toolButton} onClick={() => updateItem(current.id, { x: Math.round((data.width - current.w) / 2) })}><MaterialIcon name="align_horizontal_center" className="size-4" />Centrer</button>
                <button type="button" className={toolButton} onClick={() => updateItem(current.id, { y: Math.round((data.height - current.h) / 2) })}><MaterialIcon name="align_vertical_center" className="size-4" />Centrer</button>
                <button type="button" className={toolButton} onClick={() => updateItem(current.id, { x: 0, y: 0, w: data.width, h: data.height })}><MaterialIcon name="fullscreen" className="size-4" />Plein écran</button>
              </div>

              {current.type === "text" && (
                <>
                  <label className="grid gap-1">Texte<textarea className={`${input} min-h-20`} value={String(p.content ?? "")} onChange={(e) => updateProps(current.id, { content: e.target.value })} /></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1">Taille<input className={input} type="number" value={Number(p.fontSize) || 48} onChange={(e) => updateProps(current.id, { fontSize: Math.max(6, num(e.target.value)) })} /></label>
                    <label className="grid gap-1">Graisse<select className={input} value={Number(p.fontWeight) || 700} onChange={(e) => updateProps(current.id, { fontWeight: Number(e.target.value) })}>{[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}</select></label>
                    <label className="grid gap-1">Couleur<input type="color" className="h-8 w-full" value={String(p.color || "#ffffff")} onChange={(e) => updateProps(current.id, { color: e.target.value })} /></label>
                    <label className="grid gap-1">Alignement<select className={input} value={String(p.align || "left")} onChange={(e) => updateProps(current.id, { align: e.target.value })}><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select></label>
                  </div>
                  <label className="grid gap-1">Police (nom CSS)<input className={input} value={String(p.fontFamily || "")} placeholder="ex. Lexend, Poppins" onChange={(e) => updateProps(current.id, { fontFamily: e.target.value || "inherit" })} /></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(p.shadow)} onChange={(e) => updateProps(current.id, { shadow: e.target.checked })} /> Ombre portée</label>
                  {Boolean(p.shadow) && (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="grid gap-1">Couleur<input type="color" className="h-8 w-full" value={String(p.shadowColor || "#000000")} onChange={(e) => updateProps(current.id, { shadowColor: e.target.value })} /></label>
                      <label className="grid gap-1">Flou<input className={input} type="number" value={Number(p.shadowBlur) || 0} onChange={(e) => updateProps(current.id, { shadowBlur: Math.max(0, num(e.target.value)) })} /></label>
                    </div>
                  )}
                </>
              )}

              {(current.type === "image" || current.type === "video") && (
                <>
                  <label className="grid gap-1">Adresse<input className={input} value={String(p.src || "")} placeholder="https://…" onChange={(e) => updateProps(current.id, { src: e.target.value })} /></label>
                  <button type="button" className={toolButton} onClick={() => openLabMedia(current.type === "image" ? "image" : "video", (url) => updateProps(current.id, { src: url }))}>Choisir dans les médias…</button>
                  <label className="grid gap-1">Ajustement<select className={input} value={String(p.fit || "contain")} onChange={(e) => updateProps(current.id, { fit: e.target.value })}><option value="contain">Contenu entier</option><option value="cover">Remplir (recadré)</option><option value="fill">Étirer</option></select></label>
                  {current.type === "video" && (
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={p.loop !== false} onChange={(e) => updateProps(current.id, { loop: e.target.checked })} /> En boucle</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={p.muted !== false} onChange={(e) => updateProps(current.id, { muted: e.target.checked })} /> Muette</label>
                    </div>
                  )}
                </>
              )}

              {current.type === "shape" && (
                <>
                  <label className="grid gap-1">Forme<select className={input} value={String(p.shape || "rectangle")} onChange={(e) => updateProps(current.id, { shape: e.target.value })}><option value="rectangle">Rectangle</option><option value="ellipse">Ellipse</option></select></label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1">Remplissage<input type="color" className="h-8 w-full" value={String(p.fill || "#7c5cff")} onChange={(e) => updateProps(current.id, { fill: e.target.value })} /></label>
                    <label className="grid gap-1">Opacité ({Math.round((p.opacity === undefined ? 1 : Number(p.opacity)) * 100)} %)<input type="range" min="0" max="1" step="0.05" value={p.opacity === undefined ? 1 : Number(p.opacity)} onChange={(e) => updateProps(current.id, { opacity: Number(e.target.value) })} /></label>
                    <label className="grid gap-1">Bordure<input type="color" className="h-8 w-full" value={String(p.stroke || "#ffffff")} onChange={(e) => updateProps(current.id, { stroke: e.target.value })} /></label>
                    <label className="grid gap-1">Épaisseur<input className={input} type="number" value={Number(p.strokeWidth) || 0} onChange={(e) => updateProps(current.id, { strokeWidth: Math.max(0, num(e.target.value)) })} /></label>
                    {p.shape !== "ellipse" && <label className="grid gap-1">Arrondi<input className={input} type="number" value={Number(p.radius) || 0} onChange={(e) => updateProps(current.id, { radius: Math.max(0, num(e.target.value)) })} /></label>}
                  </div>
                </>
              )}

              {current.type === "widget" && (
                <>
                  <label className="grid gap-1">Création affichée<select className={input} value={current.widgetId ?? ""} onChange={(e) => updateItem(current.id, { widgetId: e.target.value || undefined })}><option value="">— Choisir —</option>{sources.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.project}</option>)}</select></label>
                  {currentSize && <button type="button" className={toolButton} onClick={() => updateItem(current.id, { w: currentSize.width, h: currentSize.height })}><MaterialIcon name="fullscreen" className="size-4" />Taille d’origine ({currentSize.width} × {currentSize.height})</button>}
                  {current.widgetId && <Link href={`/admin/laboratoire/${current.widgetId}`} className="inline-flex items-center gap-1 text-[var(--cl-accent)] hover:underline">Ouvrir cette création dans l’éditeur<MaterialIcon name="arrow_forward" className="size-4" /></Link>}
                  <p className="cl-field-hint">Le widget s’affiche avec ses réglages actuels. Les événements simulés (bouton en bas à droite) lui sont envoyés.</p>
                </>
              )}

              <div className="flex flex-wrap gap-2 border-t border-[var(--cl-line)] pt-3">
                <button type="button" className={toolButton} onClick={() => duplicate(current.id)}>Dupliquer</button>
                <button type="button" className={`${toolButton} hover:!border-red-400 hover:text-red-300`} onClick={() => remove(current.id)}>Supprimer le calque</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <CustomLabMedia />
      <CustomLabSimulator platform={platform} dispatch={dispatch} onStatus={setStatus} />
    </div>
  );
}
