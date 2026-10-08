import assert from "node:assert/strict";
import { test } from "node:test";
import { parseQuoteBrief } from "./quote-brief";

test("le brief exige un univers et une description de chaque livrable accepté", () => {
  const data = new FormData();
  data.set("universe", " Néon ");
  data.set("creation_0", " Logo violet ");
  assert.equal(parseQuoteBrief(data, ["Logo", "Bannière"]), null);
  assert.ok(parseQuoteBrief(data, ["Logo", "Bannière"], ["Bannière"]));
  data.set("creation_1", "Bannière Twitch");
  const brief = parseQuoteBrief(data, ["Logo", "Bannière"]);
  assert.equal(brief?.["Univers / ambiance"], "Néon");
  assert.equal(brief?.["Création 1 — Logo"], "Logo violet");
  data.set("universe", " ");
  assert.equal(parseQuoteBrief(data, ["Logo", "Bannière"]), null);
  assert.ok(parseQuoteBrief(data, ["Logo", "Bannière"], [], []));
  assert.equal(parseQuoteBrief(data, ["Logo", "Bannière"], [], ["colors"]), null);
  data.set("colors", "Violet");
  assert.ok(parseQuoteBrief(data, ["Logo", "Bannière"], [], ["colors"]));
});
