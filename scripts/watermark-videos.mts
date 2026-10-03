// Incruste le filigrane (logo blanc) dans les vidéos du portfolio, avec ffmpeg.
// À lancer sur ton PC (ffmpeg doit être installé) : le serveur en ligne ne peut pas le faire.
// Source : assets-src/portfolio/*.mp4 (originaux sans filigrane, conservés)
// Sortie : public/portfolio/*.mp4
// Usage : npm run watermark:videos -- [discret|visible|mosaique]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { frameLayer, type WatermarkLevel } from "../src/lib/watermark-core";

const level = (process.argv[2] ?? "discret") as Exclude<WatermarkLevel, "off">;
if (!["discret", "visible", "mosaique"].includes(level)) throw new Error("Niveau : discret, visible ou mosaique");
const SRC = path.join(process.cwd(), "assets-src", "portfolio");
const OUT = process.env.WATERMARK_OUT ?? path.join(process.cwd(), "public", "portfolio");

for (const file of fs.readdirSync(SRC).filter((f) => f.endsWith(".mp4"))) {
  const input = path.join(SRC, file);
  const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", input])
    .toString()
    .trim()
    .split(",")
    .map(Number);
  // Même calque que pour les images, à la taille de la vidéo
  const layer = path.join(os.tmpdir(), `filigrane-${w}x${h}-${level}.png`);
  fs.writeFileSync(layer, await frameLayer(w, h, level, "image"));
  execFileSync("ffmpeg", [
    "-y", "-hide_banner", "-loglevel", "error",
    "-i", input,
    "-i", layer,
    "-filter_complex", "[0:v][1:v]overlay=0:0,format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-movflags", "+faststart", "-an",
    path.join(OUT, file),
  ]);
  console.log(`${file} : filigrane ${level}`);
}
