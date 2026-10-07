import test from "node:test";
import assert from "node:assert/strict";
import { allFinalsAccessed, hasFinalAccess, readyToClose } from "./final-downloads";

test("la clôture exige tous les téléchargements et le paiement du solde", () => {
  const item = { storagePath: "o/avatar.png", accessedFinalAssets: ["o/avatar.png"] };
  assert.equal(readyToClose({ totalPrice: 100, amountPaid: 30 }, [item]), false);
  assert.equal(readyToClose({ totalPrice: 100, amountPaid: 100 }, [item]), true);
  assert.equal(readyToClose({ totalPrice: 100, amountPaid: 100 }, []), false);
});

test("le verrouillage tient compte des anciens et des nouveaux accès", () => {
  assert.equal(hasFinalAccess({}), false);
  assert.equal(hasFinalAccess({ finalAccessedAt: "2026-10-07T17:00:00Z" }), true);
  assert.equal(hasFinalAccess({ accessedFinalAssets: ["o/avatar.png"] }), true);
});

test("un livrable multi-format est téléchargé uniquement après accès à tous ses fichiers", () => {
  const item = { finalAssets: [{ label: "PNG", path: "o/avatar.png" }, { label: "SVG", path: "o/avatar.svg" }] };
  assert.equal(allFinalsAccessed(item), false);
  assert.equal(allFinalsAccessed({ ...item, accessedFinalAssets: ["o/avatar.png"] }), false);
  assert.equal(allFinalsAccessed({ ...item, accessedFinalAssets: ["o/avatar.png", "o/avatar.svg"] }), true);
  assert.equal(allFinalsAccessed({ ...item, finalAssets: [...item.finalAssets, { label: "PDF", path: "o/avatar.pdf" }], accessedFinalAssets: ["o/avatar.png", "o/avatar.svg"] }), false);
  assert.equal(allFinalsAccessed({}), false);
});
