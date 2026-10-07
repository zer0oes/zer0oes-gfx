import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferPrice } from "./ui";
test("le tarif promotionnel conserve un prix normal barré et des libellés accessibles", () => {
  for (const locale of ["fr", "en"] as const) {
    const html = renderToStaticMarkup(createElement(OfferPrice, { item: { price: 30000, normalPrice: 39000 }, locale }));
    assert.match(html, /<del[^>]*>[^<]*390[^<]*<\/del>/);
    assert.match(html, /300/);
    assert.match(html, locale === "fr" ? /Prix promotionnel/ : /Sale price/);
  }
  assert.doesNotMatch(renderToStaticMarkup(createElement(OfferPrice, { item: { price: 39000 }, locale: "fr" })), /<del/);
});
