import assert from "node:assert/strict";
import { test } from "node:test";
import { portalEmail } from "./delivery";

test("la confirmation donne accès au brief et à l’espace commande", () => {
  const briefUrl = "https://example.com/merci?session_id=cs_test_order";
  const url = "https://example.com/commande/private-token";
  const mail = portalEmail({ offerName: "Premier look — Pack avec emotes", url, briefUrl });
  assert.match(mail.subject, /confirmée/);
  assert.ok(mail.text.includes(briefUrl));
  assert.ok(mail.text.includes(url));
  assert.ok(mail.text.indexOf(briefUrl) < mail.text.indexOf(url));
  assert.match(mail.text, /options sélectionnées/);
});
import { canCancelApproval, checkDeliveryLink, cleanNote, deliveryProgress, itemType, unlockState, NOTE_MAX_CHARS, deliverablePath, deliveryEmail, formatBytes, isDeliveryToken, newDeliveryToken, safeFilename } from "./delivery";

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

test("remarque du client : nettoyée, vide refusée, longueur limitée", () => {
  assert.equal(cleanNote("  Plus grand \r\nstp  "), "Plus grand \nstp");
  assert.equal(cleanNote("   "), null);
  assert.equal(cleanNote(undefined), null);
  assert.equal(cleanNote("x".repeat(5000))?.length, NOTE_MAX_CHARS);
});

test("déblocage : validé + solde réglé, sinon aperçu seulement", () => {
  const paid = { totalPrice: 49000, amountPaid: 49000 };
  const deposit = { totalPrice: 49000, amountPaid: 14700 };
  assert.equal(unlockState(paid, {}), "a_valider");
  assert.equal(unlockState(deposit, { approvedAt: "2026-10-04" }), "solde_a_regler");
  assert.equal(unlockState(paid, { approvedAt: "2026-10-04" }), "debloque");
  assert.equal(canCancelApproval({ status: "livree" }), true);
  assert.equal(canCancelApproval({ status: "terminee" }), false);
});

test("type d'élément et progression", () => {
  assert.equal(itemType({ kind: "lien" }), "overlay");
  assert.equal(itemType({ kind: "fichier", storagePath: "o/x-ecran.MP4" }), "video");
  assert.equal(itemType({ kind: "fichier", storagePath: "o/x-pack.zip" }), "fichier");
  assert.equal(itemType({ kind: "fichier", itemType: "guide", storagePath: "o/x.png" }), "guide");
  assert.deepEqual(deliveryProgress([{ approvedAt: "x" }, {}, {}]), { done: 1, total: 3, percent: 33, complete: false });
  assert.equal(deliveryProgress([]).complete, false);
});
