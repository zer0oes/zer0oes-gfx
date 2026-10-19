import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { options } from "@/data/packs";
import { visualFor } from "@/lib/product-visuals";
import { ProductPreview } from "./ProductPreview";

test("les aperçus à la carte sont des schémas neutres sans images du portfolio", () => {
  for (const option of options) {
    const html = renderToStaticMarkup(createElement(ProductPreview, { option, visual: visualFor(option, {}), color: "#A78BFA", locale: "fr" }));
    assert.doesNotMatch(html, /portfolio|<img|<video/);
  }
});

test("le CSS d'animation n'est rendu que pour la variante animée, limité à son visuel", () => {
  const option = options.find((o) => /anim/i.test(o.id))!;
  const visual = visualFor(option, {});
  const animated = renderToStaticMarkup(createElement(ProductPreview, { option, visual, color: "#A78BFA", locale: "fr", animated: true }));
  const still = renderToStaticMarkup(createElement(ProductPreview, { option, visual, color: "#A78BFA", locale: "fr", animated: false }));
  assert.match(animated, new RegExp(`\\[data-visuel="${visual.id}"\\]\\[data-anime\\]`));
  assert.doesNotMatch(still, /<style/);
});
