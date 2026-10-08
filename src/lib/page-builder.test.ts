import assert from "node:assert/strict";
import { test } from "node:test";
import { caseStudies, type EditorialStudy } from "@/data/case-studies";
import { fromEditorial, lines, pageWorkIds, say, starterPage, storedPage, toStored } from "./page-builder";
import { trDeep } from "./translations-en";

const zer0oes = caseStudies.zer0oes as EditorialStudy;

test("page d'origine reprise à l'identique, en français et en anglais", () => {
  const page = fromEditorial(zer0oes, trDeep("en", zer0oes));
  assert.deepEqual(page.blocks.map((b) => b.layout), ["signature", "scenes", "detail", "emotes", "media-text"]);
  assert.deepEqual(lines(page.header.headline, "fr"), ["Une nuit", "synthwave."]);
  assert.equal(say(page.blocks[1].slots[1].caption, "fr"), "Pause");
  assert.notEqual(say(page.header.intro, "en"), say(page.header.intro, "fr"));
  assert.equal(pageWorkIds(page)[0], "zer0oes-starting-screen");
  const tomavega = fromEditorial(caseStudies.tomavega as EditorialStudy, caseStudies.tomavega as EditorialStudy);
  assert.equal(tomavega.blocks.at(-1)?.layout, "wide");
  // Recadrage particulier conservé
  assert.equal(tomavega.blocks[1].slots[2].aspect, "aspect-[10/3]");
});

test("page enregistrée : relue et vérifiée", () => {
  const page = fromEditorial(zer0oes, zer0oes);
  const json = (v: unknown) => JSON.parse(JSON.stringify(v));
  assert.deepEqual(json(storedPage(json(toStored(page)))), json(page));
  // Anciens textes seuls : pas une page du constructeur
  assert.equal(storedPage({ blocks: ["signature"], texts: {} }), null);
  const dirty = storedPage({
    builder: 1,
    page: {
      header: { eyebrow: { fr: "x".repeat(500) }, headline: { fr: "A\nB" }, intro: { fr: "" }, hero: "../hack", heroCaption: { fr: "" } },
      blocks: [
        { id: "a", layout: "inconnue", slots: [] },
        { id: "b", layout: "duo", title: { fr: "T", en: "" }, slots: [{ work: "w1" }, { work: "w2" }, { work: "w3" }, { work: 4 }], image: "javascript:x" },
      ],
      cta: { kicker: { fr: "K" }, title: { fr: "C" } },
    },
  })!;
  assert.equal(dirty.header.eyebrow.fr.length, 120);
  assert.equal(dirty.header.hero, undefined);
  assert.equal(dirty.blocks.length, 1);
  assert.deepEqual(dirty.blocks[0].slots.map((s) => s.work), ["w1", "w2"]);
  assert.deepEqual(dirty.blocks[0].title, { fr: "T" });
  assert.equal(say(dirty.blocks[0].title, "en"), "T");
});

test("projet sans page : base avec la première réalisation en ouverture", () => {
  const page = starterPage("Nova", "Desc", ["a", "b", "c"]);
  assert.equal(page.header.hero, "a");
  assert.deepEqual(page.blocks[0].slots.map((s) => s.work), ["b", "c"]);
  assert.equal(starterPage("Nova", "", ["a"]).blocks.length, 0);
});
