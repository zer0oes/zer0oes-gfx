// Visuels des créations à la carte (page Offres) : dessins en code (SVG ou HTML, couleur currentColor),
// gérés dans Admin > Offres et réglages > Catalogue > Visuels, puis associés à chaque produit dans sa fiche.
// Un visuel = un dessin + le CSS de sa version animée (appliqué seulement quand la variante est « Animée »).
// Rangé dans le contenu JSON existant (pas de colonne en base) :
//   bibliothèque « page:offres:visuels » (tableau JSON), association « page:offres:visuel:<id produit> ».
import type { Option } from "./pricing";

export type ProductVisual = { id: string; name: string; markup: string; css: string };

export const visualsKey = "page:offres:visuels";
export const optionVisualKey = (optionId: string) => `page:offres:visuel:${optionId}`;
export const MAX_MARKUP = 20000;
export const MAX_CSS = 8000;

// Animation d'origine : le dessin respire, ses éléments (.piece) flottent l'un après l'autre
const floatCss = `:scope { animation: preview-float 3s ease-in-out infinite; }
.piece { animation: preview-icon 2.4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.piece:nth-of-type(2) { animation-delay: -0.8s; }
.piece:nth-of-type(3) { animation-delay: -1.6s; }`;

const svg = (body: string) => `<svg viewBox="0 0 160 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n${body}\n</svg>`;
const face = (x: number, y: number) => `  <g class="piece">
    <rect x="${x - 21}" y="${y - 21}" width="42" height="42" rx="12" stroke-dasharray="4 4" />
    <circle cx="${x}" cy="${y}" r="13" />
    <path d="M${x - 6} ${y - 3}h2m8 0h2M${x - 6} ${y + 4}q6 7 12 0" />
  </g>`;

// Dessins d'origine (repris de la page Offres) : visibles tant que la bibliothèque n'a jamais été enregistrée
export const defaultVisuals: ProductVisual[] = [
  { id: "overlay", name: "Overlay (scène)", css: floatCss, markup: svg(`  <rect x="8" y="10" width="144" height="81" rx="8" stroke-dasharray="6 5" />
  <path class="piece" d="M18 22h40" stroke-width="3" opacity=".4" />
  <rect class="piece" x="18" y="52" width="48" height="30" rx="3" />
  <rect class="piece" x="110" y="32" width="32" height="50" rx="3" opacity=".5" />`) },
  { id: "emotes", name: "Emotes", css: floatCss, markup: svg(`${face(32, 54)}\n${face(80, 44)}\n${face(128, 54)}`) },
  { id: "panneaux", name: "Panneaux", css: floatCss, markup: svg([0, 1, 2, 3, 4, 5].map((i) => {
    const x = 14 + (i % 3) * 46, y = 18 + Math.floor(i / 3) * 36;
    return `  <g class="piece"><rect x="${x}" y="${y}" width="40" height="28" rx="4" /><path d="M${x + 9} ${y + 10}h22" stroke-width="2.5" opacity=".5" /></g>`;
  }).join("\n")) },
  { id: "avatar", name: "Avatar", css: floatCss, markup: svg(`  <circle cx="80" cy="50" r="38" stroke-dasharray="5 5" />
  <g class="piece"><circle cx="80" cy="40" r="11" /><path d="M60 74c0-24 40-24 40 0" /></g>`) },
  { id: "logo", name: "Logo", css: floatCss, markup: svg(`  <g class="piece">
    <path d="M80 12 112 31v38L80 88 48 69V31Z" />
    <path d="m80 30 18 32H62Z" />
    <path d="M70 52h20" />
  </g>`) },
  { id: "banniere", name: "Bannière", css: floatCss, markup: svg(`  <rect x="6" y="22" width="148" height="56" rx="8" stroke-dasharray="6 5" />
  <circle class="piece" cx="36" cy="50" r="13" />
  <path class="piece" d="M62 50h74" stroke-width="5" opacity=".4" />`) },
  { id: "widget", name: "Widget / alertes", css: floatCss, markup: svg(`  <rect x="38" y="8" width="84" height="84" rx="12" stroke-dasharray="6 5" />
  <circle class="piece" cx="80" cy="34" r="10" />
  <path class="piece" d="M56 60h48" stroke-width="5" opacity=".4" />
  <path class="piece" d="M56 74h32" stroke-width="3" opacity=".2" />`) },
];

