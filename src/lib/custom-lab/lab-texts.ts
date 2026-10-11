// Textes du Laboratoire modifiables dans l'admin (stockés avec les autres textes du site, settings.home)

export const STREAMLABS_CUSTOM_WIDGET_URL = "https://streamlabs.com/dashboard#/widgets/customwidget";

export const LAB_TEXT_DEFAULTS = {
  "laboratoire.streamlabs.lien": "Créer un widget personnalisé sur Streamlabs",
  "laboratoire.streamlabs.note": "Il faut d’abord un thème de widgets actif : Widget Themes > Create Widget Theme > Use.",
} as const;

export type LabTextKey = keyof typeof LAB_TEXT_DEFAULTS;
export type LabTexts = Record<LabTextKey, string>;

export function resolveLabTexts(stored: unknown): LabTexts {
  const s = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  return Object.fromEntries(Object.entries(LAB_TEXT_DEFAULTS).map(([key, fallback]) => {
    const value = s[key];
    return [key, typeof value === "string" && value.trim() ? value : fallback];
  })) as LabTexts;
}
