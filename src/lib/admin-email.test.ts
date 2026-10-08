import test from "node:test";
import assert from "node:assert/strict";
import { adminEmailHtml } from "./admin-email";
import { notify } from "./notify";

test("admin email keeps fields, line breaks and safely escapes user content", () => {
  const html = adminEmailHtml('Brief <test>', { Client: '<script>alert(1)</script>', Projet: 'Ligne 1\nLigne 2', Vide: '' }, 'client@example.com');
  assert.ok(html.includes('NOTIFICATION ADMIN'));
  assert.ok(html.includes('width="220"'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('Ligne 1<br>Ligne 2'));
  assert.ok(html.includes('Adresse de réponse : client@example.com'));
  assert.ok(!html.includes('>VIDE</p>'));
  assert.ok(!html.includes('Garde ton lien de commande'));
});

test("admin notifications retain recipient, reply address and plain text", async () => {
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.RESEND_API_KEY;
  const oldTo = process.env.NOTIFY_EMAIL;
  process.env.RESEND_API_KEY = 'test-placeholder';
  process.env.NOTIFY_EMAIL = 'admin@example.com';
  let payload: Record<string, unknown> = {};
  globalThis.fetch = async (_url, init) => { payload = JSON.parse(String(init?.body)); return new Response('{}'); };
  try {
    await notify({ subject: 'Nouveau brief', replyTo: 'client@example.com', fields: { Projet: 'Logo', Vide: '', Espaces: '  ', Absent: '—' } });
    assert.deepEqual(payload.to, ['admin@example.com']);
    assert.equal(payload.reply_to, 'client@example.com');
    assert.equal(payload.text, 'Projet :\nLogo');
    assert.ok(String(payload.html).includes('Logo'));
    assert.ok(String(payload.html).includes('src="cid:zer0oes-logo"'));
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldTo === undefined) delete process.env.NOTIFY_EMAIL; else process.env.NOTIFY_EMAIL = oldTo;
  }
});

test("admin URL becomes an Outlook-compatible button while other links remain content", () => {
  const html = adminEmailHtml('Devis', { Projet: 'Widget', Administration: 'https://example.com/admin/devis/123', Chaîne: '—', Inspiration: 'https://example.com/portfolio' });
  assert.ok(html.includes('Ouvrir dans l’admin'));
  assert.ok(html.includes('v:roundrect'));
  assert.ok(html.includes('href="https://example.com/admin/devis/123"'));
  assert.ok(!html.includes('>ADMINISTRATION</p>'));
  assert.ok(!html.includes('>CHAÎNE</p>'));
  assert.ok(html.includes('href="https://example.com/portfolio"'));
});
