import { Children, cloneElement, isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import type { Locale } from "@/lib/i18n";

type NodeProps = { children?: ReactNode; title?: string; href?: string; name?: string; value?: string | number };
export type DocumentField = { key: string; label: string; section: string; value: string; multiline: boolean; image?: boolean };
const blocks = new Set(["h1", "h2", "h3", "p", "li", "th", "td"]);
const labels: Record<string, string> = { h1: "Titre", h2: "Titre de section", h3: "Sous-titre", p: "Paragraphe", li: "Élément de liste", th: "En-tête de tableau", td: "Cellule du tableau" };

// Les valeurs dynamiques restent liées aux réglages même dans un paragraphe personnalisé.
export function ContentVariable({ value }: { name: string; value: string | number }) { return value; }

export function documentKey(page: string, locale: Locale, field: string) {
  return `page:${page}:${locale}:${field}`;
}

function serialize(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(serialize).join("");
  if (!isValidElement<NodeProps>(node)) return "";
  if (node.type === ContentVariable) return `{{${node.props.name}}}`;
  const text = serialize(node.props.children);
  if (node.type === "br") return "\n";
  if (node.type === "strong" || node.type === "b") return `**${text}**`;
  if ((node.type === "a" || node.type === Link) && node.props.href) {
    let url = node.props.href;
    for (const [name, value] of Object.entries(variables(node))) if (value) url = url.replace(value, `{{${name}}}`);
    return `[${text}](${url})`;
  }
  return text;
}

function variables(node: ReactNode, out: Record<string, string> = {}): Record<string, string> {
  Children.forEach(node, (child) => {
    if (!isValidElement<NodeProps>(child)) return;
    if (child.type === ContentVariable && child.props.name) out[child.props.name] = String(child.props.value ?? "");
    variables(child.props.children, out);
  });
  return out;
}

// Format volontairement limité : texte, retours à la ligne, gras et liens. Aucun HTML interprété.
export function renderDocumentText(text: string, values: Record<string, string> = {}): ReactNode[] {
  const pieces: ReactNode[] = [];
  const pattern = /\{\{([\w.]+)\}\}|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^\s)]+)\)|\n/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > start) pieces.push(text.slice(start, match.index));
    const key = `text-${match.index}`;
    if (match[1]) pieces.push(values[match[1]] ?? match[0]);
    else if (match[2]) pieces.push(<strong key={key}>{renderDocumentText(match[2], values)}</strong>);
    else if (match[3]) {
      const url = match[4].replace(/\{\{([\w.]+)\}\}/g, (token, name: string) => values[name] ?? token);
      if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(url)) {
        pieces.push(<a key={key} href={url} {...(/^https?:\/\//i.test(url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{renderDocumentText(match[3], values)}</a>);
      } else pieces.push(match[3]);
    } else pieces.push(<br key={key} />);
    start = match.index + match[0].length;
  }
  if (start < text.length) pieces.push(text.slice(start));
  return pieces;
}

export function editableDocument(tree: ReactNode, raw: unknown = null, page = "", locale: Locale = "fr") {
  const fields: DocumentField[] = [];
  const counters: Record<string, number> = {};
  const stored = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const values = variables(tree);
  let section = "En-tête";
  const field = (key: string, label: string, children: ReactNode, multiline: boolean) => {
    const value = serialize(children).trim();
    fields.push({ key, label, section, value, multiline });
    const custom = stored[documentKey(page, locale, key)];
    return typeof custom === "string" && custom.trim() ? renderDocumentText(custom, values) : children;
  };
  const walk = (nodes: ReactNode): ReactNode => Children.map(nodes, (node) => {
    if (!isValidElement<NodeProps>(node)) return node;
    if (node.type === PageHeader) {
      const title = field("header.title", "Titre de la page", node.props.title, false);
      const description = field("header.description", "Introduction", node.props.children, true);
      const customTitle = stored[documentKey(page, locale, "header.title")];
      return cloneElement(node, { title: typeof customTitle === "string" && customTitle.trim() ? customTitle : serialize(title), children: description });
    }
    if (typeof node.type === "string" && blocks.has(node.type)) {
      const index = counters[node.type] ?? 0;
      counters[node.type] = index + 1;
      if (node.type === "h2") section = serialize(node.props.children);
      return cloneElement(node, { children: field(`${node.type}.${index}`, `${labels[node.type]} ${index + 1}`, node.props.children, !node.type.startsWith("h")) });
    }
    return cloneElement(node, { children: walk(node.props.children) });
  });
  const content = walk(tree);
  return { fields, content };
}

export function saveDocumentFields(raw: unknown, page: string, form: FormData, defaults: Record<Locale, DocumentField[]>) {
  const content = raw && typeof raw === "object" ? { ...raw } as Record<string, string> : {};
  for (const locale of ["fr", "en"] as const) for (const field of defaults[locale]) {
    if (field.image && locale === "en") continue;
    const value = form.get(`${locale === "en" ? "en:" : ""}p:${field.key}`);
    if (typeof value !== "string") continue;
    const clean = value.replace(/\r/g, "").trim().slice(0, 12000);
    const key = documentKey(page, locale, field.key);
    if (!clean || clean === field.value) delete content[key];
    else content[key] = clean;
  }
  return content;
}
