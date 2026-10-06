// Vérifie les pages signalées en 404, sur un serveur déjà démarré.
// Usage : node --import tsx scripts/check-public-pages.mts http://localhost:3000
import assert from "node:assert/strict";

const base = new URL(process.argv[2] ?? "http://localhost:3000");
const pages = [
  ["/", "fr"],
  ["/en", "en"],
  ["/portfolio", "fr"],
  ["/en/portfolio", "en"],
  ["/a-propos", "fr"],
  ["/en/a-propos", "en"],
] as const;

for (const [path, lang] of pages) {
  const response = await fetch(new URL(path, base), {
    headers: { "Accept-Language": "fr" },
    redirect: "manual",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, `${path} : HTTP ${response.status}`);
  const html = await response.text();
  const main = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0];
  assert.ok(main, `${path} : contenu principal absent`);
  assert.ok(main.includes(`lang="${lang}"`), `${path} : langue incorrecte`);
  assert.match(main, /<h[12]\b/, `${path} : titres du contenu absents`);
  console.log(`OK ${path} (${lang})`);
}
