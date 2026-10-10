// Brief des créations achetées : une réponse par création, ou une par partie (chaque alerte d'un pack d'alertes,
// chaque emote selon le nombre acheté). Les parties sont réunies en une seule réponse « Partie : texte » par ligne.

export type BriefPart = { label: string; labelEn: string };

const ALERT_LABELS: Record<string, string> = { follow: "Follow", sub: "Sub", raid: "Raid", cheer: "Cheer", tips: "Tips", tip: "Tips" };
const MAX_PARTS = 30;

// Parties à décrire séparément pour une ligne de commande (null : une seule réponse)
export function productBriefParts(line: string): BriefPart[] | null {
  const quantity = Number(/×\s*(\d+)\s*$/.exec(line)?.[1] ?? 1) || 1;
  if (/alerte|alert/i.test(line) && line.includes(":")) {
    const types = line.slice(line.lastIndexOf(":") + 1).replace(/×\s*\d+\s*$/, "").split(",").map((t) => t.trim()).filter(Boolean);
    if (types.length > 1) return types.slice(0, MAX_PARTS).map((type) => { const label = ALERT_LABELS[type.toLowerCase()] ?? type; return { label, labelEn: label }; });
  }
  if (/emote/i.test(line)) {
    const count = Math.min(MAX_PARTS, (Number(/(\d+)\s+emotes?/i.exec(line)?.[1] ?? 1) || 1) * quantity);
    if (count > 1) return Array.from({ length: count }, (_, i) => ({ label: `Emote ${i + 1}`, labelEn: `Emote ${i + 1}` }));
  }
  return null;
}

export const productBriefFieldName = (line: number, part?: number) => (part === undefined ? `productBrief_${line}` : `productBrief_${line}_${part}`);

// Réponse de chaque ligne ("" si une partie obligatoire manque)
export function readProductBrief(lines: string[], read: (name: string) => string): string[] {
  return lines.map((line, index) => {
    const parts = productBriefParts(line);
    if (!parts) return read(productBriefFieldName(index)).trim().slice(0, 5000);
    const answers = parts.map((part, j) => [part.label, read(productBriefFieldName(index, j)).trim().slice(0, 2000)] as const);
    return answers.some(([, text]) => !text) ? "" : answers.map(([label, text]) => `${label} : ${text}`).join("\n");
  });
}

// Réponse enregistrée découpée par partie (modification du brief)
export function splitProductBrief(line: string, value: string | undefined): string[] {
  const parts = productBriefParts(line);
  if (!parts || !value) return [];
  const result = parts.map(() => "");
  let current = -1;
  for (const row of value.split("\n")) {
    const found = parts.findIndex((part) => row.startsWith(`${part.label} : `));
    if (found >= 0) { current = found; result[found] = row.slice(parts[found].label.length + 3); }
    else if (current >= 0) result[current] += `\n${row}`;
  }
  return result;
}

export function productBriefFields(lines: string[], read: (name: string) => string) {
  const fields: Record<string, string> = {};
  for (const [index, value] of readProductBrief(lines, read).entries()) {
    if (!value) return null;
    fields[`Création ${index + 1} : ${lines[index]}`] = value;
  }
  return fields;
}
