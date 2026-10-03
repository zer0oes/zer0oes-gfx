// Installation de la base Supabase : migrations dans l'ordre, puis seed.
// Indépendant du client Postgres (postgres.js en vrai, PGlite dans les tests).
import fs from "node:fs";
import path from "node:path";

export type Db = {
  // Plusieurs instructions SQL d'un coup, sans paramètre
  exec(sql: string): Promise<void>;
  // Une instruction, avec paramètres $1, $2…
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  // Tout ou rien
  transaction(fn: (tx: Db) => Promise<void>): Promise<void>;
};

export type Migration = { version: string; name: string; sql: string };

export function readMigrations(root: string): Migration[] {
  const dir = path.join(root, "supabase", "migrations");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((file) => {
      const m = file.match(/^(\d+)_(.+)\.sql$/);
      if (!m) throw new Error(`Nom de migration inattendu : ${file}`);
      return { version: m[1], name: m[2], sql: fs.readFileSync(path.join(dir, file), "utf8") };
    });
}

// Même table que la CLI Supabase : elle reconnaîtra ces migrations si on l'utilise plus tard.
const TRACKING = `
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version text primary key,
    statements text[],
    name text
  );`;

async function exists(db: Db, relation: string) {
  const [row] = await db.query<{ r: string | null }>(`select to_regclass($1)::text as r`, [relation]);
  return row.r !== null;
}

export async function appliedVersions(db: Db): Promise<Set<string>> {
  if (!(await exists(db, "supabase_migrations.schema_migrations"))) return new Set();
  const rows = await db.query<{ version: string }>(`select version from supabase_migrations.schema_migrations`);
  return new Set(rows.map((r) => r.version));
}

export type Plan = {
  pending: Migration[];
  applied: string[];
  // Le seed n'est exécuté qu'à la première installation (offres vides) :
  // il écraserait sinon les modifications faites depuis l'admin.
  seed: boolean;
  // Tables déjà présentes sans trace de migration : installation manuelle, on n'y touche pas.
  conflict: string | null;
};

export async function plan(db: Db, migrations: Migration[], opts: { forceSeed?: boolean } = {}): Promise<Plan> {
  const applied = await appliedVersions(db);
  const pending = migrations.filter((m) => !applied.has(m.version));
  const packsExist = await exists(db, "public.packs");
  const conflict =
    applied.size === 0 && packsExist
      ? "Des tables existent déjà (public.packs) sans historique de migration : base installée à la main ?"
      : null;
  let seed = opts.forceSeed ?? false;
  if (!seed) {
    if (!packsExist) seed = true;
    else seed = (await db.query<{ n: number }>(`select count(*)::int as n from public.packs`))[0].n === 0;
  }
  return { pending, applied: [...applied].sort(), seed, conflict };
}

export async function apply(db: Db, p: Plan, seedSql: string, log: (s: string) => void = () => {}) {
  if (p.conflict) throw new Error(p.conflict);
  await db.exec(TRACKING);
  for (const m of p.pending) {
    // Chaque migration et son enregistrement dans la même transaction
    await db.transaction(async (tx) => {
      await tx.exec(m.sql);
      await tx.query(`insert into supabase_migrations.schema_migrations (version, name, statements) values ($1, $2, $3)`, [
        m.version,
        m.name,
        [m.sql],
      ]);
    });
    log(`migration appliquée : ${m.version}_${m.name}`);
  }
  if (p.seed) {
    await db.transaction((tx) => tx.exec(seedSql));
    log("seed appliqué");
  }
}

export type Report = { tables: number; withoutRls: string[]; buckets: string[]; counts: Record<string, number> };

export async function verify(db: Db): Promise<Report> {
  const tables = await db.query<{ relname: string; rls: boolean }>(
    `select c.relname, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' order by c.relname`,
  );
  const buckets = (await db.query<{ id: string }>(`select id from storage.buckets order by id`)).map((b) => b.id);
  const counts: Record<string, number> = {};
  for (const t of ["packs", "formulas", "options", "streamers", "works", "emotes"]) {
    counts[t] = (await db.query<{ n: number }>(`select count(*)::int as n from public.${t}`))[0].n;
  }
  return { tables: tables.length, withoutRls: tables.filter((t) => !t.rls).map((t) => t.relname), buckets, counts };
}

// Contrôle de SUPABASE_DB_URL sans jamais renvoyer le mot de passe.
export function describeDbUrl(raw: string, supabaseUrl?: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false as const, error: "SUPABASE_DB_URL n'est pas une adresse valide (postgresql://…)." };
  }
  if (!/^postgres(ql)?:$/.test(u.protocol)) return { ok: false as const, error: "SUPABASE_DB_URL doit commencer par postgresql://" };
  if (!u.password || u.password.includes("YOUR-PASSWORD") || u.password === "[YOUR-PASSWORD]") {
    return { ok: false as const, error: "Le mot de passe de la base manque dans SUPABASE_DB_URL (remplace [YOUR-PASSWORD])." };
  }
  // Session pooler : utilisateur postgres.<ref>, hôte *.pooler.supabase.com, port 5432
  const ref = decodeURIComponent(u.username).match(/^postgres\.([a-z0-9]+)$/)?.[1] ?? u.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/)?.[1] ?? null;
  const warnings: string[] = [];
  if (u.port === "6543") warnings.push("Port 6543 = « Transaction pooler » : prends plutôt la chaîne « Session pooler » (port 5432).");
  if (/^db\./.test(u.hostname)) warnings.push("Connexion directe (IPv6 seulement) : si elle échoue, prends la chaîne « Session pooler ».");
  const expected = supabaseUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] ?? null;
  if (ref && expected && ref !== expected) {
    return { ok: false as const, error: `SUPABASE_DB_URL vise le projet ${ref}, mais NEXT_PUBLIC_SUPABASE_URL le projet ${expected}.` };
  }
  return { ok: true as const, ref, host: u.hostname, port: u.port || "5432", warnings };
}
