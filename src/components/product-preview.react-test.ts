import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { options } from "@/data/packs";
import { ProductPreview } from "./ProductPreview";

test("les aperçus à la carte sont des schémas neutres sans images du portfolio", () => {
  for (const option of options) {
    const html = renderToStaticMarkup(createElement(ProductPreview, { option, locale: "fr" }));
    assert.doesNotMatch(html, /portfolio|<img|<video/);
  }
});
