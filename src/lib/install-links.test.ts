import assert from "node:assert/strict";
import { test } from "node:test";
import { checkInstallCode, installAccessKey, isInstallPlatform } from "./install-links";
import { allFinalsAccessed, finalAssetKeys } from "./final-downloads";
import { archiveEntries } from "./order-archive";

test("liens d'installation : code c4ldas et plateformes", () => {
  assert.equal(checkInstallCode("  AbC-12_x "), "AbC-12_x");
  assert.equal(checkInstallCode("ab"), null);
  assert.equal(checkInstallCode("<script>"), null);
  assert.equal(isInstallPlatform("streamlabs"), true);
  assert.equal(isInstallPlatform("obs"), false);
  assert.equal(installAccessKey({ install: "streamelements", code: "XYZ1" }), "streamelements:XYZ1");
  assert.equal(installAccessKey({ install: "streamlabs", url: "https://streamlabs.com/x" }), "https://streamlabs.com/x");
});

test("liens d'installation : téléchargements suivis, archive sans code seul", () => {
  const item = {
    storagePath: undefined,
    url: undefined,
    finalAssets: [
      { path: "o1/a-widget.zip", label: "Widget ZIP" },
      { label: "Installer sur StreamElements", install: "streamelements" as const, code: "XYZ1" },
      { label: "Installer sur Streamlabs", install: "streamlabs" as const, url: "https://streamlabs.com/theme" },
    ],
  };
  assert.deepEqual(finalAssetKeys(item), ["o1/a-widget.zip", "streamelements:XYZ1", "https://streamlabs.com/theme"]);
  assert.equal(allFinalsAccessed({ ...item, accessedFinalAssets: ["o1/a-widget.zip"] }), false);
  assert.equal(allFinalsAccessed({ ...item, accessedFinalAssets: ["o1/a-widget.zip", "streamelements:XYZ1", "https://streamlabs.com/theme"] }), true);
  // l'archive ne contient pas le code seul (pas de fichier ni de lien)
  const entries = archiveEntries("o1", [{ id: "d1", orderId: "o1", kind: "fichier", label: "Widget", createdAt: "", ...item }]);
  assert.deepEqual(entries.map((entry) => entry.label), ["Widget ZIP", "Installer sur Streamlabs"]);
});
