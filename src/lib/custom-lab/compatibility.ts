// Compatibilité d'une création du Laboratoire : plateformes dont le code est rempli.
// Widget : HTML, CSS ou JS non vide et différent du code d'exemple d'une nouvelle création ;
// pack d'alertes : au moins une alerte dans ce cas ; overlay : plateformes communes à tous ses widgets
// (les deux s'il n'en contient aucun).
import { LAB_PLATFORMS, newLabContent } from "./model";
import type { Platform } from "./platformEvents";
import type { LabCode, LabContent } from "./types";

const parts = (code?: LabCode) => [code?.html ?? "", code?.css ?? "", code?.js ?? ""];
const filled = (code: LabCode | undefined, example: LabCode | undefined) =>
  parts(code).some((part) => part.trim()) && parts(code).some((part, i) => part !== parts(example)[i]);

export function codePlatforms(content: Pick<LabContent, "kind" | "variants">): Platform[] {
  if (content.kind === "overlay") return [];
  const example = newLabContent(content.kind);
  const legacyAlert = content.kind === "alertbox" ? Object.values(example.variants.streamelements.alerts)[0] : undefined;
  return LAB_PLATFORMS.filter((platform) => {
    const variant = content.variants[platform];
    const sample = example.variants[platform];
    return content.kind === "alertbox"
      // ancien code d'exemple des alertes (identique sur les deux plateformes) : ne compte pas non plus
      ? Object.entries(variant.alerts).some(([type, code]) => filled(code, sample.alerts[type]) && filled(code, legacyAlert))
      : filled(variant.code, sample.code);
  });
}

export function overlayPlatforms(widgetIds: readonly string[], platformsOf: (id: string) => readonly Platform[] | undefined): Platform[] {
  const widgets = widgetIds.map(platformsOf).filter((p): p is readonly Platform[] => Boolean(p));
  if (!widgets.length) return [...LAB_PLATFORMS];
  return LAB_PLATFORMS.filter((platform) => widgets.every((p) => p.includes(platform)));
}
