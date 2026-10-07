import assert from "node:assert/strict";
import { test } from "node:test";
import { packs } from "@/data/packs";
import { includedOverlays, validOverlaySelection } from "./brief-overlays";

test("le nombre d’overlays suit les livrables du pack", () => {
  assert.equal(includedOverlays(packs[0]), 2);
  assert.equal(includedOverlays(packs[1]), 5);
  assert.equal(includedOverlays({ ...packs[0], deliverables: ["3 overlays fixes au choix"] }), 3);
  assert.equal(includedOverlays(undefined), null);
});

test("seul le nombre exact d’overlays distincts du catalogue est accepté", () => {
  assert.equal(validOverlaySelection(["Démarrage", "Gameplay"], 2), true);
  assert.equal(validOverlaySelection([], 2), false);
  assert.equal(validOverlaySelection(["Gameplay"], 2), false);
  assert.equal(validOverlaySelection(["Démarrage", "Gameplay", "Pause"], 2), false);
  assert.equal(validOverlaySelection(["Gameplay", "Gameplay"], 2), false);
  assert.equal(validOverlaySelection(["Gameplay", "Inconnu"], 2), false);
  assert.equal(validOverlaySelection(["Démarrage", "Pause", "Fin", "Discussion", "Gameplay"], 5), true);
});
