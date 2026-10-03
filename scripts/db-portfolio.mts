// Ajoute dans Supabase les streameurs et réalisations de src/data/portfolio.ts qui n'y sont pas encore.
// Rien n'est modifié ni supprimé (les changements faits dans l'admin sont conservés).
// À lancer après le déploiement des fichiers médias correspondants (public/portfolio).
//
//   npm run db:portfolio            simulation : liste ce qui serait ajouté
//   npm run db:portfolio -- --yes   ajoute
import { streamers, works } from "../src/data/portfolio";
import { connectFromEnv } from "./lib/pg-connect";
import { applyPortfolio, planPortfolio } from "./lib/portfolio-sync";

const confirm = process.argv.includes("--yes");
const { db, end, safeError } = connectFromEnv();

try {
  const p = await planPortfolio(db, streamers, works);
  console.log(`Streameurs à ajouter : ${p.streamers.map((s) => s.id).join(", ") || "aucun"}`);
  console.log(`Réalisations à ajouter : ${p.works.map((w) => `${w.work.id} (${w.work.category})`).join(", ") || "aucune"}`);
  if (!p.streamers.length && !p.works.length) console.log("Rien à faire : le portfolio est à jour.");
  else if (!confirm) console.log("\nSimulation uniquement, rien n'a été modifié. Pour appliquer : npm run db:portfolio -- --yes");
  else {
    await applyPortfolio(db, p, streamers);
    console.log("  ✓ ajouté");
  }
} catch (e) {
  console.error("Échec :", safeError(e));
  process.exitCode = 1;
} finally {
  await end();
}
