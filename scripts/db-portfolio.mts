// Ajoute dans Supabase les streameurs et réalisations de src/data/portfolio.ts qui n'y sont pas encore.
// Rien n'est modifié ni supprimé (les changements faits dans l'admin sont conservés),
// sauf les réalisations nommées avec --maj, mises à jour depuis src/data.
// À lancer après le déploiement des fichiers médias correspondants (public/portfolio).
//
//   npm run db:portfolio                                simulation
//   npm run db:portfolio -- --yes                       ajoute les réalisations manquantes
//   npm run db:portfolio -- --yes --maj id1,id2         … et met à jour id1 et id2
import { streamers, works } from "../src/data/portfolio";
import { connectFromEnv } from "./lib/pg-connect";
import { applyPortfolio, planPortfolio, updateWorks } from "./lib/portfolio-sync";

const args = process.argv.slice(2);
const confirm = args.includes("--yes");
const majArg = args.find((a) => a.startsWith("--maj"));
const maj = (majArg?.includes("=") ? majArg.split("=")[1] : majArg ? args[args.indexOf(majArg) + 1] : "")
  ?.split(",")
  .map((s) => s.trim())
  .filter(Boolean) ?? [];
const { db, end, safeError } = connectFromEnv();

try {
  const p = await planPortfolio(db, streamers, works);
  const toUpdate = maj.filter((id) => !p.works.some((w) => w.work.id === id));
  console.log(`Streameurs à ajouter : ${p.streamers.map((s) => s.id).join(", ") || "aucun"}`);
  console.log(`Réalisations à ajouter : ${p.works.map((w) => `${w.work.id} (${w.work.category})`).join(", ") || "aucune"}`);
  console.log(`Réalisations à mettre à jour (--maj) : ${toUpdate.join(", ") || "aucune"}`);
  if (!p.streamers.length && !p.works.length && !toUpdate.length) console.log("Rien à faire : le portfolio est à jour.");
  else if (!confirm) console.log("\nSimulation uniquement, rien n'a été modifié. Ajoute --yes pour appliquer.");
  else {
    await applyPortfolio(db, p, streamers);
    if (toUpdate.length) console.log(`  ✓ mis à jour : ${(await updateWorks(db, works, toUpdate)).join(", ") || "aucune"}`);
    console.log("  ✓ terminé");
  }
} catch (e) {
  console.error("Échec :", safeError(e));
  process.exitCode = 1;
} finally {
  await end();
}
