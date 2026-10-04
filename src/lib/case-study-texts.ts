// Textes des pages projet modifiables dans l'admin. La structure (blocs, visuels choisis)
// vient de src/data/case-studies.ts ; seuls les textes sont remplacés.
import type { EditorialStudy } from "@/data/case-studies";

// Champs qui ne sont pas des textes (identifiants de visuels, réglages de mise en page)
const STRUCTURE_KEYS = new Set(["layout", "type", "id", "hero", "main", "work", "cover", "coverVideo", "image", "aspect", "wide"]);
const MAX = 600;

export type TextField = {
  path: string; // ex. « blocks.1.title »
  label: string;
  value: string;
  kind: "text" | "lines" | "tags"; // lines : une ligne par retour à la ligne ; tags : séparés par des virgules
};
export type TextGroup = { title: string; fields: TextField[] };

const labels: Record<string, string> = {
  eyebrow: "Surtitre",
  headline: "Titre (2 lignes, la 2e en couleur)",
  intro: "Présentation",
  tags: "Mots-clés (séparés par des virgules)",
  heroCaption: "Légende de la scène d'ouverture",
  kicker: "Surtitre",
  title: "Titre (une ligne par ligne)",
  sideTitle: "Titre de la colonne de droite",
  text: "Texte",
  caption: "Légende",
  label: "Nom affiché",
};

const blockNames: Record<string, string> = {
  signature: "La signature",
  scenes: "Les scènes",
  detail: "Le live en détail",
  emotes: "Les emotes",
  beyond: "Au-delà du stream",
};

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function collect(value: Json, path: string[], key: string, out: TextField[], workTitle: (id?: string) => string | undefined, owner?: Record<string, Json>) {
  if (STRUCTURE_KEYS.has(key) && typeof value === "string") return;
  if (typeof value === "string") {
    // Légende ou nom d'un visuel : on précise lequel
    const visual = owner && typeof owner.id === "string" ? (workTitle(owner.id) ?? owner.id) : undefined;
    out.push({ path: path.join("."), label: `${labels[key] ?? key}${visual ? ` — ${visual}` : ""}`, value, kind: "text" });
  } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    out.push({
      path: path.join("."),
      label: labels[key] ?? key,
      value: key === "tags" ? (value as string[]).join(", ") : (value as string[]).join("\n"),
      kind: key === "tags" ? "tags" : "lines",
    });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => collect(v, [...path, String(i)], key, out, workTitle, typeof v === "object" && v && !Array.isArray(v) ? (v as Record<string, Json>) : undefined));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) collect(v, [...path, k], k, out, workTitle, value as Record<string, Json>);
  }
}

// Champs de texte d'une page projet, regroupés comme sur la page
export function textGroups(study: EditorialStudy, workTitle: (id?: string) => string | undefined): TextGroup[] {
  const s = study as unknown as Record<string, Json>;
  const intro: TextField[] = [];
  for (const k of ["eyebrow", "headline", "intro", "tags", "heroCaption", "headerLogo"]) if (k in s) collect(s[k], [k], k, intro, workTitle, s);
  const groups: TextGroup[] = [{ title: "Ouverture", fields: intro }];
  (s.blocks as Json[]).forEach((b, i) => {
    const fields: TextField[] = [];
    collect(b, ["blocks", String(i)], "", fields, workTitle);
    const type = (b as Record<string, Json>).type as string;
    groups.push({ title: `Bloc ${i + 1} — ${blockNames[type] ?? type}`, fields });
  });
  const cta: TextField[] = [];
  collect(s.cta, ["cta"], "", cta, workTitle);
  groups.push({ title: "Appel au contact", fields: cta });
  return groups;
}

// Nouvelle page projet : mêmes blocs et visuels, textes remplacés par ceux saisis.
export function applyTexts(study: EditorialStudy, get: (path: string) => string | null | undefined): EditorialStudy {
  const copy = structuredClone(study) as unknown as Record<string, Json>;
  for (const g of textGroups(study, () => undefined)) {
    for (const f of g.fields) {
      const raw = get(f.path);
      if (raw == null) continue;
      const clean = raw.replace(/\r/g, "").slice(0, MAX);
      const next: Json =
        f.kind === "text"
          ? clean.trim()
          : f.kind === "tags"
            ? clean.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12)
            : clean.split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 4);
      // Titre principal : toujours 2 lignes
      if (f.path === "headline" && Array.isArray(next) && next.length !== 2) continue;
      setPath(copy, f.path.split("."), next);
    }
  }
  return copy as unknown as EditorialStudy;
}

function setPath(obj: Record<string, Json>, path: string[], value: Json) {
  let cur: Json = obj;
  for (const k of path.slice(0, -1)) cur = (cur as Record<string, Json>)[k];
  (cur as Record<string, Json>)[path.at(-1)!] = value;
}

// Textes enregistrés en base : { blocks: types des blocs au moment de la saisie, texts: chemin → texte }.
// La structure (blocs, visuels) reste celle du code : un texte n'est repris que si son bloc
// est toujours du même type à la même place.
export type StoredTexts = { blocks: string[]; texts: Record<string, string> };

export function textsFromForm(study: EditorialStudy, get: (path: string) => string | null | undefined): StoredTexts {
  const texts: Record<string, string> = {};
  for (const g of textGroups(study, () => undefined))
    for (const f of g.fields) {
      const v = get(f.path);
      if (v != null) texts[f.path] = v.replace(/\r/g, "").slice(0, MAX);
    }
  return { blocks: study.blocks.map((b) => b.type), texts };
}

export function withStoredTexts(study: EditorialStudy, raw: unknown): EditorialStudy {
  if (!raw || typeof raw !== "object") return study;
  const { blocks, texts } = raw as Partial<StoredTexts>;
  if (!texts || typeof texts !== "object" || !Array.isArray(blocks)) return study;
  return applyTexts(study, (path) => {
    const m = /^blocks\.(\d+)\./.exec(path);
    if (m && blocks[Number(m[1])] !== study.blocks[Number(m[1])]?.type) return undefined;
    const v = (texts as Record<string, unknown>)[path];
    return typeof v === "string" ? v : undefined;
  });
}
