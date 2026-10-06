// Traductions à clés stables, stockées dans le contenu JSON existant de l'accueil.
export function translationValues(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(Object.entries(raw).filter(([key, value]) =>
    (key.startsWith("translation:") || key.startsWith("en:") || key.startsWith("page:")) && typeof value === "string")) as Record<string, string>;
}

export function translationsFromForm(raw: unknown, form: FormData, fields: Record<string, string>): Record<string, string> {
  const content = raw && typeof raw === "object" ? { ...raw } as Record<string, string> : {};
  for (const [name, key] of Object.entries(fields)) {
    const value = form.get(`en:${name}`);
    if (typeof value !== "string") continue;
    const clean = value.replace(/\r/g, "").trim().slice(0, 5000);
    if (clean) content[key] = clean;
    else delete content[key];
  }
  return content;
}

export function withTranslations<T extends object>(value: T, raw: unknown, scope: string, fields: string[], arrayFields: string[] = []): T {
  const stored = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const english: Record<string, unknown> = {};
  for (const field of fields) {
    const text = stored[`translation:${scope}:${field}`];
    if (typeof text !== "string" || !text) continue;
    english[field] = arrayFields.includes(field) || Array.isArray((value as Record<string, unknown>)[field]) ? text.split("\n").map((line) => line.trim()).filter(Boolean) : text;
  }
  return { ...value, __en: english };
}
