import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanMarkup, defaultVisualId, defaultVisuals, optionVisualKey, readVisuals, scopeVisualCss, visualFor, visualId, visualsKey, writeVisuals } from "./product-visuals";

const option = (id: string, name: string, category?: "emotes") => ({ id, name, category });

test("sans association, le dessin est choisi d'après le nom du produit", () => {
  assert.equal(defaultVisualId(option("emotes-3", "3 emotes")), "emotes");
  assert.equal(defaultVisualId(option("x", "Bannière Twitch")), "banniere");
  assert.equal(defaultVisualId(option("stinger", "Stinger")), "transition");
  assert.equal(defaultVisualId(option("x", "Synthé / lower third")), "synthe");
  assert.equal(defaultVisualId(option("x", "Overlay animé")), "overlay");
  assert.equal(visualFor(option("x", "Logo"), {}).id, "logo");
});

test("le visuel associé dans l'admin l'emporte, et un visuel supprimé retombe sur celui du nom", () => {
  const raw = { [optionVisualKey("x")]: "avatar" };
  assert.equal(visualFor(option("x", "Logo"), raw).id, "avatar");
  const withoutAvatar = writeVisuals(raw, defaultVisuals.filter((v) => v.id !== "avatar"));
  assert.equal(visualFor(option("x", "Logo"), withoutAvatar).id, "logo");
});

test("la bibliothèque enregistrée remplace les dessins d'origine, même vide", () => {
  assert.equal(readVisuals({}).length, defaultVisuals.length);
  assert.deepEqual(readVisuals(writeVisuals({}, [])), []);
  assert.equal(visualFor(option("x", "Logo"), writeVisuals({}, [])).id, defaultVisuals[0].id);
});

test("les dessins ajoutés plus tard (transition, synthé) rejoignent une fois une bibliothèque déjà enregistrée", () => {
  assert.deepEqual(readVisuals({ [visualsKey]: "[]" }).map((v) => v.id), ["transition", "synthe"]);
  const saved = writeVisuals({}, readVisuals({ [visualsKey]: "[]" }).filter((v) => v.id !== "synthe"));
  assert.deepEqual(readVisuals(saved).map((v) => v.id), ["transition"]);
});

test("le CSS ne vise que son visuel animé ; :scope désigne le visuel", () => {
  const css = scopeVisualCss(":scope { opacity: 1 } .piece, g { color: red } @keyframes spin { to { rotate: 1turn } } @media (min-width: 1px) { rect { x: 1 } }", "logo");
  assert.match(css, /\[data-visuel="logo"\]\[data-anime\]\{ opacity: 1 \}/);
  assert.match(css, /\[data-visuel="logo"\]\[data-anime\] \.piece, \[data-visuel="logo"\]\[data-anime\] g\{/);
  assert.match(css, /@keyframes spin\{ to \{ rotate: 1turn \} \}/);
  assert.match(css, /@media \(min-width: 1px\)\{\[data-visuel="logo"\]\[data-anime\] rect\{/);
  assert.doesNotMatch(scopeVisualCss("a{}</style><script>", "x"), /</);
});

test("le dessin ne peut pas exécuter de script", () => {
  const clean = cleanMarkup('<svg onload="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)"><rect/></a></svg>');
  assert.doesNotMatch(clean, /onload|script|javascript:/);
  assert.match(clean, /<rect\/>/);
});

test("identifiant d'un nouveau visuel : lisible et unique", () => {
  assert.equal(visualId("Écran d'attente", []), "ecran-d-attente");
  assert.equal(visualId("Logo", ["logo"]), "logo-2");
});
