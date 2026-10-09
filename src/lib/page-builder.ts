// Constructeur de pages projet : une page = un en-tête, une suite de blocs (chacun avec sa disposition,
// ses visuels et ses textes FR/EN) et un appel au contact. Enregistrée dans la fiche du projet
// (colonne case_study, sous la forme { builder: 1, page }) : pas de table dédiée.
// Sans page enregistrée, la mise en page d'origine (src/data/case-studies.ts) sert de point de départ.
import type { EditorialBlock, EditorialStudy } from "@/data/case-studies";
import type { Locale } from "./i18n";

// Texte bilingue : sans anglais, la page anglaise reprend le français
export type L = { fr: string; en?: string };

// Visuel placé dans un emplacement. image / aspect : recadrage particulier repris des pages d'origine.
export type Slot = { work: string; caption?: L; image?: string; aspect?: string };

export type LayoutId = "signature" | "scenes" | "detail" | "emotes" | "wide" | "media-text" | "text-media" | "duo" | "gallery" | "full";

export type Block = {
  id: string;
  layout: LayoutId;
  kicker?: L;
  title?: L; // une ligne par retour à la ligne
  text?: L;
  subtitle?: L; // disposition « Grand visuel + colonne » : titre de la colonne
  slots: Slot[];
};

export type BuilderPage = {
  header: { eyebrow: L; headline: L; intro: L; hero?: string; heroCaption: L; headerLogo?: Slot };
  blocks: Block[];
  cta: { kicker: L; title: L };
};

type Field = "kicker" | "title" | "text" | "subtitle";

// Dispositions proposées. slots : nombre de visuels (min, max) ; slotLabels : nom de chaque emplacement ;
// captions : légende possible sous les visuels ; fields : textes du bloc.
export const layouts: Record<
  LayoutId,
  { label: string; description: string; min: number; max: number; slotLabels?: string[]; extraLabel?: string; captions: boolean; fields: Field[] }
> = {
  full: { label: "Visuel pleine largeur", description: "Un grand visuel sous le titre, avec sa légende.", min: 1, max: 1, captions: true, fields: ["kicker", "title"] },
  "media-text": { label: "Visuel + texte", description: "Le visuel à gauche, le texte à droite (visuels complémentaires sous le texte).", min: 1, max: 4, slotLabels: ["Visuel principal"], extraLabel: "Visuel sous le texte", captions: true, fields: ["kicker", "title", "text"] },
  "text-media": { label: "Texte + visuel", description: "Le texte à gauche, le visuel à droite.", min: 1, max: 1, captions: false, fields: ["kicker", "title", "text"] },
  signature: { label: "Logo + avatar rond", description: "Un grand visuel et un visuel rond à côté, avec sa légende.", min: 1, max: 2, slotLabels: ["Grand visuel", "Visuel rond"], captions: true, fields: ["kicker", "title"] },
  duo: { label: "Deux visuels côte à côte", description: "Deux visuels de même taille sous le titre.", min: 2, max: 2, captions: true, fields: ["kicker", "title", "text"] },
  gallery: { label: "Galerie", description: "Une grille de visuels (3 par ligne) sous le titre.", min: 2, max: 12, captions: true, fields: ["kicker", "title", "text"] },
  scenes: { label: "Scènes à onglets", description: "Une grande scène et des onglets pour passer d'une scène à l'autre.", min: 1, max: 8, captions: true, fields: ["kicker", "title", "text"] },
  detail: { label: "Grand visuel + colonne", description: "Un grand visuel, et une colonne avec un sous-titre, un visuel et des petits visuels.", min: 1, max: 6, slotLabels: ["Grand visuel", "Visuel de la colonne"], extraLabel: "Petit visuel", captions: true, fields: ["kicker", "title", "subtitle"] },
  emotes: { label: "Planche d'emotes", description: "Les emotes d'une réalisation en grille, avec le texte à gauche.", min: 1, max: 1, captions: false, fields: ["kicker", "title", "text"] },
  wide: { label: "Bannière très large", description: "Le texte en colonne étroite et un visuel très large (bannière).", min: 1, max: 1, captions: false, fields: ["kicker", "title", "text"] },
};

