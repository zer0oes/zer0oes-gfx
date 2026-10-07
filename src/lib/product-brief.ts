export function productBriefFields(lines: string[], read: (name: string) => string) {
  const fields: Record<string, string> = {};
  for (const [index, line] of lines.entries()) {
    const value = read(`productBrief_${index}`).trim().slice(0, 5000);
    if (!value) return null;
    fields[`Création ${index + 1} : ${line}`] = value;
  }
  return fields;
}
