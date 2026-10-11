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

test("brief : titre et consigne adaptés à l'offre et à sa variante (statique ou animée)", async () => {
  const { productBriefBlock } = await import("./option-products");
  const alerts = productBriefBlock("Pack d’alertes statique — 5 alertes : follow, sub, raid, cheer, tips", "fr");
  assert.equal(alerts.title, "Personnalise tes 5 alertes");
  assert.match(alerts.hint, /^Pour chaque alerte — follow, sub, raid, cheer et tips/);
  assert.equal(productBriefBlock("Pack d’alertes animées — 5 alertes : follow, sub, raid, cheer, tips", "fr").title, "Imagine tes 5 alertes animées");
  assert.equal(productBriefBlock("Pack de 3 emotes statiques × 2", "fr").title, "Personnalise tes 6 emotes");
  assert.equal(productBriefBlock("Pack de 5 emotes animées", "fr").title, "Imagine tes 5 emotes animées");
  assert.equal(productBriefBlock("Emote statique", "fr").title, "Décris ton emote");
  assert.equal(productBriefBlock("Emote animée", "en").title, "Imagine your animated emote");
  assert.equal(productBriefBlock("Animation d’une emote existante", "fr").title, "Donne vie à ton emote");
  assert.equal(productBriefBlock("Animation légère d'un overlay existant", "fr").title, "Anime ton overlay");
  assert.equal(productBriefBlock("Animation du logo", "fr").title, "Donne vie à ton logo");
  assert.equal(productBriefBlock("Overlay statique", "fr").title, "Personnalise ton overlay");
  assert.equal(productBriefBlock("Overlay animé", "fr").title, "Imagine ton overlay animé");
  assert.equal(productBriefBlock("Widget interactif avancé", "fr").title, "Imagine les interactions de ton widget");
  assert.equal(productBriefBlock("Widget personnalisé", "fr").title, "Décris ton widget");
  assert.equal(productBriefBlock("Logo", "fr").title, "Définis ton logo");
  assert.equal(productBriefBlock("Logo avec déclinaisons", "fr").title, "Définis ton logo et ses déclinaisons");
  assert.equal(productBriefBlock("Bannière pour YouTube / Twitch", "fr").title, "Personnalise ta bannière");
  assert.equal(productBriefBlock("Avatar", "fr").title, "Imagine ton avatar");
  assert.equal(productBriefBlock("Pack de 6 panneaux Twitch", "fr").title, "Personnalise tes 6 panneaux");
});
