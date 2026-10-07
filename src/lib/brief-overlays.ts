import { overlayTypes, type Pack } from "@/lib/pricing";

export function includedOverlays(pack: Pack | undefined): number | null {
  const line = pack?.deliverables.find((text) => /\b\d+\s+overlays?\b/i.test(text));
  const count = line?.match(/\b(\d+)\s+overlays?\b/i)?.[1];
  if (count) return Number(count);
  if (pack?.id === "premier-look") return 2;
  if (pack?.id === "identite-signature" || pack?.id === "univers-complet") return 5;
  return null;
}

export function validOverlaySelection(values: FormDataEntryValue[], count: number): boolean {
  return values.length === count && new Set(values).size === count && values.every((v) => typeof v === "string" && overlayTypes.includes(v));
}
