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
import postgres from "postgres";
import { apply, describeDbUrl, plan, readMigrations, verify, type Db } from "./lib/db-setup-core";

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const confirm = args.has("--yes");
const forceSeed = args.has("--seed");

for (const file of [".env.local", ".env"]) {
  // Les variables déjà définies ne sont pas écrasées
  if (fs.existsSync(path.join(root, file))) process.loadEnvFile(path.join(root, file));
}

const raw = process.env.SUPABASE_DB_URL;
if (!raw) {
  console.error(
    "SUPABASE_DB_URL manquante dans .env.local.\n" +
      "Supabase > bouton « Connect » > « Session pooler » : copie la chaîne, remplace [YOUR-PASSWORD]\n" +
      "par le mot de passe de la base, puis ajoute la ligne SUPABASE_DB_URL=… dans .env.local.",
  );
  process.exit(1);
}
const target = describeDbUrl(raw, process.env.NEXT_PUBLIC_SUPABASE_URL);
if (!target.ok) {
  console.error(target.error);
  process.exit(1);
}
console.log(`Base cible : projet ${target.ref ?? "?"} (${target.host}:${target.port})`);
for (const w of target.warnings) console.warn("Attention :", w);

const local = /^(localhost|127\.0\.0\.1)$/.test(target.host);
const sql = postgres(raw, { ssl: local ? false : "require", max: 1, prepare: false, onnotice: () => {}, connect_timeout: 20 });

const wrap = (s: postgres.Sql | postgres.TransactionSql): Db => ({
  exec: async (text) => {
    await s.unsafe(text);
  },
  query: async <T,>(text: string, params: unknown[] = []) =>
    (await s.unsafe(text, params as postgres.ParameterOrJSON<never>[])) as unknown as T[],
  transaction: async (fn) => {
    await (s as postgres.Sql).begin((tx) => fn(wrap(tx)));
  },
});
const db = wrap(sql);

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
  // Message d'erreur seul : jamais la chaîne de connexion
  const msg = e instanceof Error ? e.message : String(e);
  console.error("Échec :", msg.split(raw).join("<SUPABASE_DB_URL>"));
  if (/ENOTFOUND|ENETUNREACH|EHOSTUNREACH/.test(msg)) console.error("Connexion impossible : utilise la chaîne « Session pooler ».");
  if (/password authentication failed/.test(msg)) console.error("Mot de passe refusé : vérifie le mot de passe de la base (Project Settings > Database).");
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
