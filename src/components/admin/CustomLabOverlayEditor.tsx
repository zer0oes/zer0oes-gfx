"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { createLabSourceAction, saveLabAction } from "@/app/admin/custom-lab-actions";
import { OVERLAY_ICONS, isOverlayIcon } from "@/lib/custom-lab/icons";
import { parseLabContent } from "@/lib/custom-lab/model";
import { DEFAULT_OVERLAY, ITEM_LABELS, MAX_GUIDES, MIN_ITEM_SIZE, createItem, itemLabel, itemsBounds, newItemId, snapGuide, snapPosition, snapTargets, type OverlayData, type OverlayItem, type OverlayItemType } from "@/lib/custom-lab/overlay";
import { buildLabPreview, labEventMessage, labLoadMessage } from "@/lib/custom-lab/preview";
import { widgetInstance } from "@/lib/custom-lab/widget-instance";
import type { Platform } from "@/lib/custom-lab/platformEvents";
import type { LabContent, LabDocument } from "@/lib/custom-lab/types";
import { slugifyWidgetName } from "@/lib/custom-lab/widgetExport";
import { CustomLabMedia, openLabMedia } from "./CustomLabMedia";
import { CustomLabSimulator } from "./CustomLabSimulator";
import { usePointerSort } from "./usePointerSort";
import { shift, SortPreview } from "./SortableRows";
import "./custom-lab.css";
import { MaterialIcon, type MaterialIconName } from "./MaterialIcon";
import { CustomLabWidgetSettings } from "./CustomLabWidgetSettings";
import { CustomLabActions } from "./CustomLabActions";
import { CustomLabProjectField } from "./CustomLabProjectField";

// Création utilisable dans un calque « widget » (widget ou pack d'alertes de la bibliothèque)
export type OverlaySource = { id: string; name: string; project: string; content: LabContent };

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const toolButton = "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-accent";
// Barre d'outils façon StreamerLab : boutons carrés à icône, groupes séparés par des filets verticaux
const toolIcon = "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-[var(--cl-line)] bg-[#1b1d26] text-[#e3e5ec] transition-colors hover:border-[var(--cl-accent)] disabled:pointer-events-none disabled:opacity-35";
const toolActive = "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--cl-accent)] text-[#0d0f13]";
const ToolSeparator = () => <span aria-hidden="true" className="w-px self-stretch bg-[var(--cl-line)]" />;
// Paliers du zoom manuel (« Ajuster » revient à la scène ajustée à la largeur)
const ZOOM_STEPS = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2];
type Align = "left" | "hcenter" | "right" | "top" | "vcenter" | "bottom" | "center";
const ALIGN_TOOLS: { key: Align; icon: MaterialIconName; label: string }[] = [
  { key: "left", icon: "align_horizontal_left", label: "Aligner à gauche" },
  { key: "hcenter", icon: "align_horizontal_center", label: "Centrer horizontalement" },
  { key: "right", icon: "align_horizontal_right", label: "Aligner à droite" },
  { key: "top", icon: "align_vertical_top", label: "Aligner en haut" },
  { key: "vcenter", icon: "align_vertical_center", label: "Centrer verticalement" },
  { key: "bottom", icon: "align_vertical_bottom", label: "Aligner en bas" },
  { key: "center", icon: "filter_center_focus", label: "Centrer dans la scène" },
];
// Règles autour de la scène (épaisseur en px d'écran) ; graduation choisie pour rester lisible au zoom courant
const RULER = 20;
function Ruler({ side, size, scale, onPointerDown }: { side: "top" | "left"; size: number; scale: number; onPointerDown: (e: React.PointerEvent) => void }) {
  const step = [10, 25, 50, 100, 200, 250, 500, 1000].find((n) => n * scale >= 60) ?? 1000;
  const ticks = Array.from({ length: Math.floor(size / step) + 1 }, (_, i) => i * step);
  const top = side === "top";
  return (
    <div
      onPointerDown={onPointerDown}
      title="Glisse vers la scène pour poser un repère"
      className={`relative select-none overflow-hidden bg-[#12141b] text-[9px] leading-none text-[var(--cl-muted)] ${top ? "cursor-row-resize border-b" : "cursor-col-resize border-r"} border-[var(--cl-line)]`}
      style={top ? { width: size * scale, height: RULER } : { width: RULER, height: size * scale }}
    >
      {ticks.map((v) => (
        <span key={v} className="absolute border-[var(--cl-line)]" style={top ? { left: v * scale, top: 0, height: RULER, borderLeftWidth: 1, paddingLeft: 2, paddingTop: 2 } : { top: v * scale, left: 0, width: RULER, borderTopWidth: 1, paddingTop: 2, paddingLeft: 2, writingMode: "vertical-rl" }}>{v}</span>
      ))}
    </div>
  );
}
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

const TYPE_ICONS: Record<OverlayItemType, MaterialIconName> = { text: "title", image: "image", video: "movie", shape: "category", widget: "widgets" };

