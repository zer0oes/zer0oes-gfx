// Fichiers livrables d'une création du Laboratoire : zip prêt à importer (widget ou pack d'alertes, par plateforme)
// ou page HTML autonome d'un overlay (source navigateur OBS). Utilisé par l'export de l'éditeur et par la livraison.
import { normalizeAlertboxConfig, type AlertboxAlertType } from "./alertbox";
import { fieldValues, jsonObject, parseFields, parseLabContent } from "./model";
import { DEFAULT_OVERLAY, type OverlayItem } from "./overlay";
import { PLATFORM_STREAM_ELEMENTS, PLATFORM_STREAMLABS, type Platform } from "./platformEvents";
import { buildLabPreview, labLoadMessage } from "./preview";
import { widgetInstance } from "./widget-instance";
import type { LabContent } from "./types";
import { buildAlertboxExport, buildPlatformExport, slugifyWidgetName, type AlertboxExportCode } from "./widgetExport";
import { createZip } from "./zip";
import { streamlabsWidgetReadme } from "./streamlabs-widgets";

export type LabExportFile = { filename: string; label: string; data: Uint8Array; contentType: string };

export const PLATFORM_NAMES: Record<Platform, string> = { [PLATFORM_STREAM_ELEMENTS]: "StreamElements", [PLATFORM_STREAMLABS]: "Streamlabs" };

// Zip d'un widget ou d'un pack d'alertes pour une plateforme (mêmes fichiers que le bouton Exporter)
export function labPlatformZip(raw: LabContent, platform: Platform): LabExportFile {
  const content = parseLabContent(raw);
  const variant = content.variants[platform];
  let files: Record<string, string>;
  if (content.kind === "alertbox") {
    const codes = Object.fromEntries(Object.entries(variant.alerts).map(([type, c]) => [type, { ...c, fields: parseFields(c.fields), values: fieldValues(c) }])) as Partial<Record<AlertboxAlertType, AlertboxExportCode>>;
    files = buildAlertboxExport(codes, normalizeAlertboxConfig(jsonObject(variant.settings), platform), platform, platform === PLATFORM_STREAMLABS ? content.conversions?.streamlabs : undefined).files;
  } else {
    files = buildPlatformExport({ ...variant.code, fields: parseFields(variant.code.fields) }, fieldValues(variant.code), platform, platform === PLATFORM_STREAMLABS ? content.conversions?.streamlabs : undefined).files;
    // Widget natif Streamlabs ciblé (Fenêtre de chat…) : guide d'installation propre à ce widget
    const readme = platform === PLATFORM_STREAMLABS ? streamlabsWidgetReadme(content.streamlabsWidget ?? "custom") : null;
    if (readme) files = { ...files, "README.txt": readme };
  }
  return {
    filename: `${slugifyWidgetName(content.name)}-${platform}.zip`,
    label: `${content.name} — ${PLATFORM_NAMES[platform]}`,
    data: createZip(files),
    contentType: "application/zip",
  };
}

