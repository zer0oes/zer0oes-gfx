import test from "node:test";
import assert from "node:assert/strict";
import { downloadFilename } from "./delivery";

test("le téléchargement conserve l'extension originale sans changer le libellé", () => {
  assert.equal(downloadFilename("Tartifl8 - Avatar", "order/uuid-original.png"), "Tartifl8 - Avatar.png");
  assert.equal(downloadFilename("Avatar.png", "order/original.png"), "Avatar.png");
  assert.equal(downloadFilename("Avatar", "order/original.webp"), "Avatar.webp");
  assert.equal(downloadFilename("Archive", "order/original.zip"), "Archive.zip");
});