// Réglages propres à un calque widget (au moins une valeur modifiée sur une plateforme)
const hasOverrides = (item: OverlayItem) => Object.values((item.props.widgetOverrides ?? {}) as Record<string, Record<string, unknown>>).some((o) => o && Object.keys(o).length > 0);

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
  if (item.type === "image" && isOverlayIcon(p.icon)) {
    return <svg viewBox="0 0 24 24" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path fill={String(p.iconColor || "#ffffff")} d={OVERLAY_ICONS[p.icon].path} /></svg>;
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

const noSubscribe = () => () => {};

// Widget ou pack d'alertes de la bibliothèque, rendu dans une iframe isolée (comme dans l'éditeur de widgets)
function WidgetFrame({ item, source, platform, register }: { item: OverlayItem; source?: OverlaySource; platform: Platform; register: (id: string, el: HTMLIFrameElement | null) => void }) {
  // Réglages propres au calque (surcharges par plateforme) appliqués au modèle, comme dans la page livrée
  const overrides = JSON.stringify(item.props.widgetOverrides ?? null);
  const preview = useMemo(() => (source ? buildLabPreview(widgetInstance(source.content, { widgetOverrides: JSON.parse(overrides) }, platform), platform, { transparent: true }) : null), [source, platform, overrides]);
  const frame = useRef<HTMLIFrameElement | null>(null);
  // Rendue côté serveur, l'iframe finirait de charger avant que onLoad soit branché : le widget ne recevrait
  // jamais ses valeurs (onWidgetLoad). Elle n'est donc créée que dans le navigateur.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  if (!source) return <Placeholder label="Widget : choisis une création" />;
  if (!hydrated) return null;
  if (!preview?.source) return <Placeholder label={preview?.error || "Aperçu indisponible"} />;
  return (
    <iframe
      // Rechargé à chaque changement de réglage : beaucoup de widgets ne lisent leurs valeurs qu'au chargement (onWidgetLoad)
      key={`${platform}:${overrides}`}
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
  const initialContent: LabContent = { name: initial.name, description: initial.description ?? "", project: initial.project, kind: "overlay", variants: initial.variants, overlay: initial.overlay ?? DEFAULT_OVERLAY };
  const [content, setContent] = useState<LabContent>(initialContent);
  const [saved, setSaved] = useState(JSON.stringify(initialContent));
  const revision = useRef(initial.revision);
  const saving = useRef(false);
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  // Calques sélectionnés (Maj + clic pour en ajouter ou en retirer) ; un calque groupé entraîne tout son groupe
  const [selection, setSelection] = useState<string[]>([]);
  const selected = selection.length === 1 ? selection[0] : null;
  const setSelected = useCallback((itemId: string | null) => setSelection(itemId ? [itemId] : []), []);
  const [hovered, setHovered] = useState<string | null>(null);
  const [panel, setPanel] = useState<"layers" | "props">("layers");
  // Un overlay ne s'installe que sur StreamElements : ses widgets utilisent leur code StreamElements
  const platform: Platform = "streamelements";
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [fitScale, setFitScale] = useState(0.5);
  // null : scène ajustée à la largeur disponible ; sinon zoom choisi avec − / +
  const [zoom, setZoom] = useState<number | null>(null);
  const scale = zoom ?? fitScale;
  // Règles et repères (bouton règle de la barre d'outils)
  const [rulers, setRulers] = useState(false);
  const [guideDrag, setGuideDrag] = useState<{ axis: "x" | "y"; index: number | null; pos: number; inside: boolean } | null>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  // Pipette : style copié d'un texte ou d'une forme, appliqué aux calques du même type cliqués ensuite
  const [stylePick, setStylePick] = useState<{ type: OverlayItemType; style: Record<string, unknown> } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const addMenu = useRef<HTMLDivElement>(null);
  const confirmDelete = useRef<HTMLDialogElement>(null);
  // Fenêtres du menu « Ajouter » : bibliothèque, icônes, média depuis un lien
  const [picker, setPicker] = useState<"library" | "icon" | "link" | null>(null);
  const [link, setLink] = useState("");
  const past = useRef<OverlayData[]>([]);
  const future = useRef<OverlayData[]>([]);
  // Nombre d'étapes à annuler / rétablir (copie des piles, lisible pendant le rendu)
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const stageBox = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  const data = content.overlay ?? DEFAULT_OVERLAY;
  const dirty = JSON.stringify(content) !== saved;
  // Créations ajoutées depuis « Nouveau widget » / « Nouvelle alerte » pendant la session
  const [created, setCreated] = useState<OverlaySource[]>([]);
  const allSources = useMemo(() => [...sources, ...created], [sources, created]);
  const byId = useMemo(() => new Map(allSources.map((s) => [s.id, s])), [allSources]);
  const current = data.items.find((it) => it.id === selected) ?? null;
  // Taille d'origine de la création affichée dans le calque widget sélectionné
  const currentSize = current?.type === "widget" && current.widgetId ? byId.get(current.widgetId)?.content.size : undefined;
  const selectedItems = data.items.filter((it) => selection.includes(it.id));
  // Identifiants donnés, complétés par tous les membres de leurs groupes
  const withGroups = (ids: string[]) => {
    const groups = new Set(data.items.filter((it) => ids.includes(it.id) && it.group).map((it) => it.group));
    return data.items.filter((it) => ids.includes(it.id) || (it.group && groups.has(it.group))).map((it) => it.id);
  };
  const select = (itemId: string, additive = false) => {
    const ids = withGroups([itemId]);
    setSelection((sel) => (!additive ? ids : ids.every((x) => sel.includes(x)) ? sel.filter((x) => !ids.includes(x)) : [...sel, ...ids.filter((x) => !sel.includes(x))]));
  };

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
  const remove = useCallback((ids: string[]) => {
    setData((d) => ({ ...d, items: d.items.filter((it) => !ids.includes(it.id)) }));
    setSelection([]);
  }, [setData]);
  // Copies décalées, au-dessus des autres calques ; un groupe copié devient un nouveau groupe
  const duplicate = useCallback((ids: string[]) => {
    const originals = data.items.filter((x) => ids.includes(x.id)).sort((a, b) => a.z - b.z);
    if (!originals.length) return;
    const top = Math.max(...data.items.map((x) => x.z), 0);
    const groups = new Map<string, string>();
    const copyGroup = (g: string) => groups.get(g) ?? groups.set(g, newItemId().replace("it-", "g-")).get(g);
    const copies = originals.map((it, i) => ({ ...structuredClone(it), id: newItemId(), x: it.x + 24, y: it.y + 24, z: top + i + 1, name: it.name ? `${it.name} (copie)` : undefined, group: it.group ? copyGroup(it.group) : undefined }));
    setData((d) => ({ ...d, items: [...d.items, ...copies] }));
    setSelection(copies.map((c) => c.id));
  }, [data.items, setData]);
  const canGroup = selection.length > 1 && !(selectedItems.every((it) => it.group) && new Set(selectedItems.map((it) => it.group)).size === 1);
  const canUngroup = selectedItems.some((it) => it.group);
  const group = () => {
    if (!canGroup) return;
    const g = newItemId().replace("it-", "g-");
    setData((d) => ({ ...d, items: d.items.map((it) => (selection.includes(it.id) ? { ...it, group: g } : it)) }));
    setStatus(`${selection.length} calques groupés.`);
  };
  const ungroup = () => {
    if (!canUngroup) return;
    setData((d) => ({ ...d, items: d.items.map((it) => (selection.includes(it.id) ? { ...it, group: undefined } : it)) }));
    setStatus("Calques dégroupés.");
  };
  const applyStyle = (item: OverlayItem) => {
    if (!stylePick) return;
    if (item.type !== stylePick.type || item.locked) return setStatus(`La pipette s’applique ${stylePick.type === "text" ? "à un calque texte" : "à une forme"} non verrouillé${stylePick.type === "text" ? "" : "e"}.`);
    updateProps(item.id, stylePick.style);
    setStatus(`Style appliqué à « ${itemLabel(item, widgetName)} ».`);
  };

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
      if (e.key === "Escape" && stylePick) {
        setStylePick(null);
        setStatus("");
        return;
      }
      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (e.shiftKey) ungroup();
        else group();
        return;
      }
      if (!selection.length) return;
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicate(selection);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        remove(selection);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setData((d) => ({ ...d, items: d.items.map((it) => (selection.includes(it.id) && !it.locked ? { ...it, x: it.x + dx, y: it.y + dy } : it)) }));
      } else if (e.key === "Escape") setSelection([]);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  // --- Échelle de la scène (ajustée à la largeur disponible) ---
  useEffect(() => {
    const el = stageBox.current;
    if (!el) return;
    const fit = () => setFitScale(Math.min(1, (el.clientWidth - (rulers ? RULER : 0)) / data.width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data.width, rulers]);

  // --- Déplacement et redimensionnement à la souris ---
  // Clic sur un calque : pipette, sélection (Maj : ajoute ou retire), puis déplacement de toute la sélection
  // (aimantée sur son rectangle englobant) ou redimensionnement d'un calque seul par ses poignées
  function startDrag(e: React.PointerEvent, item: OverlayItem, handle?: Handle) {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (stylePick) return applyStyle(item);
    if (e.shiftKey && !handle) return select(item.id, true);
    const movers = handle || selection.includes(item.id) ? (handle ? [item.id] : selection) : withGroups([item.id]);
    if (!selection.includes(item.id)) setSelection(movers);
    if (item.locked) return;
    e.preventDefault();
    const moving = data.items.filter((it) => movers.includes(it.id) && !it.locked);
    const starts = new Map(moving.map((it) => [it.id, { x: it.x, y: it.y }]));
    const box = itemsBounds(moving);
    const start = { x: e.clientX, y: e.clientY, item: { ...item } };
    const tx = snapTargets(data, "x", movers, rulers);
    const ty = snapTargets(data, "y", movers, rulers);
    const threshold = 8 / scale;
    let recorded = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / scale;
      const dy = (ev.clientY - start.y) / scale;
      if (!recorded && Math.abs(dx) + Math.abs(dy) < 1) return;
      let gx: number | null = null;
      let gy: number | null = null;
      if (!handle) {
        const sx = ev.altKey ? { pos: Math.round(box.x + dx), guide: null } : snapPosition(box.x + dx, box.w, tx, threshold);
        const sy = ev.altKey ? { pos: Math.round(box.y + dy), guide: null } : snapPosition(box.y + dy, box.h, ty, threshold);
        const ox = sx.pos - box.x;
        const oy = sy.pos - box.y;
        gx = sx.guide;
        gy = sy.guide;
        setData((d) => ({ ...d, items: d.items.map((it) => { const p0 = starts.get(it.id); return p0 ? { ...it, x: p0.x + ox, y: p0.y + oy } : it; }) }), !recorded);
      } else {
        const it = start.item;
        let { x, y, w, h } = it;
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
        updateItem(it.id, { x, y, w, h }, !recorded);
      }
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

  // --- Repères : tirés d'une règle (top : horizontal, gauche : vertical), déplacés, ou supprimés en les ramenant
  // sur la règle. Attirés par le centre de la scène, ou par les bords et le centre de la sélection.
  function startGuide(e: React.PointerEvent, axis: "x" | "y", index: number | null) {
    if (e.button !== 0 || !stageEl.current) return;
    e.preventDefault();
    e.stopPropagation();
    const size = axis === "x" ? data.width : data.height;
    const box = selectedItems.length ? itemsBounds(selectedItems) : null;
    const targets = box ? (axis === "x" ? [box.x, box.x + box.w / 2, box.x + box.w] : [box.y, box.y + box.h / 2, box.y + box.h]) : [size / 2];
    const at = (ev: { clientX: number; clientY: number }) => {
      const r = stageEl.current!.getBoundingClientRect();
      const raw = (axis === "x" ? ev.clientX - r.left : ev.clientY - r.top) / scale;
      return { axis, index, pos: snapGuide(raw, targets, 8 / scale), inside: raw >= 0 && raw <= size };
    };
    setGuideDrag(at(e));
    const move = (ev: PointerEvent) => setGuideDrag(at(ev));
    const end = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      const { pos, inside } = at(ev);
      setGuideDrag(null);
      if (index === null && !inside) return;
      setData((d) => {
        const list = [...(d.guides?.[axis] ?? [])];
        if (index !== null) list.splice(index, 1);
        if (inside) list.push(pos);
        return { ...d, guides: { x: d.guides?.x ?? [], y: d.guides?.y ?? [], [axis]: list.slice(0, MAX_GUIDES) } };
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  // --- Barre d'outils : alignement dans la scène, pipette, zoom, menu « Ajouter » ---
  // Un calque seul ou un groupe s'aligne sur la scène ; plusieurs calques s'alignent entre eux
  // (« Centrer dans la scène » déplace toujours la sélection d'un bloc)
  const align = (key: Align) => {
    const items = selectedItems.filter((it) => !it.locked);
    if (!items.length) return;
    const block = itemsBounds(items);
    const asBlock = key === "center" || items.length === 1 || (Boolean(items[0].group) && items.every((it) => it.group === items[0].group));
    const ref = asBlock ? { x: 0, y: 0, w: data.width, h: data.height } : block;
    const place = (pos: number, len: number, start: number, size: number, where: "start" | "middle" | "end" | null) => (where === "start" ? start : where === "end" ? start + size - len : where === "middle" ? Math.round(start + (size - len) / 2) : pos);
    const hx = key === "left" ? "start" : key === "right" ? "end" : key === "hcenter" || key === "center" ? "middle" : null;
    const vy = key === "top" ? "start" : key === "bottom" ? "end" : key === "vcenter" || key === "center" ? "middle" : null;
    const ids = items.map((it) => it.id);
    setData((d) => ({
      ...d,
      items: d.items.map((it) => {
        if (!ids.includes(it.id)) return it;
        if (asBlock) return { ...it, x: it.x + place(block.x, block.w, ref.x, ref.w, hx) - block.x, y: it.y + place(block.y, block.h, ref.y, ref.h, vy) - block.y };
        return { ...it, x: place(it.x, it.w, ref.x, ref.w, hx), y: place(it.y, it.h, ref.y, ref.h, vy) };
      }),
    }));
  };
  // Pipette : copie le style complet (tout sauf le texte) du calque texte ou de la forme sélectionné
  const pickStyle = () => {
    if (stylePick) {
      setStylePick(null);
      return setStatus("");
    }
    if (current?.type !== "text" && current?.type !== "shape") return setStatus("Sélectionne d’abord un calque texte ou une forme dont tu veux copier le style.");
    setStylePick({ type: current.type, style: Object.fromEntries(Object.entries(current.props).filter(([k]) => k !== "content")) });
    setStatus(`Style copié : clique sur ${current.type === "text" ? "un calque texte" : "une forme"} pour l’appliquer. Échap ou la pipette pour arrêter.`);
  };
  // « Nouveau widget » / « Nouvelle alerte » : création rangée dans le projet de l'overlay, posée comme calque
  // et ouverte dans un nouvel onglet pour être éditée
  const createSource = async (kind: "widget" | "alertbox") => {
    setAddOpen(false);
    const tab = window.open("", "_blank");
    const result = await createLabSourceAction(kind, content.project);
    if (!result.ok) {
      tab?.close();
      return setStatus(result.message);
    }
    const source = result.source;
    setCreated((list) => [...list, source]);
    const size = source.content.size;
    add("widget", { widgetId: source.id, name: source.name, ...(size ? { w: size.width, h: size.height, x: Math.round((data.width - size.width) / 2), y: Math.round((data.height - size.height) / 2) } : {}) });
    if (tab) tab.location.href = `/admin/laboratoire/${source.id}`;
    setStatus(`${kind === "alertbox" ? "Nouvelle alerte créée" : "Nouveau widget créé"} dans « ${source.project} » et ouvert dans un nouvel onglet.`);
  };
  const addIcon = (icon: string) => {
    setPicker(null);
    add("image", { name: OVERLAY_ICONS[icon].label, w: 160, h: 160, x: Math.round((data.width - 160) / 2), y: Math.round((data.height - 160) / 2), props: { icon, iconColor: "#ffffff", fit: "contain" } });
  };
  // Image ou vidéo par son adresse (vidéo reconnue à son extension)
  const addLink = () => {
    const url = link.trim();
    if (!/^https:\/\/\S+$/.test(url)) return setStatus("Colle une adresse qui commence par https://");
    const type = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url) ? "video" : "image";
    setPicker(null);
    setLink("");
    add(type, { props: { ...createItem(data, type).props, src: url } });
  };
  const addSource = (source: OverlaySource) => {
    setPicker(null);
    add("widget", { widgetId: source.id, name: source.name, ...sourceSize(source.id) });
  };
  const zoomBy = (dir: 1 | -1) => setZoom(dir > 0 ? ZOOM_STEPS.find((z) => z > scale + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1] : [...ZOOM_STEPS].reverse().find((z) => z < scale - 0.001) ?? ZOOM_STEPS[0]);
  useEffect(() => {
    if (!addOpen) return;
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !addMenu.current?.contains(event.target as Node)) setAddOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [addOpen]);

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
  // Même glissement que les autres listes de l'admin : les lignes s'écartent, un emplacement en pointillé marque le dépôt
  const layerList = useRef<HTMLUListElement>(null);
  useEffect(() => shift(layerList.current, sort.drag), [sort.drag]);

  const widgetName = (wid: string) => byId.get(wid)?.name;
  const p = current?.props ?? {};
  const num = (v: string) => (v.trim() === "" || !Number.isFinite(Number(v)) ? 0 : Math.round(Number(v)));

  return (
    <div className="cl-root">
      <Link href="/admin/laboratoire" onClick={(event) => { if (dirty && !window.confirm("Quitter sans enregistrer les modifications ?")) event.preventDefault(); }} className="text-sm text-muted hover:text-foreground">← Laboratoire</Link>
      <header className="cl-topbar">
        <div>
          <h1>{content.name}</h1>
          <p>Overlay · {data.width} × {data.height} · {pending ? "Enregistrement…" : dirty ? "Modifications à enregistrer" : "Enregistré"}</p>
        </div>
        <div className="cl-actions">
          <CustomLabActions id={id} kind={content.kind} name={content.name} platform={platform} dirty={dirty} onMedia={() => openLabMedia()} onBackup={() => { try { download(JSON.stringify(parseLabContent(content), null, 2), `${slugifyWidgetName(content.name)}.json`, "application/json"); } catch (error) { setStatus(String(error)); } }} />
        </div>
      </header>
      {status && <p role="status" className="cl-status">{status}</p>}
      <details className="cl-metadata">
        <summary>Nom, projet et format</summary>
        <div className="cl-metadata-grid">
          <label>Nom<input className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={content.name} maxLength={120} onChange={(e) => setContent({ ...content, name: e.target.value })} /></label>
          <CustomLabProjectField value={content.project} projects={projects} onChange={(project) => setContent((current) => ({ ...current, project }))} />
          <label>Format<select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={`${data.width}x${data.height}`} onChange={(e) => { const [w, h] = e.target.value.split("x").map(Number); setData((d) => ({ ...d, width: w, height: h })); }}>{[[1920, 1080], [1280, 720], [2560, 1440], [1080, 1920]].map(([w, h]) => <option key={`${w}x${h}`} value={`${w}x${h}`}>{w} × {h}{h > w ? " (vertical)" : ""}</option>)}</select></label>
          <label className="cl-span-all">Description<textarea className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={content.description ?? ""} maxLength={500} rows={2} placeholder="Usage, particularités, client…" onChange={(e) => setContent({ ...content, description: e.target.value })} /></label>
        </div>
      </details>

      <div role="toolbar" aria-label="Outils de l’overlay" className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--cl-line)] bg-[#12141b] p-2">
        <button type="button" className={stylePick ? toolIcon : toolActive} aria-pressed={!stylePick} onClick={() => { setStylePick(null); setStatus(""); }} aria-label="Sélection" title="Sélection (Maj + clic : plusieurs calques)"><MaterialIcon name="arrow_selector_tool" className="size-5" /></button>
        <button type="button" className={toolIcon} onClick={() => add("text")} aria-label="Ajouter un texte" title="Texte"><MaterialIcon name="title" className="size-5" /></button>
        <button type="button" className={stylePick ? toolActive : toolIcon} aria-pressed={Boolean(stylePick)} onClick={pickStyle} aria-label="Pipette" title="Pipette : copier le style du texte ou de la forme sélectionné"><MaterialIcon name="colorize" className="size-[18px]" /></button>
        <div ref={addMenu} className="relative">
          <button type="button" className={`${toolIcon} !w-auto gap-2 px-3 text-sm`} aria-haspopup="menu" aria-expanded={addOpen} onClick={() => setAddOpen(!addOpen)}><MaterialIcon name="add" className="size-4" />Ajouter<MaterialIcon name="expand_more" className="size-4" /></button>
          {addOpen && (
            <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-[var(--cl-line)] bg-[#151720] p-1.5 shadow-2xl">
              {([
                ["library", "Widget / Alerte", "widgets"],
                ["new-widget", "Nouveau widget", "add_circle"],
                ["new-alert", "Nouvelle alerte", "add_circle"],
                null,
                ["image", "Image", "image"],
                ["icon", "Icône", "star"],
                ["shape", "Forme", "category"],
                ["video", "Vidéo", "videocam"],
                ["link", "Depuis un lien", "link"],
              ] as const).map((entry, i) => entry === null ? <div key={i} className="-mx-1.5 my-1.5 border-t border-[var(--cl-line)]" /> : (
                <button key={entry[0]} type="button" role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#e3e5ec] hover:bg-[#ac8bfa1f]" onClick={() => {
                  const key = entry[0];
                  setAddOpen(false);
                  if (key === "new-widget" || key === "new-alert") void createSource(key === "new-alert" ? "alertbox" : "widget");
                  else if (key === "library" || key === "icon" || key === "link") setPicker(key);
                  else if (key === "shape") add("shape");
                  else openLabMedia(key, (url) => add(key, { props: { ...createItem(data, key).props, src: url } }));
                }}>
                  <MaterialIcon name={entry[2]} className="size-4 text-[var(--cl-muted)]" />{entry[1]}
                </button>
              ))}
            </div>
          )}
        </div>
        {selectedItems.length > 0 && (
          <>
            <ToolSeparator />
            {canGroup && <button type="button" className={toolIcon} onClick={group} aria-label="Grouper" title="Grouper (Ctrl + G)"><MaterialIcon name="select_all" className="size-[18px]" /></button>}
            {canUngroup && <button type="button" className={toolIcon} onClick={ungroup} aria-label="Dégrouper" title="Dégrouper (Ctrl + Maj + G)"><MaterialIcon name="deselect" className="size-[18px]" /></button>}
            <button type="button" className={toolIcon} onClick={() => duplicate(selection)} aria-label="Dupliquer" title="Dupliquer (Ctrl + D)"><MaterialIcon name="content_copy" className="size-[18px]" /></button>
            <button type="button" className={toolIcon} onClick={() => confirmDelete.current?.showModal()} aria-label="Supprimer" title="Supprimer"><MaterialIcon name="delete" className="size-[18px]" /></button>
            <ToolSeparator />
            {ALIGN_TOOLS.map((t) => (
              <button key={t.key} type="button" className={toolIcon} disabled={selectedItems.every((it) => it.locked)} onClick={() => align(t.key)} aria-label={t.label} title={t.label}><MaterialIcon name={t.icon} className="size-[18px]" /></button>
            ))}
          </>
        )}
        <ToolSeparator />
        <button type="button" className={rulers ? toolActive : toolIcon} aria-pressed={rulers} onClick={() => setRulers(!rulers)} aria-label="Règles et repères" title={rulers ? "Masquer les règles et les repères" : "Afficher les règles : glisse depuis une règle pour poser un repère"}><MaterialIcon name="straighten" className="size-5" /></button>
        <ToolSeparator />
        <div className="flex items-center gap-1">
          <button type="button" className={toolIcon} onClick={() => zoomBy(-1)} disabled={scale <= ZOOM_STEPS[0]} aria-label="Dézoomer" title="Dézoomer"><MaterialIcon name="remove" className="size-5" /></button>
          <button type="button" className="min-w-[4.5rem] rounded-lg px-2 py-2 text-sm text-[#e3e5ec] hover:bg-white/5" onClick={() => setZoom(null)} title="Ajuster la scène à la largeur">{zoom === null ? "Ajuster" : `${Math.round(scale * 100)} %`}</button>
          <button type="button" className={toolIcon} onClick={() => zoomBy(1)} disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]} aria-label="Zoomer" title="Zoomer"><MaterialIcon name="add" className="size-5" /></button>
        </div>
        <ToolSeparator />
        <button type="button" className={toolIcon} onClick={undo} disabled={!hist.undo} aria-label="Annuler" title="Annuler (Ctrl + Z)"><MaterialIcon name="undo" className="size-5" /></button>
        <button type="button" className={toolIcon} onClick={redo} disabled={!hist.redo} aria-label="Rétablir" title="Rétablir (Ctrl + Y)"><MaterialIcon name="redo" className="size-5" /></button>
      </div>
      <dialog ref={confirmDelete} aria-label="Es-tu sûre de vouloir supprimer ?" onClick={(event) => { if (event.target === event.currentTarget) confirmDelete.current?.close(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl backdrop:bg-black/70">
        <p className="font-display text-lg font-bold">Es-tu sûre de vouloir supprimer ?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => confirmDelete.current?.close()} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">Annuler</button>
          <button type="button" onClick={() => { remove(selection); confirmDelete.current?.close(); }} className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">Supprimer</button>
        </div>
      </dialog>
      {picker && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) setPicker(null); }} onKeyDown={(e) => { if (e.key === "Escape") setPicker(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cl-picker-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--cl-line)] bg-[#12141b] shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-[var(--cl-line)] px-5 py-4">
              <div><span className="cl-eyebrow">OVERLAY</span><h2 id="cl-picker-title" className="font-semibold text-[#e3e5ec]">{picker === "library" ? "Widget / Alerte" : picker === "icon" ? "Icône" : "Depuis un lien"}</h2></div>
              <button type="button" autoFocus className={toolIcon} aria-label="Fermer" onClick={() => setPicker(null)}><MaterialIcon name="close" className="size-4" /></button>
            </header>
            {picker === "library" && (
              <ul className="max-h-[60vh] overflow-auto px-3 py-3">
                {allSources.length ? allSources.map((entry) => (
                  <li key={entry.id}>
                    {/* eslint-disable-next-line react-hooks/refs -- faux positif : add() n'est appelée qu'au clic */}
                    <button type="button" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-semibold text-[#e3e5ec] hover:bg-[#ac8bfa1f]" onClick={() => addSource(entry)}>
                      <MaterialIcon name={entry.content.kind === "alertbox" ? "notifications_active" : "widgets"} className="size-4 text-[var(--cl-muted)]" />
                      <span className="min-w-0 truncate">{entry.name}</span>
                      <span className="ml-auto shrink-0 text-xs font-normal text-[var(--cl-muted)]">{entry.project}</span>
                    </button>
                  </li>
                )) : <li className="px-2 py-2 text-sm text-[var(--cl-muted)]">Aucun widget ni pack d’alertes dans la bibliothèque.</li>}
              </ul>
            )}
            {picker === "icon" && (
              <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-auto p-4 sm:grid-cols-6">
                {Object.entries(OVERLAY_ICONS).map(([name, icon]) => (
                  <button key={name} type="button" title={icon.label} aria-label={icon.label} className="grid aspect-square place-items-center rounded-lg border border-[var(--cl-line)] bg-[#1b1d26] text-[#e3e5ec] hover:border-[var(--cl-accent)]" onClick={() => addIcon(name)}>
                    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true"><path fill="currentColor" d={icon.path} /></svg>
                  </button>
                ))}
              </div>
            )}
            {picker === "link" && (
              <form className="grid gap-3 p-5" onSubmit={(e) => { e.preventDefault(); addLink(); }}>
                <label className="grid gap-1 text-sm">Adresse de l’image ou de la vidéo<input autoFocus className={input} value={link} placeholder="https://…" onChange={(e) => setLink(e.target.value)} /></label>
                <p className="text-xs text-[var(--cl-muted)]">Une adresse en .mp4, .webm ou .mov crée un calque vidéo, sinon un calque image.</p>
                <button type="submit" className={`${toolButton} justify-self-end`}>Ajouter</button>
              </form>
            )}
          </section>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div ref={stageBox} className="min-w-0">
          <div className={zoom === null ? "" : "max-h-[75vh] overflow-auto rounded-md"}>
          <div className={rulers ? "grid w-max" : ""} style={rulers ? { gridTemplateColumns: `${RULER}px auto` } : undefined}>
          {rulers && (
            <>
              <div className="border-b border-r border-[var(--cl-line)] bg-[#12141b]" />
              <Ruler side="top" size={data.width} scale={scale} onPointerDown={(e) => startGuide(e, "y", null)} />
              <Ruler side="left" size={data.height} scale={scale} onPointerDown={(e) => startGuide(e, "x", null)} />
            </>
          )}
          <div ref={stageEl} className={`relative overflow-hidden ${rulers ? "" : "rounded-md border border-[var(--cl-line)]"} ${stylePick ? "cursor-copy" : ""}`} style={{ width: data.width * scale, height: data.height * scale }} onPointerDown={() => { if (!stylePick) setSelection([]); }}>
            <div className="absolute left-0 top-0 origin-top-left bg-[repeating-conic-gradient(#1b1d26_0_25%,#14161d_0_50%)] bg-[length:32px_32px]" style={{ width: data.width, height: data.height, transform: `scale(${scale})` }}>
              {[...data.items].sort((a, b) => a.z - b.z).map((item) =>
                item.hidden ? null : (
                  <div
                    key={item.id}
                    onPointerDown={(e) => startDrag(e, item)}
                    onDoubleClick={() => setPanel("props")}
                    onPointerEnter={() => setHovered(item.id)}
                    onPointerLeave={() => setHovered((h) => (h === item.id ? null : h))}
                    className={`absolute select-none ${item.locked ? "" : "cursor-move"}`}
                    style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.z }}
                  >
                    <ItemContent item={item} source={item.widgetId ? byId.get(item.widgetId) : undefined} platform={platform} register={register} />
                    {/* Contour discret de chaque calque, plus marqué au survol (scène ou liste des calques) */}
                    {!selection.includes(item.id) && (
                      <div className={`pointer-events-none absolute inset-0 ${hovered === item.id ? "outline-dashed outline-[var(--cl-accent)]" : "outline-dashed outline-white/25"}`} style={{ outlineWidth: (hovered === item.id ? 2 : 1) / scale }} />
                    )}
                    {(selection.includes(item.id) || hovered === item.id) && (
                      <span className="pointer-events-none absolute left-0 flex items-center gap-1 whitespace-nowrap rounded bg-[var(--cl-accent)] font-semibold text-[#0d0f13]" style={{ ...(item.y < 24 / scale ? { top: 4 / scale, left: 4 / scale } : { bottom: "100%", marginBottom: 4 / scale }), fontSize: 12 / scale, padding: `${2 / scale}px ${6 / scale}px`, zIndex: 1 }}>
                        <MaterialIcon name={TYPE_ICONS[item.type]} className="size-[1.1em]" />{itemLabel(item, widgetName)}
                      </span>
                    )}
                    {selection.includes(item.id) && (
                      <div className="pointer-events-none absolute inset-0 outline outline-[3px] outline-[var(--cl-accent)]" style={{ outlineWidth: 2 / scale }}>
                        {selected === item.id && !item.locked &&
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
              {selectedItems.length > 1 && (() => {
                const b = itemsBounds(selectedItems);
                return <div className="pointer-events-none absolute outline-dashed outline-[var(--cl-accent)]" style={{ left: b.x, top: b.y, width: b.w, height: b.h, outlineWidth: 1 / scale, outlineOffset: 6 / scale, zIndex: 99998 }} />;
              })()}
              {rulers && (["x", "y"] as const).flatMap((axis) => (data.guides?.[axis] ?? []).map((pos, i) => (guideDrag?.axis === axis && guideDrag.index === i ? null : (
                <div key={`${axis}-${i}`} onPointerDown={(e) => startGuide(e, axis, i)} title="Glisse ce repère sur la règle pour le supprimer" className={`absolute ${axis === "x" ? "top-0 h-full cursor-col-resize" : "left-0 w-full cursor-row-resize"}`} style={axis === "x" ? { left: pos - 4 / scale, width: 9 / scale, zIndex: 99999 } : { top: pos - 4 / scale, height: 9 / scale, zIndex: 99999 }}>
                  <div className="absolute bg-cyan-400" style={axis === "x" ? { left: 4 / scale, top: 0, bottom: 0, width: 1 / scale } : { top: 4 / scale, left: 0, right: 0, height: 1 / scale }} />
                </div>
              ))))}
              {guideDrag?.inside && <div className="pointer-events-none absolute bg-cyan-300" style={guideDrag.axis === "x" ? { left: guideDrag.pos, top: 0, height: "100%", width: 1 / scale, zIndex: 100000 } : { top: guideDrag.pos, left: 0, width: "100%", height: 1 / scale, zIndex: 100000 }} />}
              {guides.x !== null && <div className="pointer-events-none absolute top-0 h-full bg-pink-400" style={{ left: guides.x, width: 1 / scale, zIndex: 100000 }} />}
              {guides.y !== null && <div className="pointer-events-none absolute left-0 w-full bg-pink-400" style={{ top: guides.y, height: 1 / scale, zIndex: 100000 }} />}
            </div>
          </div>
          </div>
          </div>
          <p className="mt-2 text-[11px] text-[var(--cl-muted)]">Clic : sélectionner (Maj : plusieurs calques) · Glisser : déplacer · Poignées : redimensionner (Maj : proportions) · Alt : sans aimantation · Flèches : décaler (Maj : 10 px) · Suppr : supprimer · Ctrl + D : dupliquer · Ctrl + G : grouper (Maj : dégrouper)</p>
        </div>

        <aside className="cl-fields !static !max-h-none">
          <div className="cl-side-tabs" role="tablist" aria-label="Panneau de l'overlay">
            <button role="tab" aria-selected={panel === "layers"} onClick={() => setPanel("layers")}>Calques ({data.items.length})</button>
            <button role="tab" aria-selected={panel === "props"} onClick={() => setPanel("props")}>Propriétés</button>
          </div>

          {panel === "layers" ? (
            <>
            <ul ref={layerList} data-sort-list className="mt-3">
              {layers.map((item, i) => {
                const handle = sort.handle(i);
                return (
                  <li key={item.id} aria-label={itemLabel(item, widgetName)} onPointerEnter={() => setHovered(item.id)} onPointerLeave={() => setHovered((h) => (h === item.id ? null : h))} className="py-[3px]">
                    <div className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-sm ${selection.includes(item.id) ? "border-[var(--cl-accent)] bg-[#ac8bfa1f]" : hovered === item.id ? "border-[var(--cl-accent)]/60 bg-white/5" : "border-[var(--cl-line)] bg-[#151720]"} ${item.hidden ? "opacity-60" : ""}`}>
                    <span {...handle} role="button" tabIndex={0} aria-label={`Déplacer le calque ${itemLabel(item, widgetName)}`} title="Glisser pour changer l’ordre d’affichage · ↑/↓ au clavier" className="inline-flex size-7 shrink-0 cursor-grab items-center justify-center rounded text-[var(--cl-muted)] hover:bg-[#ac8bfa1f] hover:text-[var(--cl-accent)] active:cursor-grabbing"><MaterialIcon name="drag_indicator" className="size-5" /></span>
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white/5 text-[var(--cl-accent)]" title={ITEM_LABELS[item.type]}><MaterialIcon name={TYPE_ICONS[item.type]} className="size-4" /></span>
                    <button type="button" onClick={(e) => { if (stylePick) return applyStyle(item); select(item.id, e.shiftKey); if (!e.shiftKey && !item.group) setPanel("props"); }} className="grid min-w-0 flex-1 text-left leading-tight">
                      <span className="truncate font-medium text-[#e3e5ec]">{itemLabel(item, widgetName)}</span>
                      <span className="text-[10px] text-[var(--cl-muted)]">{ITEM_LABELS[item.type]}{item.type === "widget" && hasOverrides(item) ? " · réglages personnalisés" : ""}{item.group ? " · groupe" : ""}</span>
                    </button>
                    <button type="button" onClick={() => updateItem(item.id, { hidden: !item.hidden })} title={item.hidden ? "Afficher" : "Masquer"} aria-label={item.hidden ? "Afficher le calque" : "Masquer le calque"} className={`inline-flex ${item.hidden ? "text-[var(--cl-muted)]" : ""}`}><MaterialIcon name={item.hidden ? "visibility_off" : "visibility"} className="size-4" /></button>
                    <button type="button" onClick={() => updateItem(item.id, { locked: !item.locked })} title={item.locked ? "Déverrouiller" : "Verrouiller"} aria-label={item.locked ? "Déverrouiller le calque" : "Verrouiller le calque"} className={`inline-flex ${item.locked ? "text-[var(--cl-accent)]" : "text-[var(--cl-muted)]"}`}><MaterialIcon name={item.locked ? "lock" : "lock_open"} className="size-4" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {sort.drag && <SortPreview drag={sort.drag} />}
            {!data.items.length && <p className="cl-field-hint mt-4">Aucun calque : ajoute un texte, une image ou un widget.</p>}
            </>
          ) : !current ? (
            <p className="cl-field-hint mt-4">{selection.length > 1 ? `${selection.length} calques sélectionnés : la barre d’outils permet de les grouper, aligner, dupliquer ou supprimer.` : "Sélectionne un calque dans la scène ou dans la liste des calques."}</p>
          ) : (
            <div className="mt-4 grid gap-3 text-xs">
              <span className="cl-eyebrow uppercase !mb-0">Taille et position</span>
              <label className="grid gap-1">Nom du calque<input className={input} value={current.name ?? ""} placeholder={itemLabel({ ...current, name: undefined }, widgetName)} onChange={(e) => updateItem(current.id, { name: e.target.value })} /></label>
              <div className="grid grid-cols-2 gap-2">
                {(["y", "x", "w", "h"] as const).map((k) => (
                  <label key={k} className="grid gap-1">{k === "w" ? "Width" : k === "h" ? "Height" : k === "y" ? "Top" : "Left"}<input className={input} type="number" value={current[k]} onChange={(e) => updateItem(current.id, { [k]: k === "w" || k === "h" ? Math.max(MIN_ITEM_SIZE, num(e.target.value)) : num(e.target.value) })} /></label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="inline-grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground hover:border-accent" title="Centrer horizontalement" aria-label="Centrer horizontalement" onClick={() => updateItem(current.id, { x: Math.round((data.width - current.w) / 2) })}><MaterialIcon name="align_horizontal_center" className="size-5" /></button>
                <button type="button" className="inline-grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground hover:border-accent" title="Centrer verticalement" aria-label="Centrer verticalement" onClick={() => updateItem(current.id, { y: Math.round((data.height - current.h) / 2) })}><MaterialIcon name="align_vertical_center" className="size-5" /></button>
                <button type="button" className="inline-grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground hover:border-accent" title="Plein écran" aria-label="Plein écran" onClick={() => updateItem(current.id, { x: 0, y: 0, w: data.width, h: data.height })}><MaterialIcon name="fullscreen" className="size-5" /></button>
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

              {current.type === "image" && isOverlayIcon(p.icon) ? (
                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1">Icône<select className={input} value={String(p.icon)} onChange={(e) => updateProps(current.id, { icon: e.target.value })}>{Object.entries(OVERLAY_ICONS).map(([name, icon]) => <option key={name} value={name}>{icon.label}</option>)}</select></label>
                  <label className="grid gap-1">Couleur<input type="color" className="h-8 w-full" value={String(p.iconColor || "#ffffff")} onChange={(e) => updateProps(current.id, { iconColor: e.target.value })} /></label>
                </div>
              ) : (current.type === "image" || current.type === "video") && (
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
                  <label className="grid gap-1">Création affichée<select className={input} value={current.widgetId ?? ""} onChange={(e) => updateItem(current.id, { widgetId: e.target.value || undefined, props: { ...current.props, widgetOverrides: {} } })}><option value="">— Choisir —</option>{allSources.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.project}</option>)}</select></label>
                  {currentSize && <button type="button" className={`${toolButton} justify-self-center`} onClick={() => updateItem(current.id, { w: currentSize.width, h: currentSize.height })}><MaterialIcon name="fullscreen" className="size-4" />Taille d’origine ({currentSize.width} × {currentSize.height})</button>}
                  {current.widgetId && <Link href={`/admin/laboratoire/${current.widgetId}`} className="inline-flex items-center gap-1 text-[var(--cl-accent)] hover:underline">Ouvrir cette création dans l’éditeur<MaterialIcon name="arrow_forward" className="size-4" /></Link>}
                  <p className="cl-field-hint">Les événements simulés (bouton en bas à droite) sont envoyés à tous les widgets de la scène.</p>
                  {current.widgetId && byId.get(current.widgetId) && <CustomLabWidgetSettings content={byId.get(current.widgetId)!.content} props={current.props} platform={platform} onChange={(patch) => updateProps(current.id, patch)} />}
                </>
              )}

              <div className="-mx-[18px] flex gap-2 border-t border-[var(--cl-line)] px-[18px] pt-3">
                <button type="button" className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-2 text-xs font-semibold border-border bg-surface text-foreground hover:border-accent" onClick={() => duplicate([current.id])}><MaterialIcon name="content_copy" className="size-4" />Dupliquer</button>
                <button type="button" className="inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-2 text-xs font-semibold border-red-400/50 bg-red-500/10 text-red-300 hover:border-red-400 hover:bg-red-500/20" onClick={() => remove([current.id])}><MaterialIcon name="delete" className="size-4" />Supprimer</button>
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
