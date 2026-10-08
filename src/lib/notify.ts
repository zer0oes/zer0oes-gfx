// Envoi des formulaires (contact, brief) à Aurore.
// Si RESEND_API_KEY et NOTIFY_EMAIL sont définies, un e-mail est envoyé via
// l'API Resend. Sinon le message est seulement affiché dans les logs serveur.

import { customerEmailHtml } from "./customer-email";
import { adminEmailHtml, nonEmptyNotificationFields } from "./admin-email";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function inlineLogo(html: string) {
  const content = await readFile(path.join(process.cwd(), "public", "logo-zeroes-gfx.png"));
  return {
    html: html.replace(/src="https?:\/\/[^"\s]+\/logo-zeroes-gfx\.png"/, 'src="cid:zer0oes-logo"'),
    attachment: { filename: "zer0oes-logo.png", content: content.toString("base64"), content_type: "image/png", content_id: "zer0oes-logo" },
  };
}

type Message = {
  subject: string;
  replyTo?: string;
  fields: Record<string, string>;
};

export async function notify({ subject, replyTo, fields }: Message) {
  fields = nonEmptyNotificationFields(fields);
  const text = Object.entries(fields)
    .map(([k, v]) => `${k} :\n${v || "—"}`)
    .join("\n\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.info(`[notify] ${subject}\n${text}`);
    return;
  }

  const logo = await inlineLogo(adminEmailHtml(subject, fields, replyTo));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "zer0oes gfx <onboarding@resend.dev>",
      to: [to],
      reply_to: replyTo,
      subject,
      text,
      html: logo.html,
      attachments: [logo.attachment],
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

// E-mail envoyé à un client (ex. lien de paiement du solde). Même fonctionnement :
// Resend si configuré, sinon affichage dans les logs serveur.
export async function sendToCustomer({
  to,
  subject,
  text,
  attachments,
  idempotencyKey,
  contactReceipt = false,
}: {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Uint8Array }[];
  idempotencyKey?: string;
  contactReceipt?: boolean;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const files = attachments?.length ? `\n(pièces jointes : ${attachments.map((a) => a.filename).join(", ")})` : "";
    console.info(`[e-mail client → ${to}] ${subject}\n${text}${files}`);
    return { sent: false };
  }
  const logo = await inlineLogo(customerEmailHtml(subject, text, contactReceipt));
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "zer0oes gfx <onboarding@resend.dev>",
      to: [to],
      reply_to: process.env.NOTIFY_EMAIL,
      subject,
      text,
      attachments: [...(attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })) ?? []), logo.attachment],
      html: logo.html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { sent: true };
}