export const layoutIds = Object.keys(layouts) as LayoutId[];

export const say = (l: L | undefined, locale: Locale) => (l ? (locale === "en" && l.en?.trim() ? l.en : l.fr) : "");
export const lines = (l: L | undefined, locale: Locale) => say(l, locale).split("\n").map((x) => x.trim()).filter(Boolean);

// --- Conversion des pages d'origine -----------------------------------------------------

const join = (v: string | string[] | undefined) => (Array.isArray(v) ? v.join("\n") : (v ?? ""));
const both = (fr: string | string[] | undefined, en: string | string[] | undefined): L => ({ fr: join(fr), en: join(en ?? fr) });

function convertBlock(fr: EditorialBlock, en: EditorialBlock, i: number): Block {
  const id = `b${i + 1}`;
  const base = { id, kicker: both(fr.kicker, en.kicker), title: both(fr.title, en.title) };
  if (fr.type === "signature" && en.type === "signature")
    return { ...base, layout: "signature", slots: [{ work: fr.main }, ...(fr.side ? [{ work: fr.side.id, caption: both(fr.side.caption, en.side?.caption) }] : [])] };
  if (fr.type === "scenes" && en.type === "scenes")
    return { ...base, layout: "scenes", text: both(fr.text, en.text), slots: fr.scenes.map((s, k) => ({ work: s.id, caption: both(s.label, en.scenes[k]?.label), image: s.image, aspect: s.aspect })) };
  if (fr.type === "detail" && en.type === "detail")
    return {
      ...base,
      layout: "detail",
      subtitle: both(fr.sideTitle, en.sideTitle),
      slots: [
        { work: fr.main.id, caption: both(fr.main.caption, en.main.caption), image: fr.main.image, aspect: fr.main.aspect },
        { work: fr.side.id, caption: both(fr.side.caption, en.side.caption) },
        ...fr.small.map((s, k) => ({ work: s.id, caption: both(s.label, en.small[k]?.label), image: s.image, aspect: s.aspect })),
      ],
    };
  if (fr.type === "emotes" && en.type === "emotes") return { ...base, layout: "emotes", text: both(fr.text, en.text), slots: [{ work: fr.work }] };
  if (fr.type === "beyond" && en.type === "beyond")
    return fr.wide
      ? { ...base, layout: "wide", text: both(fr.text, en.text), slots: [{ work: fr.main }] }
      : { ...base, layout: "media-text", text: both(fr.text, en.text), slots: [{ work: fr.main }, ...(fr.extra ?? []).map((s, k) => ({ work: s.id, caption: both(s.label, en.extra?.[k]?.label) }))] };
  return { ...base, layout: "full", slots: [] };
}

// Page de départ à partir de la mise en page d'origine, en français et en anglais (mêmes blocs)
export function fromEditorial(fr: EditorialStudy, en: EditorialStudy): BuilderPage {
  return {
    header: {
      eyebrow: both(fr.eyebrow, en.eyebrow),
      headline: both(fr.headline, en.headline),
      intro: both(fr.intro, en.intro),
      hero: fr.hero,
      heroCaption: both(fr.heroCaption, en.heroCaption),
      headerLogo: fr.headerLogo ? { work: fr.headerLogo.id, caption: both(fr.headerLogo.caption, en.headerLogo?.caption) } : undefined,
    },
    blocks: fr.blocks.map((b, i) => convertBlock(b, en.blocks[i] ?? b, i)),
    cta: { kicker: both(fr.cta.kicker, en.cta.kicker), title: both(fr.cta.title, en.cta.title) },
  };
}

