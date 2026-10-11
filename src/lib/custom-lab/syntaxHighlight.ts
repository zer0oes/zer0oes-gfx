// Port verbatim du surligneur syntaxique maison de public/app.js
// (buildTokenizer + EDITOR_HIGHLIGHTERS) : un tokenizer regex combiné par
// fichier édité (html/css/js/fields), sans dépendance externe.

export function escapeHtml(value: unknown): string {
  const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(value).replace(/[&<>"']/g, (character) => map[character]);
}

type TokenRule = [type: string, source: string];

export function buildTokenizer(rules: TokenRule[]): (source: string) => string {
  const pattern = rules.map(([, source], index) => `(?<t${index}>${source})`).join("|");
  const regex = new RegExp(pattern, "g");
  return function highlight(source: string): string {
    let output = "";
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    regex.lastIndex = 0;
    while ((match = regex.exec(source))) {
      if (match.index > lastIndex) output += escapeHtml(source.slice(lastIndex, match.index));
      const typeIndex = rules.findIndex((_, index) => match!.groups?.[`t${index}`] !== undefined);
      output += `<span class="tok-${rules[typeIndex][0]}">${escapeHtml(match[0])}</span>`;
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) regex.lastIndex += 1;
    }
    output += escapeHtml(source.slice(lastIndex));
    return output;
  };
}

const TEMPLATE_TOKEN: TokenRule = ["template", String.raw`\{\{\s*[\w.-]+\s*\}\}`];

export type EditorFile = "html" | "css" | "js" | "fields" | "data";

const highlighters: Record<Exclude<EditorFile, "data">, (source: string) => string> = {
  html: buildTokenizer([
    ["comment", String.raw`<!--[\s\S]*?-->`],
    TEMPLATE_TOKEN,
    ["string", String.raw`"[^"]*"|'[^']*'`],
    ["tag", String.raw`</?[a-zA-Z][\w:-]*`],
    ["attr", String.raw`[a-zA-Z_:][\w:-]*(?=\s*=)`]
  ]),
  css: buildTokenizer([
    ["comment", String.raw`/\*[\s\S]*?\*/`],
    TEMPLATE_TOKEN,
    ["string", String.raw`"[^"]*"|'[^']*'`],
    ["keyword", String.raw`@[a-zA-Z-]+`],
    ["number", String.raw`#[0-9a-fA-F]{3,8}\b|-?\b\d+\.?\d*(px|em|rem|%|deg|ms|s|vh|vw|fr)?\b`],
    ["attr", String.raw`[a-zA-Z-]+(?=\s*:)`]
  ]),
  js: buildTokenizer([
    ["comment", String.raw`//[^\n]*|/\*[\s\S]*?\*/`],
    TEMPLATE_TOKEN,
    ["string", String.raw`\`(?:\\.|[^\`\\])*\`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'`],
    ["bool", String.raw`\b(?:true|false|null|undefined)\b`],
    [
      "keyword",
      String.raw`\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|try|catch|finally|throw|async|await|yield|import|export|default|from|delete|void|static|get|set)\b`
    ],
    ["number", String.raw`\b\d+\.?\d*(?:[eE][+-]?\d+)?\b`]
  ]),
  fields: buildTokenizer([
    ["key", String.raw`"(?:\\.|[^"\\])*"(?=\s*:)`],
    ["string", String.raw`"(?:\\.|[^"\\])*"`],
    ["bool", String.raw`\btrue\b|\bfalse\b|\bnull\b`],
    ["number", String.raw`-?\b\d+\.?\d*(?:[eE][+-]?\d+)?\b`]
  ])
};

export function highlightSource(file: EditorFile, source: string): string {
  const highlighter = file === "data" ? highlighters.fields : highlighters[file];
  return (highlighter || highlighters.js)(source);
}
