import assert from "node:assert/strict";
import { test } from "node:test";
import { options } from "@/data/packs";
import { optionContentFor, optionContentFromForm, withoutOptionContent } from "./option-content";

const overlay = options.find((o) => o.id === "overlay-fixe-unite")!;

test("contenu d'une option : textes d'origine, puis ceux de l'admin", () => {
  const initial = optionContentFor(overlay, null, "fr");
  assert.match(initial.description, /scène de stream statique/);
  assert.equal(initial.files[0], "Un PNG 1920 × 1080 à fond transparent");
  assert.deepEqual(initial.compat, ["obs", "streamelements", "streamlabs"]);

  const form = new FormData();
  form.set("description", "Ma description");
  form.set("files", "Fichier A\n\n Fichier B ");
  form.set("en:description", "");
  form.set("en:files", "File A");
  form.set("compat_obs", "on");
  const content = optionContentFromForm({ autre: "gardé" }, overlay.id, form);
  assert.equal(content.autre, "gardé");
  const fr = optionContentFor(overlay, content, "fr");
  assert.deepEqual({ description: fr.description, files: fr.files, compat: fr.compat }, { description: "Ma description", files: ["Fichier A", "Fichier B"], compat: ["obs"] });
  const en = optionContentFor(overlay, content, "en");
  assert.equal(en.description, "Ma description"); // pas de traduction : le français saisi
  assert.deepEqual(en.files, ["File A"]);

  // Liste vidée : plus de « Tu reçois »
  form.set("files", "");
  form.set("en:files", "");
  assert.deepEqual(optionContentFor(overlay, optionContentFromForm(content, overlay.id, form), "fr").files, []);

  // Option supprimée : son contenu disparaît, le reste est gardé
  const cleaned = withoutOptionContent(content, overlay.id);
  assert.deepEqual(Object.keys(cleaned), ["autre"]);
});

test("regroupements : d'origine, puis réglés dans l'admin, avec un nom de carte", async () => {
  const { optionProducts } = await import("./option-products");
  const { optionGroupingFor, withGrouping, withGroupName, groupNameFor } = await import("./option-content");
  const groupOf = (raw: unknown) => (o: (typeof options)[number]) => optionGroupingFor(o, raw).group;
  const initial = optionProducts(options, groupOf(null));
  assert.equal(initial.find((p) => p.id === "overlay-fixe-unite")?.variants.length, 2);
  assert.equal(initial.find((p) => p.id === "emote-statique")?.variants.length, 8);
  assert.equal(optionGroupingFor(options.find((o) => o.id === "emotes-animees-5")!, null).count, 5);
  assert.equal(groupNameFor("alertes", null, "fr"), "Pack d’alertes");

  // L'avatar rejoint la bannière : nouvelle carte commune, nommée
  let raw: Record<string, string> = withGrouping({}, options, "avatar", "banniere");
  const form = new FormData();
  form.set("groupName", "Profil");
  raw = withGroupName(raw, options.find((o) => o.id === "avatar")!, form);
  const grouped = optionProducts(options, groupOf(raw));
  assert.deepEqual(grouped.find((p) => p.variants.some((v) => v.id === "avatar"))?.variants.map((v) => v.id), ["banniere", "avatar"]);
  assert.equal(groupNameFor(optionGroupingFor(options.find((o) => o.id === "banniere")!, raw).group, raw, "en"), "Profil");

  // Overlay animé sorti de sa carte
  raw = withGrouping(raw, options, "overlay-anime-unite", "");
  assert.equal(optionProducts(options, groupOf(raw)).find((p) => p.id === "overlay-fixe-unite")?.variants.length, 1);
});
