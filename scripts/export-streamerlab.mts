// Convertit la bibliothèque locale en projets JSON réimportables dans l'admin.
// Lecture seule du laboratoire source : ni .env, ni SQLite, ni jetons ne sont lus.
import fs from "node:fs/promises";
import path from "node:path";
import { alertboxAlerts } from "../src/lib/custom-lab/alertbox";
import { LAB_PLATFORMS, newLabContent, parseLabContent } from "../src/lib/custom-lab/model";
import type { LabCode } from "../src/lib/custom-lab/types";

const source = process.argv[2];
if (!source) throw new Error("Usage : npx tsx scripts/export-streamerlab.mts <dossier-streamer-lab>");
const root = path.resolve(source, "library");
const output = path.resolve(".data", "streamerlab-import", new Date().toISOString().replace(/[:.]/g, "-"));
await fs.mkdir(output, { recursive: true });

async function read(directory: string, names: string[], fallback = "") {
  for (const name of names) {
    try { return await fs.readFile(path.join(directory, name), "utf8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  return fallback;
}
const sensitive = /(secret|token|password|passwd|api[_-]?key|client[_-]?id)/i;
function clean(source: string, fields: boolean) {
  const object = JSON.parse(source);
  for (const key of Object.keys(object)) if (sensitive.test(key)) {
    if (fields && object[key] && typeof object[key] === "object") object[key].value = "";
    else delete object[key];
  }
  return JSON.stringify(object, null, 2);
}
async function code(directory: string, platform: string, shared = true): Promise<LabCode> {
  return {
    html: await read(directory, ["widget.html"]),
    css: await read(directory, ["widget.css"]),
    js: await read(directory, shared ? [`widget.${platform}.js`, "widget.js"] : ["widget.js"]),
    fields: clean(await read(directory, shared ? [`fields.${platform}.json`, "fields.json"] : ["fields.json"], "{}"), true),
    data: clean(await read(directory, shared ? [`data.${platform}.json`, "data.json"] : ["data.json"], "{}"), false),
  };
}
let count = 0;
let failures = 0;
for (const project of await fs.readdir(root, { withFileTypes: true })) {
  if (!project.isDirectory() || project.isSymbolicLink()) continue;
  const projectRoot = path.join(root, project.name);
  const metadata = JSON.parse(await read(projectRoot, ["project.json"], "{}"));
  for (const category of ["widgets", "alerts"]) {
    const directory = path.join(projectRoot, category);
    let entries;
    try { entries = await fs.readdir(directory, { withFileTypes: true }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") continue; throw error; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
      try {
        const itemRoot = path.join(directory, entry.name);
        const widget = JSON.parse(await read(itemRoot, ["widget.json"], "{}"));
        const content = newLabContent(widget.kind === "alertbox" ? "alertbox" : "widget");
        content.name = widget.name || entry.name;
        if (typeof widget.description === "string") content.description = widget.description.slice(0, 500);
        content.project = metadata.name || project.name;
        for (const platform of LAB_PLATFORMS) {
          const variant = content.variants[platform];
          if (content.kind === "widget") variant.code = await code(itemRoot, platform);
          else {
            const alertRoot = platform === "streamlabs" ? path.join(itemRoot, "streamlabs") : itemRoot;
            variant.settings = await read(alertRoot, ["alertbox.json"], "{}");
            for (const { type } of alertboxAlerts(platform)) variant.alerts[type] = await code(path.join(alertRoot, type), platform, false);
          }
        }
        const filename = `${project.name}-${category}-${entry.name}.json`;
        await fs.writeFile(path.join(output, filename), JSON.stringify(parseLabContent(content), null, 2), { flag: "wx" });
        count++;
      } catch { failures++; console.error(`Conversion refusée : ${project.name}/${category}/${entry.name} (vérifier les JSON et la taille).`); }
    }
  }
}
console.log(`${count} création(s) exportée(s), ${failures} refusée(s). Destination : ${output}`);
console.log("Les médias ne sont pas copiés. Remplacer les références locales avant publication.");
