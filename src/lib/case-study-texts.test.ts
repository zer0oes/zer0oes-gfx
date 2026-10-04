import assert from "node:assert/strict";
import { test } from "node:test";
import { caseStudies, type EditorialStudy } from "../data/case-studies";
import { applyTexts, textGroups, textsFromForm, withStoredTexts } from "./case-study-texts";

const study = caseStudies.zer0oes as EditorialStudy;
const fields = textGroups(study, (id) => (id ? `œuvre ${id}` : undefined)).flatMap((g) => g.fields);

test("seuls les textes sont proposés, jamais les identifiants de visuels", () => {
  const paths = fields.map((f) => f.path);
  assert.ok(paths.includes("intro") && paths.includes("headline") && paths.includes("cta.kicker"));
  assert.ok(!paths.some((p) => /(^|\.)(hero|id|main|work|cover|coverVideo|image|aspect|layout|type)$/.test(p)));
  assert.equal(fields.find((f) => f.path === "tags")?.kind, "tags");
});

test("les textes saisis remplacent l'original sans toucher à la structure", () => {
  const out = applyTexts(study, (p) => (p === "intro" ? "  Nouveau texte  " : p === "tags" ? "A, B ,, C" : p === "headline" ? "Une ligne" : undefined));
  assert.equal(out.intro, "Nouveau texte");
  assert.deepEqual(out.tags, ["A", "B", "C"]);
  assert.deepEqual(out.headline, study.headline); // titre principal : 2 lignes obligatoires
  assert.equal(out.hero, study.hero);
  assert.notEqual(study.intro, "Nouveau texte"); // l'original n'est pas modifié
});

test("textes enregistrés : ignorés si le bloc a changé de type", () => {
  const firstBlockTitle = fields.find((f) => f.path.startsWith("blocks.0."))!.path;
  const stored = textsFromForm(study, (p) => (p === firstBlockTitle ? "Titre modifié" : p === "eyebrow" ? "Surtitre modifié" : undefined));
  const ok = withStoredTexts(study, stored) as unknown as Record<string, unknown>;
  assert.equal(ok.eyebrow, "Surtitre modifié");
  const moved = withStoredTexts(study, { ...stored, blocks: ["autre", ...stored.blocks.slice(1)] });
  assert.equal(moved.eyebrow, "Surtitre modifié");
  assert.deepEqual(moved.blocks[0], study.blocks[0]);
  assert.equal(withStoredTexts(study, "n'importe quoi"), study);
});
