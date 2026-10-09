// Overlays du Laboratoire : une scène (1920 × 1080 par défaut) composée de calques — textes, images, vidéos,
// formes, et widgets ou packs d'alertes de la bibliothèque. Porté de l'éditeur d'overlays du Streamer Lab.

export type OverlayItemType = "text" | "image" | "video" | "shape" | "widget";

export type OverlayItem = {
  id: string;
  type: OverlayItemType;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  hidden?: boolean;
  locked?: boolean;
  // widget : identifiant de la création (widget ou pack d'alertes) affichée dans ce calque
  widgetId?: string;
  props: Record<string, unknown>;
};

export type OverlayData = { width: number; height: number; items: OverlayItem[] };

export const OVERLAY_TYPES: OverlayItemType[] = ["text", "image", "video", "shape", "widget"];
export const MIN_ITEM_SIZE = 8;
export const DEFAULT_OVERLAY: OverlayData = { width: 1920, height: 1080, items: [] };
export const MAX_OVERLAY_ITEMS = 200;

export const ITEM_DEFAULTS: Record<OverlayItemType, { w: number; h: number; props: Record<string, unknown> }> = {
  text: { w: 480, h: 120, props: { content: "Texte", fontFamily: "inherit", fontSize: 56, fontWeight: 700, color: "#ffffff", align: "left", lineHeight: 1.2, letterSpacing: 0, shadow: false, shadowColor: "#000000", shadowBlur: 12 } },
  image: { w: 480, h: 270, props: { src: "", fit: "contain" } },
  video: { w: 480, h: 270, props: { src: "", fit: "cover", loop: true, muted: true } },
  shape: { w: 320, h: 200, props: { shape: "rectangle", fill: "#7c5cff", stroke: "#ffffff", strokeWidth: 0, radius: 16, opacity: 1 } },
  widget: { w: 600, h: 300, props: { platform: "streamelements" } },
};

export const ITEM_LABELS: Record<OverlayItemType, string> = { text: "Texte", image: "Image", video: "Vidéo", shape: "Forme", widget: "Widget" };

export function newItemId() {
  return `it-${Math.random().toString(36).slice(2, 10)}`;
}

export function nextZ(items: OverlayItem[]) {
  return items.reduce((max, item) => Math.max(max, item.z), 0) + 1;
}

// Nouveau calque, centré dans la scène (en cascade s'il y en a déjà au même endroit)
export function createItem(data: OverlayData, type: OverlayItemType, extra: Partial<OverlayItem> = {}): OverlayItem {
  const d = ITEM_DEFAULTS[type];
  const cascade = (data.items.length % 8) * 24;
  return {
    id: newItemId(),
    type,
    x: Math.round((data.width - d.w) / 2) + cascade,
    y: Math.round((data.height - d.h) / 2) + cascade,
    w: d.w,
    h: d.h,
    z: nextZ(data.items),
    props: { ...d.props },
    ...extra,
  };
}

export function itemLabel(item: OverlayItem, widgetName?: (id: string) => string | undefined) {
  if (item.name?.trim()) return item.name.trim();
  if (item.type === "text") return String(item.props.content ?? "Texte").split("\n")[0].slice(0, 40) || "Texte";
  if (item.type === "widget") return (item.widgetId && widgetName?.(item.widgetId)) || "Widget";
  return ITEM_LABELS[item.type];
}

// --- Aimantation ---------------------------------------------------------------------

// Repères d'un axe : bords et centre de la scène, bords et centres des autres calques visibles
export function snapTargets(data: OverlayData, axis: "x" | "y", exclude: string) {
  const size = axis === "x" ? data.width : data.height;
  const targets = [0, size / 2, size];
  for (const it of data.items) {
    if (it.id === exclude || it.hidden) continue;
    const start = axis === "x" ? it.x : it.y;
    const len = axis === "x" ? it.w : it.h;
    targets.push(start, start + len / 2, start + len);
  }
  return targets;
}

// Position aimantée d'un calque (début, centre ou fin alignés sur un repère proche) ; guide = repère retenu
export function snapPosition(pos: number, len: number, targets: number[], threshold: number): { pos: number; guide: number | null } {
  let best: { delta: number; guide: number } | null = null;
  for (const t of targets) {
    for (const offset of [0, len / 2, len]) {
      const delta = t - (pos + offset);
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, guide: t };
    }
  }
  return best ? { pos: Math.round(pos + best.delta), guide: best.guide } : { pos: Math.round(pos), guide: null };
}

// --- Lecture et vérification ------------------------------------------------------------

const num = (v: unknown, min: number, max: number, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback);

export function parseOverlay(raw: unknown): OverlayData {
  const o = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const width = num(o.width, 320, 7680, DEFAULT_OVERLAY.width);
  const height = num(o.height, 180, 4320, DEFAULT_OVERLAY.height);
  const items = (Array.isArray(o.items) ? o.items : []).slice(0, MAX_OVERLAY_ITEMS).flatMap((v): OverlayItem[] => {
    const it = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
    if (!it || !OVERLAY_TYPES.includes(it.type as OverlayItemType)) return [];
    const type = it.type as OverlayItemType;
    const props = it.props && typeof it.props === "object" && !Array.isArray(it.props) ? (it.props as Record<string, unknown>) : {};
    if (JSON.stringify(props).length > 20_000) return [];
    return [{
      id: typeof it.id === "string" && /^[\w-]{1,40}$/.test(it.id) ? it.id : newItemId(),
      type,
      ...(typeof it.name === "string" && it.name.trim() ? { name: it.name.slice(0, 80) } : {}),
      x: num(it.x, -width, width * 2, 0),
      y: num(it.y, -height, height * 2, 0),
      w: num(it.w, MIN_ITEM_SIZE, width * 2, ITEM_DEFAULTS[type].w),
      h: num(it.h, MIN_ITEM_SIZE, height * 2, ITEM_DEFAULTS[type].h),
      z: num(it.z, 0, 100_000, 0),
      ...(it.hidden === true ? { hidden: true } : {}),
      ...(it.locked === true ? { locked: true } : {}),
      ...(type === "widget" && typeof it.widgetId === "string" && /^[0-9a-f-]{36}$/i.test(it.widgetId) ? { widgetId: it.widgetId } : {}),
      props,
    }];
  });
  return { width, height, items };
}
