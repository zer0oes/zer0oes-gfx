// Supprime les fichiers livrés (et aperçus) des projets clôturés depuis plus de 6 mois.
//   npm run purge:livrables            → simulation (liste ce qui serait supprimé)
//   npm run purge:livrables -- --yes   → suppression
// En production : à lancer chaque jour par Heroku Scheduler (voir README).
import fs from "node:fs";

for (const file of [".env.local", ".env"]) if (fs.existsSync(file)) process.loadEnvFile(file);
const apply = process.argv.includes("--yes");

const { getStore } = await import("../src/lib/store");
const { s3Configured, s3DeliverableDelete } = await import("../src/lib/s3");
const { purgeExpiredDeliverables } = await import("../src/lib/retention");

const store = getStore();
if (store.kind === "static") {
  console.error("Aucune base configurée : rien à purger.");
  process.exit(1);
}
const report = await purgeExpiredDeliverables(
  {
    listOrders: () => store.listOrders(),
    listDeliverables: (id) => store.listDeliverables(id),
    deleteDeliverable: (id) => store.deleteDeliverable(id),
    // Fichiers dans S3 (dossier privé) ; sans S3, la suppression de l'élément retire le fichier du stockage Supabase
    deleteFile: async (path) => {
      if (s3Configured()) await s3DeliverableDelete(path);
    },
  },
  { apply },
);
if (!report.length) console.log("Aucun projet clôturé depuis plus de 6 mois avec des fichiers à supprimer.");
for (const r of report) console.log(`${apply ? "✓ supprimé" : "à supprimer"} : commande ${r.orderId} — ${r.items} élément(s), ${r.files} fichier(s)`);
if (!apply && report.length) console.log("Simulation uniquement : ajoute --yes pour supprimer.");