// Page de départ d'un projet sans mise en page : la première réalisation en ouverture, les autres en galerie
export function starterPage(name: string, description: string, workIds: string[]): BuilderPage {
  const [hero, ...rest] = workIds;
  return {
    header: { eyebrow: { fr: `Identité de stream / ${name}` }, headline: { fr: `${name}\n` }, intro: { fr: description }, hero, heroCaption: { fr: "" } },
    blocks: rest.length >= 2 ? [{ id: "b1", layout: "gallery", kicker: { fr: "Le projet" }, title: { fr: "Toutes les pièces" }, slots: rest.slice(0, 12).map((work) => ({ work })) }] : [],
    cta: { kicker: { fr: "Ton prochain univers", en: "Your next universe" }, title: { fr: "Et si on imaginait\nl'identité de ta chaîne ?", en: "What if we imagined\nyour channel's identity?" } },
  };
}

// --- Lecture et vérification ------------------------------------------------------------

const MAX_TEXT = 600;
const str = (v: unknown, max = MAX_TEXT) => (typeof v === "string" ? v.replace(/\r/g, "").slice(0, max) : "");
const loc = (v: unknown, max = MAX_TEXT): L => {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const en = str(o.en, max);
  return en ? { fr: str(o.fr, max), en } : { fr: str(o.fr, max) };
};
const workId = (v: unknown) => (typeof v === "string" && /^[\w-]{1,120}$/.test(v) ? v : undefined);
const cssAspect = (v: unknown) => (typeof v === "string" && /^aspect-\[\d+\/\d+\]$|^aspect-(video|square)$/.test(v) ? v : undefined);
const imagePath = (v: unknown) => (typeof v === "string" && /^\/[\w\-/.]+$/.test(v) ? v : undefined);

function slot(v: unknown): Slot | undefined {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const work = workId(o.work);
  if (!work) return undefined;
  const s: Slot = { work };
  if (o.caption) s.caption = loc(o.caption, 200);
  if (imagePath(o.image)) s.image = imagePath(o.image);
  if (cssAspect(o.aspect)) s.aspect = cssAspect(o.aspect);
  return s;
}

function block(v: unknown, i: number): Block | undefined {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const layout = layoutIds.find((id) => id === o.layout);
  if (!layout) return undefined;
  const def = layouts[layout];
  const b: Block = {
    id: typeof o.id === "string" && /^[\w-]{1,40}$/.test(o.id) ? o.id : `b${i + 1}`,
    layout,
    slots: (Array.isArray(o.slots) ? o.slots : []).map(slot).filter((s): s is Slot => Boolean(s)).slice(0, def.max),
  };
  for (const f of def.fields) if (o[f]) b[f] = loc(o[f]);
  return b;
}

// Page enregistrée (vérifiée), ou null si la fiche contient autre chose (anciens textes seuls, rien…)
export function storedPage(raw: unknown): BuilderPage | null {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  if (!o || o.builder !== 1 || !o.page || typeof o.page !== "object") return null;
  const p = o.page as Record<string, unknown>;
  const h = p.header && typeof p.header === "object" ? (p.header as Record<string, unknown>) : {};
  const c = p.cta && typeof p.cta === "object" ? (p.cta as Record<string, unknown>) : {};
  return {
    header: {
      eyebrow: loc(h.eyebrow, 120),
      headline: loc(h.headline, 200),
      intro: loc(h.intro),
      hero: workId(h.hero),
      heroCaption: loc(h.heroCaption, 200),
      headerLogo: slot(h.headerLogo),
    },
    blocks: (Array.isArray(p.blocks) ? p.blocks : []).slice(0, 30).map(block).filter((b): b is Block => Boolean(b)),
    cta: { kicker: loc(c.kicker, 120), title: loc(c.title, 200) },
  };
}

export type StoredPage = { builder: 1; page: BuilderPage };
export const toStored = (page: BuilderPage): StoredPage => ({ builder: 1, page });

// Ordre des visuels dans la page (pour la visionneuse) : ouverture, puis bloc par bloc
export function pageWorkIds(page: BuilderPage): string[] {
  return [page.header.hero, page.header.headerLogo?.work, ...page.blocks.flatMap((b) => b.slots.map((s) => s.work))].filter((id): id is string => Boolean(id));
}
