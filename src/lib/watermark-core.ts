// Incrustation du filigrane (logo blanc zeroes gfx) dans une image, fixe ou animée.
// Partagé par l'admin (envoi de fichiers) et les scripts npm (fichiers du site).
// Le logo est utilisé plutôt que du texte : pas de dépendance aux polices du serveur.
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";

export type WatermarkLevel = "off" | "discret" | "visible" | "mosaique";
export type WatermarkTarget = "image" | "emote";

const LOGO = path.join(process.cwd(), "public", "logo-zeroes-gfx.png");

// Taille du logo (part de la largeur) et opacité, selon le niveau et le type de visuel
const spec: Record<WatermarkTarget, Record<Exclude<WatermarkLevel, "off">, { size: number; opacity: number }>> = {
  image: { discret: { size: 0.16, opacity: 0.55 }, visible: { size: 0.42, opacity: 0.32 }, mosaique: { size: 0.16, opacity: 0.16 } },
  // Emotes : petites images, le logo doit rester lisible
  emote: { discret: { size: 0.42, opacity: 0.45 }, visible: { size: 0.7, opacity: 0.4 }, mosaique: { size: 0.36, opacity: 0.22 } },
};

async function logo(width: number, opacity: number, rotate = 0) {
  let img = sharp(await fs.readFile(LOGO)).resize({ width: Math.max(12, Math.round(width)) }).ensureAlpha();
  img = img.linear([1, 1, 1, opacity], [0, 0, 0, 0]);
  if (rotate) img = sharp(await img.png().toBuffer()).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  return img.png().toBuffer();
}

// Calque de filigrane (PNG transparent) pour une image ou une vidéo de w × h.
export async function frameLayer(w: number, h: number, level: Exclude<WatermarkLevel, "off">, target: WatermarkTarget) {
  const { size, opacity } = spec[target][level];
  const canvas = () => sharp({ create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  if (level === "discret") {
    const mark = await logo(w * size, opacity);
    const m = await sharp(mark).metadata();
    return canvas()
      .composite([{ input: mark, left: Math.max(0, Math.round(w - m.width! - w * 0.025)), top: Math.max(0, Math.round(h - m.height! - w * 0.02)) }])
      .png()
      .toBuffer();
  }
  if (level === "visible") {
    return canvas().composite([{ input: await logo(w * size, opacity), gravity: "center" }]).png().toBuffer();
  }
  const mark = await logo(w * size, opacity, -24);
  const m = await sharp(mark).metadata();
  const tile = await sharp({
    create: { width: Math.round(m.width! * 1.5), height: Math.round(m.height! * 2.2), channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: mark, gravity: "center" }])
    .png()
    .toBuffer();
  return canvas().composite([{ input: tile, tile: true }]).png().toBuffer();
}

// Renvoie l'image filigranée en WebP (animation conservée), ou null si filigrane désactivé.
export async function applyWatermark(
  input: Uint8Array | string,
  level: WatermarkLevel,
  target: WatermarkTarget = "image",
): Promise<{ data: Uint8Array; type: string } | null> {
  if (level === "off") return null;
  const meta = await sharp(input, { animated: true }).metadata();
  const pages = meta.pages ?? 1;
  const w = meta.width!;
  const frameH = meta.pageHeight ?? meta.height!;
  const layer = await frameLayer(w, frameH, level, target);

  let overlays: OverlayOptions[] = [{ input: layer, left: 0, top: 0 }];
  if (pages > 1) {
    // Animation : les images sont empilées verticalement, un calque par image
    overlays = Array.from({ length: pages }, (_, i) => ({ input: layer, left: 0, top: i * frameH }));
  }
  const out = await sharp(input, { animated: pages > 1 })
    .composite(overlays)
    .webp({ quality: target === "emote" ? 88 : 85, ...(pages > 1 ? { loop: meta.loop ?? 0, delay: meta.delay } : {}) })
    .toBuffer();
  return { data: new Uint8Array(out), type: "image/webp" };
}
