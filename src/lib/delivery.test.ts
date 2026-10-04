import assert from "node:assert/strict";
import { test } from "node:test";
import { checkDeliveryLink, deliverablePath, deliveryEmail, formatBytes, isDeliveryToken, newDeliveryToken, safeFilename } from "./delivery";

test("jeton de livraison : 48 caractères hexadécimaux, non répétable", () => {
  const a = newDeliveryToken();
  const b = newDeliveryToken();
  assert.ok(isDeliveryToken(a) && isDeliveryToken(b));
  assert.notEqual(a, b);
  assert.equal(isDeliveryToken("../../etc"), false);
  assert.equal(isDeliveryToken("court"), false);
});

test("liens de livraison : https uniquement", () => {
  assert.equal(checkDeliveryLink(" https://streamelements.com/dashboard/overlays/share/abc "), "https://streamelements.com/dashboard/overlays/share/abc");
  assert.equal(checkDeliveryLink("http://exemple.fr"), null);
  assert.equal(checkDeliveryLink("javascript:alert(1)"), null);
  assert.equal(checkDeliveryLink("data:text/html,x"), null);
  assert.equal(checkDeliveryLink("pas une url"), null);
});

test("noms de fichiers sûrs pour le stockage", () => {
  assert.equal(safeFilename("Pack Streamlabs été 2026.ZIP"), "Pack-Streamlabs-ete-2026.zip");
  assert.equal(safeFilename("../../secret"), "secret");
  assert.equal(safeFilename(".env"), "env");
  assert.equal(deliverablePath("cmd-1", "Guide d'installation.pdf", "u1"), "cmd-1/u1-Guide-d-installation.pdf");
});

test("tailles lisibles et e-mail de livraison", () => {
  assert.equal(formatBytes(1536), "1,5 Ko");
  assert.equal(formatBytes(12.4 * 1024 * 1024), "12,4 Mo");
  const mail = deliveryEmail({ offerName: "Identité signature", url: "https://www.zer0oes-gfx.com/livraison/x", links: 1, files: 2 });
  assert.match(mail.subject, /Identité signature/);
  assert.match(mail.text, /1 lien d'import et 2 fichiers/);
  assert.match(mail.text, /https:\/\/www\.zer0oes-gfx\.com\/livraison\/x/);
});
