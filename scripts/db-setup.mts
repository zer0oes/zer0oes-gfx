// Installe (ou met à jour) la base du projet Supabase, sans Docker ni CLI Supabase.
// Lit SUPABASE_DB_URL (chaîne « Session pooler ») dans .env.local.
//
//   npm run db:setup            simulation : affiche ce qui serait fait, ne modifie rien
//   npm run db:setup -- --yes   applique les migrations manquantes (+ seed à la 1re installation)
//   … --seed                    force le seed (écrase les offres / le portfolio modifiés dans l'admin)
//
// Les mots de passe et clés ne sont jamais affichés.
import fs from "node:fs";
import path from "node:path";
import { apply, plan, readMigrations, verify } from "./lib/db-setup-core";
import { connectFromEnv } from "./lib/pg-connect";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const confirm = args.has("--yes");
const forceSeed = args.has("--seed");

const { db, end, safeError } = connectFromEnv(root);

try {
  const migrations = readMigrations(root);
  const p = await plan(db, migrations, { forceSeed });
  if (p.conflict) throw new Error(p.conflict);

  console.log(`Migrations déjà appliquées : ${p.applied.length ? p.applied.join(", ") : "aucune"}`);
  console.log(`À appliquer : ${p.pending.length ? p.pending.map((m) => `${m.version}_${m.name}`).join(", ") : "aucune"}`);
  console.log(`Seed (offres, options, portfolio) : ${p.seed ? (forceSeed ? "oui (forcé)" : "oui (1re installation)") : "non (offres déjà présentes)"}`);

  if (!p.pending.length && !p.seed) {
    console.log("Rien à faire : la base est à jour.");
  } else if (!confirm) {
    console.log("\nSimulation uniquement, rien n'a été modifié. Pour appliquer : npm run db:setup -- --yes");
  } else {
    const seedSql = fs.readFileSync(path.join(root, "supabase", "seed.sql"), "utf8");
    await apply(db, p, seedSql, (s) => console.log("  ✓", s));
  }

  if (p.applied.length || confirm) {
    const r = await verify(db);
    console.log(`\nVérification : ${r.tables} tables, RLS ${r.withoutRls.length ? `ABSENTE sur ${r.withoutRls.join(", ")}` : "activée partout"}`);
    console.log(`Buckets : ${r.buckets.join(", ") || "aucun"}`);
    console.log(`Contenu : ${Object.entries(r.counts).map(([t, n]) => `${t} ${n}`).join(", ")}`);
    if (r.withoutRls.length) process.exitCode = 1;
  }
} catch (e) {
  const msg = safeError(e);
  console.error("Échec :", msg);
  if (/ENOTFOUND|ENETUNREACH|EHOSTUNREACH/.test(msg)) console.error("Connexion impossible : utilise la chaîne « Session pooler ».");
  if (/password authentication failed/.test(msg)) console.error("Mot de passe refusé : vérifie le mot de passe de la base (Project Settings > Database).");
  process.exitCode = 1;
} finally {
  await end();
}
