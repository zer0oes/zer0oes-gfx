import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSettings, packs } from "@/data/packs";
import { packComparison } from "./pack-comparison";
import { contextFromForm, projectContext, storedContext } from "./project-context";

const row = (id: string) => packComparison(packs, defaultSettings, "fr").find((r) => r.id === id)?.cells;

test("comparatif : déduit des livrables, options et formules des packs", () => {
  assert.deepEqual(row("overlays"), ["2 statiques", "5 statiques", "5 animés"]);
  assert.deepEqual(row("alertes"), [false, "5 statiques", "Sur devis"]);
  const emotes = row("emotes") as string[];
  assert.match(emotes[0], /^5 en option, \+60\s€$/);
  assert.match(emotes[1], /^10 en option, \+100\s€$/);
  assert.equal(emotes[2], "15 statiques incluses");
  assert.equal((row("animation") as string[])[1].startsWith("En option, +200"), true);
  assert.deepEqual(row("corrections"), ["2", "2", "3"]);
  assert.deepEqual(row("banniere-avatar"), [true, true, true]);
  // Un livrable modifié dans l'admin change le tableau
  const edited = packs.map((p) => (p.id === "premier-look" ? { ...p, deliverables: p.deliverables.map((l) => l.replace("2 overlays", "3 overlays")) } : p));
  assert.equal(packComparison(edited, defaultSettings, "fr").find((r) => r.id === "overlays")?.cells[0], "3 statiques");
});

test("contexte d'un projet : enregistré en FR et EN, vide = masqué", () => {
  const form = new FormData();
  form.set("channel", " Twitch · variété ");
  form.set("en:channel", "");
  form.set("need", "Une identité lisible");
  form.set("en:need", "A readable identity");
  form.set("games", "");
  const content = contextFromForm({ "page:projet:x:games": "ancien", autre: "gardé" }, "x", form);
  assert.equal(content.autre, "gardé");
  assert.equal(content["page:projet:x:games"], undefined);
  assert.equal(storedContext(content, "x").channel, "Twitch · variété");
  assert.deepEqual(projectContext(content, "x", "en").map((c) => c.value), ["Twitch · variété", "A readable identity"]);
  assert.deepEqual(projectContext(content, "y", "fr"), []);
});