const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const css = (v: unknown) => String(v ?? "").replace(/[;{}<>"\\]/g, "");
const num = (v: unknown, fallback = 0) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v) || fallback);
const src = (v: unknown) => (/^https:\/\//.test(String(v ?? "")) ? esc(v) : "");

// Contenu HTML d'un calque (même rendu que la scène de l'éditeur)
type Frame = { id: string; message: unknown; source: string };

function itemHtml(item: OverlayItem, sources: Record<string, LabContent>, platform: Platform, frames: Frame[]) {
  const p = item.props;
  if (item.type === "text") {
    const style = [
      `font-family:${css(p.fontFamily || "inherit")}`,
      `font-size:${num(p.fontSize, 48)}px`,
      `font-weight:${num(p.fontWeight, 700)}`,
      `color:${css(p.color || "#fff")}`,
      `text-align:${["left", "center", "right"].includes(String(p.align)) ? p.align : "left"}`,
      `line-height:${num(p.lineHeight, 1.2)}`,
      `letter-spacing:${num(p.letterSpacing)}px`,
      `text-shadow:${p.shadow ? `0 4px ${num(p.shadowBlur)}px ${css(p.shadowColor || "#000")}` : "none"}`,
    ].join(";");
    return `<div class="txt" style="${esc(style)}">${esc(p.content)}</div>`;
  }
  const fit = (fallback: string) => (["contain", "cover", "fill"].includes(String(p.fit)) ? String(p.fit) : fallback);
  if (item.type === "image") return src(p.src) ? `<img src="${src(p.src)}" alt="" style="object-fit:${fit("contain")}">` : "";
  if (item.type === "video") return src(p.src) ? `<video src="${src(p.src)}" autoplay playsinline${p.loop !== false ? " loop" : ""}${p.muted !== false ? " muted" : ""} style="object-fit:${fit("cover")}"></video>` : "";
  if (item.type === "shape") {
    const style = [
      `background:${css(p.fill || "transparent")}`,
      `border:${num(p.strokeWidth) > 0 ? `${num(p.strokeWidth)}px solid ${css(p.stroke)}` : "none"}`,
      `border-radius:${p.shape === "ellipse" ? "50%" : `${num(p.radius)}px`}`,
      `opacity:${p.opacity === undefined ? 1 : num(p.opacity, 1)}`,
    ].join(";");
    return `<div class="fill" style="${esc(style)}"></div>`;
  }
  const source = item.widgetId ? sources[item.widgetId] : undefined;
  if (!source) return "";
  const preview = buildLabPreview(widgetInstance(source, item.props, platform), platform, { transparent: true });
  if (!preview.source) return "";
  frames.push({ id: item.id, message: labLoadMessage(preview, platform), source: preview.source });
  return `<iframe data-frame="${esc(item.id)}" sandbox="allow-scripts" allow="autoplay"></iframe>`;
}

// Page HTML autonome d'un overlay : scène à la taille du format, fond transparent, calques visibles dans l'ordre.
// Les widgets s'affichent avec leurs réglages (code de la plateforme choisie, sans événements en direct).
export function labOverlayHtml(raw: LabContent, sources: Record<string, LabContent>, platform: Platform = PLATFORM_STREAM_ELEMENTS): LabExportFile {
  const content = parseLabContent(raw);
  const data = content.overlay ?? DEFAULT_OVERLAY;
  const frames: Frame[] = [];
  const layers = [...data.items]
    .filter((item) => !item.hidden)
    .sort((a, b) => a.z - b.z)
    .map((item) => `<div class="layer" style="left:${item.x}px;top:${item.y}px;width:${item.w}px;height:${item.h}px;z-index:${item.z}">${itemHtml(item, sources, platform, frames)}</div>`)
    .join("\n");
  const script = frames.length
    ? `<script>const frames=${JSON.stringify(Object.fromEntries(frames.map((f) => [f.id, { load: f.message, source: f.source }]))).replaceAll("<", "\\u003c")};document.querySelectorAll("iframe[data-frame]").forEach((f)=>{const w=frames[f.dataset.frame];f.addEventListener("load",()=>f.contentWindow.postMessage(w.load,"*"));f.srcdoc=w.source;});</script>`
    : "";
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${esc(content.name)}</title>
<style>
html,body{margin:0;padding:0;background:transparent;overflow:hidden;font-family:Poppins,Arial,Helvetica,sans-serif}
#scene{position:relative;width:${data.width}px;height:${data.height}px;overflow:hidden}
.layer{position:absolute}
.layer>*{display:block;width:100%;height:100%;border:0;background:transparent}
.txt{overflow:hidden;white-space:pre-wrap;overflow-wrap:break-word}
</style>
</head>
<body>
<!-- Source navigateur OBS : ${data.width} × ${data.height} -->
<div id="scene">
${layers}
</div>
${script}
</body>
</html>
`;
  return {
    filename: `${slugifyWidgetName(content.name)}-overlay.html`,
    label: `${content.name} — overlay OBS`,
    data: new TextEncoder().encode(html),
    contentType: "text/html; charset=utf-8",
  };
}
