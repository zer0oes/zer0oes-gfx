// Envoi des formulaires (contact, brief) à Aurore.
// Si RESEND_API_KEY et NOTIFY_EMAIL sont définies, un e-mail est envoyé via
// l'API Resend. Sinon le message est seulement affiché dans les logs serveur.

type Message = {
  subject: string;
  replyTo?: string;
  fields: Record<string, string>;
};

export async function notify({ subject, replyTo, fields }: Message) {
  const text = Object.entries(fields)
    .map(([k, v]) => `${k} :\n${v || "—"}`)
    .join("\n\n");

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) {
    console.info(`[notify] ${subject}\n${text}`);
    return;
  }

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
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

// E-mail envoyé à un client (ex. lien de paiement du solde). Même fonctionnement :
// Resend si configuré, sinon affichage dans les logs serveur.
export async function sendToCustomer({ to, subject, text }: { to: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[e-mail client → ${to}] ${subject}\n${text}`);
    return { sent: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "zer0oes gfx <onboarding@resend.dev>",
      to: [to],
      reply_to: process.env.NOTIFY_EMAIL,
      subject,
      text,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return { sent: true };
}
