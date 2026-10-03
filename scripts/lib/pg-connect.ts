// Connexion à la base Supabase depuis le PC (SUPABASE_DB_URL de .env.local), pour les scripts db:*.
// Le mot de passe n'est jamais affiché.
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { describeDbUrl, type Db } from "./db-setup-core";

export function connectFromEnv(root = process.cwd()) {
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

  return {
    db: wrap(sql),
    end: () => sql.end({ timeout: 5 }),
    // Message d'erreur sans la chaîne de connexion
    safeError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      return msg.split(raw).join("<SUPABASE_DB_URL>");
    },
  };
}
