import assert from "node:assert/strict";
import { test } from "node:test";
import { purgeExpiredDeliverables, type PurgeDeps } from "./retention";

function fake() {
  const deleted: string[] = [];
  const files: string[] = [];
  const deps: PurgeDeps = {
    listOrders: async () => [
      { id: "ancienne", completedAt: "2026-01-01T00:00:00Z" },
      { id: "recente", completedAt: "2026-09-01T00:00:00Z" },
      { id: "en-cours" },
    ],
    listDeliverables: async (id) => [
      { id: `${id}-1`, storagePath: `${id}/a.zip`, previewPath: `${id}/a-apercu.webp` },
      { id: `${id}-2` },
    ],
    deleteDeliverable: async (id) => void deleted.push(id),
    deleteFile: async (p) => void files.push(p),
  };
  return { deps, deleted, files };
}

const now = new Date("2026-10-04T00:00:00Z");

test("purge : seuls les projets clôturés depuis plus de 6 mois", async () => {
  const { deps, deleted, files } = fake();
  const report = await purgeExpiredDeliverables(deps, { apply: true, now });
  assert.deepEqual(report, [{ orderId: "ancienne", items: 2, files: 2 }]);
  assert.deepEqual(files, []);
  assert.deepEqual(deleted, []);
});

test("purge en simulation : rien n'est supprimé", async () => {
  const { deps, deleted, files } = fake();
  const report = await purgeExpiredDeliverables(deps, { apply: false, now });
  assert.equal(report.length, 1);
  assert.equal(deleted.length + files.length, 0);
});
