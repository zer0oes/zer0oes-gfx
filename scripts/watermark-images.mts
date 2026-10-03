// Incruste le filigrane dans les images et emotes du portfolio fournies avec le site.
// Source : assets-src/portfolio/ (originaux sans filigrane, conservés)
// Sortie : public/portfolio/ (images) et public/portfolio/emotes/ (emotes, animation conservée)
// Usage : npm run watermark:images -- [discret|visible|mosaique|off]
import fs from "node:fs";
import path from "node:path";
import { applyWatermark, type WatermarkLevel } from "../src/lib/watermark-core";

const level = (process.argv[2] ?? "discret") as WatermarkLevel;
const SRC = path.join(process.cwd(), "assets-src", "portfolio");
const OUT = path.join(process.cwd(), "public", "portfolio");

for (const [dir, target] of [["", "image"], ["emotes", "emote"]] as const) {
  for (const file of fs.readdirSync(path.join(SRC, dir)).filter((f) => f.endsWith(".webp"))) {
    const input = path.join(SRC, dir, file);
    const out = path.join(OUT, dir, file);
    const result = await applyWatermark(input, level, target);
    if (result) fs.writeFileSync(out, result.data);
    else fs.copyFileSync(input, out);
  }
  console.log(`${dir || "images"} : filigrane ${level}`);
}
