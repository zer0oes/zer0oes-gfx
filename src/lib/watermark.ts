import "server-only";
import type { WatermarkLevel } from "@/lib/protection";
import { applyWatermark, type WatermarkTarget } from "./watermark-core";

// Filigrane incrusté à l'envoi depuis l'admin (images du portfolio et emotes).
export function watermarkImage(input: Uint8Array, level: WatermarkLevel, target: WatermarkTarget = "image") {
  return applyWatermark(input, level, target);
}
