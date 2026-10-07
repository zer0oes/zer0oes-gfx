// Rapport des accès expirés. Aucune suppression, même avec l'ancien argument --yes.
import fs from "node:fs";
for (const file of [".env.local", ".env"]) if (fs.existsSync(file)) process.loadEnvFile(file);
const { getStore } = await import("../src/lib/store");
const { purgeExpiredDeliverables } = await import("../src/lib/retention");
const store = getStore();
const report = await purgeExpiredDeliverables({
  listOrders: () => store.listOrders(),
  listDeliverables: (id) => store.listDeliverables(id),
  deleteDeliverable: async () => {},
  deleteFile: async () => {},
}, { apply: false });
for (const entry of report) console.log(`Accès expiré : ${entry.orderId} — ${entry.items} livrables conservés.`);
console.log("Aucun fichier ni historique supprimé. L’expiration bloque uniquement les accès clients.");