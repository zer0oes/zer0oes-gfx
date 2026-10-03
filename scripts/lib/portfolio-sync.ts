// Ajoute à la base les streameurs et réalisations de src/data qui n'y sont pas encore.
// Ne modifie ni ne supprime rien : ce qui a été édité dans l'admin est conservé.
import type { Streamer, Work } from "../../src/data/portfolio";
import type { Db } from "./db-setup-core";

export type PortfolioPlan = { streamers: Streamer[]; works: { work: Work; position: number }[] };

export async function planPortfolio(db: Db, streamers: Streamer[], works: Work[]): Promise<PortfolioPlan> {
  const haveS = new Set((await db.query<{ id: string }>(`select id from public.streamers`)).map((r) => r.id));
  const haveW = new Set((await db.query<{ id: string }>(`select id from public.works`)).map((r) => r.id));
  return {
    streamers: streamers.filter((s) => !haveS.has(s.id)),
    // Position = rang dans src/data, comme le seed
    works: works.map((work, position) => ({ work, position })).filter(({ work }) => !haveW.has(work.id)),
  };
}

export async function applyPortfolio(db: Db, p: PortfolioPlan, allStreamers: Streamer[]) {
  await db.transaction(async (tx) => {
    for (const s of p.streamers) {
      await tx.query(
        `insert into public.streamers (id, position, name, description, url) values ($1, $2, $3, $4, $5) on conflict (id) do nothing`,
        [s.id, allStreamers.indexOf(s), s.name, s.description, s.url ?? null],
      );
    }
    for (const { work: w, position } of p.works) {
      await tx.query(
        `insert into public.works (id, streamer_id, category, position, title, description, image, video, colors, featured)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) on conflict (id) do nothing`,
        [w.id, w.streamer, w.category, position, w.title, w.description, w.image ?? null, w.video ?? null, w.colors, Boolean(w.featured)],
      );
      for (const [i, e] of (w.emotes ?? []).entries()) {
        await tx.query(`insert into public.emotes (work_id, position, name, grp, src, animated) values ($1, $2, $3, $4, $5, $6) on conflict do nothing`, [
          w.id,
          i,
          e.name,
          e.group,
          e.src,
          Boolean(e.animated),
        ]);
      }
    }
  });
}
