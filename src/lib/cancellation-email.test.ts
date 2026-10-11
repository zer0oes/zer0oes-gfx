import assert from "node:assert/strict";
import test from "node:test";
import { cancellationEmail } from "./cancellation-email";
import { customerEmailHtml } from "./customer-email";

test("confirmation d’annulation : montant, commande et remboursement en attente", () => {
  const mail = cancellationEmail({ id: "order-123", offerName: "Pack créateur", customerName: "Camille" }, 27000, true);
  assert.match(mail.text, /Bonjour Camille/);
  assert.match(mail.text, /Pack créateur/);
  assert.match(mail.text, /270/);
  assert.match(mail.text, /order-123/);
  assert.match(mail.text, /en cours de traitement/);
  assert.doesNotMatch(mail.text, /Stripe a confirmé/);
});

test("confirmation d’annulation : remboursement confirmé sans promettre un crédit immédiat", () => {
  const mail = cancellationEmail({ id: "order-456", offerName: "Emote", customerName: "" }, 1500, false);
  assert.match(mail.text, /Stripe a confirmé/);
  assert.match(mail.text, /délai de réception dépend de ta banque/);
  assert.doesNotMatch(mail.text, /en cours de traitement/);
  const html = customerEmailHtml(mail.subject, mail.text, false, mail.footer);
  assert.ok(html.includes('Une question sur ton annulation ou ton remboursement'));
  assert.ok(!html.includes('Garde ton lien de commande'));
});
