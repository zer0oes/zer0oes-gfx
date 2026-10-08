import test from "node:test";
import assert from "node:assert/strict";
import { customerEmailHtml } from "./customer-email";
import { sendToCustomer } from "./notify";

test("client template escapes content, groups deliverables and supports Outlook buttons", () => {
  const html = customerEmailHtml('Tes aperçus <test>', 'Bonjour,\n\n• Logo <script>\n• Overlay\n\nhttps://example.com/commande/token?a=1&b=2\n\nAurore — zer0oes gfx');
  assert.ok(html.includes('Logo &lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('<li>Logo &lt;script&gt;</li><li>Overlay</li>'));
  assert.ok(html.includes('v:roundrect'));
  assert.ok(html.includes('href="https://example.com/commande/token?a=1&amp;b=2"'));
  assert.ok(html.includes('width="220"'));
  assert.ok(html.includes('Voir ma commande'));
});

test("quote and payment buttons use the relevant labels and respect English", () => {
  assert.ok(customerEmailHtml('Your quote', 'https://example.com/devis/token').includes('View my quote'));
  assert.ok(customerEmailHtml('Solde', 'https://checkout.stripe.com/c/pay/test').includes('Régler mon paiement'));
  assert.ok(!customerEmailHtml('Facture', 'Facture en pièce jointe.').includes('v:roundrect'));
});

test("all customer sends retain text, attachments and idempotency alongside HTML", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  process.env.RESEND_API_KEY = 'test-placeholder';
  let request: RequestInit | undefined;
  globalThis.fetch = async (_url, init) => { request = init; return new Response('{}', { status: 200 }); };
  try {
    await sendToCustomer({ to: 'client@example.com', subject: 'Facture', text: 'Voici ta facture.', attachments: [{ filename: 'facture.pdf', content: new Uint8Array([1, 2]) }], idempotencyKey: 'invoice-test' });
    const payload = JSON.parse(String(request?.body));
    assert.equal(payload.text, 'Voici ta facture.');
    assert.ok(payload.html.includes('Voici ta facture.'));
    assert.deepEqual(payload.attachments, [{ filename: 'facture.pdf', content: 'AQI=' }]);
    assert.equal((request?.headers as Record<string, string>)['Idempotency-Key'], 'invoice-test');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
  }
});