// Point de départ d'un nouveau visuel
export const starterVisual = { markup: svg(`  <rect x="20" y="10" width="120" height="80" rx="10" stroke-dasharray="6 5" />
  <circle class="piece" cx="80" cy="50" r="18" />`), css: floatCss };

// Dessin choisi d'après le nom du produit, tant qu'aucun visuel ne lui a été associé
export function defaultVisualId(option: Pick<Option, "id" | "name" | "category">) {
  const name = option.id + option.name;
  if (option.category === "emotes" || /emote/i.test(name)) return "emotes";
  if (/panneau|panel/i.test(name)) return "panneaux";
  if (/avatar/i.test(name)) return "avatar";
  if (/logo/i.test(name)) return "logo";
  if (/banni|banner/i.test(name)) return "banniere";
  if (/widget|alerte|alert/i.test(name)) return "widget";
  return "overlay";
}

const asRecord = (raw: unknown) => (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {});

export function readVisuals(raw: unknown): ProductVisual[] {
  const stored = asRecord(raw)[visualsKey];
  if (typeof stored !== "string") return defaultVisuals;
  try {
    const list = JSON.parse(stored);
    if (!Array.isArray(list)) return defaultVisuals;
    return list.filter((v): v is ProductVisual => v && typeof v.id === "string" && typeof v.name === "string" && typeof v.markup === "string" && typeof v.css === "string");
  } catch {
    return defaultVisuals;
  }
}

export function writeVisuals(raw: unknown, visuals: ProductVisual[]): Record<string, string> {
  const content = Object.fromEntries(Object.entries(asRecord(raw)).filter(([, v]) => typeof v === "string")) as Record<string, string>;
  content[visualsKey] = JSON.stringify(visuals);
  return content;
}

// Visuel associé (sinon celui du nom, sinon le premier de la bibliothèque, sinon le dessin « scène » d'origine)
export function visualFor(option: Pick<Option, "id" | "name" | "category">, raw: unknown): ProductVisual {
  const visuals = readVisuals(raw);
  const chosen = asRecord(raw)[optionVisualKey(option.id)];
  const byId = (id: unknown) => visuals.find((v) => v.id === id);
  return byId(chosen) ?? byId(defaultVisualId(option)) ?? visuals[0] ?? defaultVisuals[0];
}

// Les produits qui utilisent chaque visuel (association enregistrée ou dessin choisi d'après le nom)
export function visualUsage(options: Option[], raw: unknown): Record<string, Option[]> {
  const usage: Record<string, Option[]> = {};
  for (const o of options) (usage[visualFor(o, raw).id] ??= []).push(o);
  return usage;
}

// Le dessin s'affiche dans la page : ni script, ni gestionnaire d'événement, ni lien javascript:
export function cleanMarkup(markup: string) {
  return markup
    .replace(/<\s*(script|iframe|object|embed|style)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|xlink:href)\s*=\s*(["']?)\s*javascript:[^"'\s>]*\2/gi, "")
    .slice(0, MAX_MARKUP);
}

// CSS de l'animation limité au visuel : chaque règle ne vise que ce visuel, en version animée.
// « :scope » désigne le visuel lui-même ; les @keyframes restent globales (nomme-les de façon unique).
export function scopeVisualCss(css: string, id: string) {
  const root = `[data-visuel="${id.replace(/[^a-z0-9-]/gi, "")}"][data-anime]`;
  const scope = (source: string): string => {
    let out = "";
    let i = 0;
    while (i < source.length) {
      const open = source.indexOf("{", i);
      if (open < 0) break;
      const prelude = source.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < source.length && depth) {
        if (source[j] === "{") depth++;
        else if (source[j] === "}") depth--;
        j++;
      }
      const body = source.slice(open + 1, j - 1);
      if (/^@(media|supports|container)\b/i.test(prelude)) out += `${prelude}{${scope(body)}}`;
      else if (prelude.startsWith("@")) out += `${prelude}{${body}}`;
      else if (prelude) out += `${prelude.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (s.includes(":scope") ? s.replaceAll(":scope", root) : `${root} ${s}`)).join(", ")}{${body}}`;
      i = j;
    }
    return out;
  };
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/</g, "").slice(0, MAX_CSS);
  return `@media (prefers-reduced-motion: no-preference){${scope(clean)}}`;
}

export function visualId(name: string, taken: string[]) {
  const base = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "visuel";
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}
