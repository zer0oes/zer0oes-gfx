import test from "node:test";
import assert from "node:assert/strict";
import { previewHistory } from "./preview-history";

test("les remarques suivent l'aperçu publié au moment de la demande", () => {
  const versions = previewHistory({
    previewVersions: [
      { path: "v1.png", publishedAt: "2026-10-07T10:00:00Z" },
      { path: "v2.png", publishedAt: "2026-10-07T12:00:00Z" },
    ],
    clientNotes: [
      { at: "2026-10-07T11:00:00Z", body: "Agrandir le logo" },
      { at: "2026-10-07T13:00:00Z", body: "Changer la couleur" },
    ],
  });
  assert.deepEqual(versions[0].notes.map((note) => note.body), ["Agrandir le logo"]);
  assert.deepEqual(versions[1].notes.map((note) => note.body), ["Changer la couleur"]);
});
