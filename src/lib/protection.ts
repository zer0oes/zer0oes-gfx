// Réglages de protection des médias du portfolio (admin « Offres et réglages »).
export type WatermarkLevel = "off" | "discret" | "visible" | "mosaique";

export type ProtectionSettings = {
  // Floute les médias du portfolio quand la fenêtre perd le focus / capture détectée
  blur: boolean;
  watermark: WatermarkLevel;
};

export const defaultProtection: ProtectionSettings = { blur: true, watermark: "discret" };

export const watermarkLevels: { id: WatermarkLevel; label: string }[] = [
  { id: "off", label: "Désactivé" },
  { id: "discret", label: "Discret (coin de l'image)" },
  { id: "visible", label: "Visible (au centre)" },
  { id: "mosaique", label: "Mosaïque (répété sur toute l'image)" },
];

export function isWatermarkLevel(v: unknown): v is WatermarkLevel {
  return watermarkLevels.some((l) => l.id === v);
}
