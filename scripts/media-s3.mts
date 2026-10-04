// Copie les médias du site (public/portfolio, public/a-propos) dans le bucket S3, puis vérifie
// qu'ils sont lisibles publiquement à l'adresse NEXT_PUBLIC_MEDIA_URL.
//   npm run media:s3            → simulation (liste ce qui serait envoyé)
//   npm run media:s3 -- --yes   → envoi
// Clés lues dans .env.local (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET,
// NEXT_PUBLIC_MEDIA_URL) ; elles ne sont jamais affichées.
import fs from "node:fs";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

for (const file of [".env.local", ".env"]) if (fs.existsSync(file)) process.loadEnvFile(file);
const { S3_BUCKET: bucket, AWS_REGION: region, NEXT_PUBLIC_MEDIA_URL: base } = process.env;
const missing = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "S3_BUCKET", "NEXT_PUBLIC_MEDIA_URL"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Variables manquantes dans .env.local : ${missing.join(", ")}`);
  process.exit(1);
}
const apply = process.argv.includes("--yes");
const s3 = new S3Client({ region });

const types: Record<string, string> = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".mp4": "video/mp4", ".webm": "video/webm", ".svg": "image/svg+xml" };

function list(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? list(path.join(dir, f.name)) : [path.join(dir, f.name)]));
}
const files = ["public/portfolio", "public/a-propos"].filter((d) => fs.existsSync(d)).flatMap(list).filter((f) => types[path.extname(f).toLowerCase()]);

console.log(`Bucket : ${bucket} (${region}) — ${files.length} médias`);
let sent = 0;
let skipped = 0;
for (const file of files) {
  const key = path.relative("public", file).split(path.sep).join("/");
  const size = fs.statSync(file).size;
  const remote = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })).then((r) => r.ContentLength, () => null);
  if (remote === size) {
    skipped++;
    continue;
  }
  if (!apply) {
    console.log(`  à envoyer : ${key} (${(size / 1024).toFixed(0)} Ko)`);
    continue;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.readFileSync(file),
      ContentType: types[path.extname(file).toLowerCase()],
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  sent++;
  console.log(`  ✓ ${key}`);
}
console.log(apply ? `Envoyés : ${sent}, déjà présents : ${skipped}` : `Déjà présents : ${skipped}. Simulation uniquement : ajoute --yes pour envoyer.`);

// Lecture publique (stratégie du bucket) : un média de chaque dossier
if (apply || skipped) {
  for (const sample of ["portfolio", "a-propos"].map((d) => files.find((f) => f.includes(`${path.sep}${d}${path.sep}`))).filter(Boolean) as string[]) {
    const url = `${base!.replace(/\/+$/, "")}/${path.relative("public", sample).split(path.sep).join("/")}`;
    const r = await fetch(url, { method: "HEAD" });
    console.log(`Lecture publique ${r.ok ? "✓" : "✗ (" + r.status + " : vérifie la stratégie du bucket)"} ${url}`);
  }
}
