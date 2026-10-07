// Postgres en mémoire (PGlite) avec le minimum de Supabase simulé (rôles, auth.jwt(), storage.buckets).
// Sert à vérifier les migrations sans Docker (db:check, tests).
import { PGlite } from "@electric-sql/pglite";
import type { Db } from "./db-setup-core";

export async function supabaseLikePglite() {
  const pg = new PGlite();
  await pg.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema storage;
    create schema auth;
    -- Simulation de auth.jwt() : claims lus dans le réglage request.jwt.claims
    create function auth.jwt() returns jsonb language sql stable
      as $f$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $f$;
    grant usage on schema auth to anon, authenticated;
    create table storage.buckets (
      id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]
    );
  `);
  return pg;
}

type PgLike = Pick<PGlite, "exec" | "query">;

export function pgliteDb(pg: PGlite): Db {
  const wrap = (s: PgLike, root: boolean): Db => ({
    exec: async (sql) => {
      await s.exec(sql);
    },
    query: async <T,>(sql: string, params?: unknown[]) => (await s.query<T>(sql, params)).rows,
    transaction: async (fn) => {
      if (!root) return fn(wrap(s, false));
      await pg.transaction((tx) => fn(wrap(tx, false)));
    },
  });
  return wrap(pg, true);
}
