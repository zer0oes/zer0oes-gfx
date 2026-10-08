import { siteOrigin } from "./site-origin";

// Gmail fetches images remotely; localhost assets are unreachable even for local test mails.
const emailAssetOrigin = /^https:\/\//.test(siteOrigin) && !/^https:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/i.test(siteOrigin)
  ? siteOrigin : "https://www.zer0oes-gfx.com";

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

const escape = escapeEmailHtml;

function button(url: string, en: boolean) {
  const parsed = new URL(url);
  const label = parsed.pathname.includes("/devis/") ? (en ? "View my quote" : "Voir mon devis")
    : parsed.hostname.includes("stripe.com") || parsed.pathname.includes("/solde") ? (en ? "Make my payment" : "Régler mon paiement")
    : (en ? "View my order" : "Voir ma commande");
  return emailButton(url, label);
}

export function emailButton(url: string, label: string) {
  if (!/^https?:$/.test(new URL(url).protocol)) return "";
  label = escape(label);
  const safeUrl = escape(url);
  // VML gives desktop Outlook a clickable rounded button without relying on CSS.
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding:8px 0 16px;text-align:center;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="50%" stroke="f" fillcolor="#a78bfa"><w:anchorlock/><center style="color:#0b0a12;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${label}</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><a href="${safeUrl}" style="background-color:#a78bfa;border-radius:28px;color:#0b0a12;display:inline-block;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;line-height:48px;text-align:center;text-decoration:none;width:240px;-webkit-text-size-adjust:none;">${label} &rarr;</a><!--<![endif]-->
</td></tr></table>`;
}

/** Common client template. Text remains authoritative and is also sent as plain text. */
export function customerEmailHtml(subject: string, text: string, contactReceipt = false) {
  const en = /^Your\b/i.test(subject);
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const body: string[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    body.push(`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b0a12" style="background-color:#0b0a12;border:1px solid #2a2640;border-radius:12px;margin:8px 0 20px;"><tr><td style="padding:18px 20px;color:#ece9f5;"><p style="margin:0;color:#a39fb8;font-size:10px;line-height:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${en ? "DISCOVER IN YOUR ORDER SPACE" : "À DÉCOUVRIR DANS TON ESPACE COMMANDE"}</p><ul style="margin:12px 0 0;padding-left:18px;font-size:14px;line-height:24px;font-weight:normal;">${bullets.map((item) => `<li>${escape(item)}</li>`).join("")}</ul></td></tr></table>`);
    bullets = [];
  };
  for (const line of lines) {
    if (line.startsWith("• ")) { bullets.push(line.slice(2)); continue; }
    flush();
    if (!line.trim() || line === "Aurore — zer0oes gfx") continue;
    if (/^https?:\/\/\S+$/.test(line.trim())) {
      body.push(button(line.trim(), en));
    } else {
      body.push(`<p style="margin:0 0 16px;color:#ece9f5;font-size:15px;line-height:26px;overflow-wrap:anywhere;">${escape(line)}</p>`);
    }
  }
  flush();
  const footer = contactReceipt ? (en ? "Want to add something? Simply reply to this email." : "Une précision à ajouter ? Réponds simplement à ce mail.") : en ? "Keep your order link private: it gives access to your personal space.<br>Any questions? Simply reply to this email."
    : "Garde ton lien de commande pour toi : il donne accès à ton espace privé.<br>Une question ? Réponds simplement à ce mail.";
  return emailLayout(subject, body.join("\n"), { en, footer });
}

export function emailLayout(subject: string, body: string, { en = false, footer, admin = false }: { en?: boolean; footer: string; admin?: boolean }) {
  return `<!doctype html><html lang="${en ? "en" : "fr"}" xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escape(subject)}</title>
<!--[if !mso]><!--><style>
@font-face{font-family:Poppins;font-style:normal;font-weight:400;src:url('${escape(emailAssetOrigin)}/fonts/email/Poppins-Regular.ttf') format('truetype')}
@font-face{font-family:Poppins;font-style:normal;font-weight:700;src:url('${escape(emailAssetOrigin)}/fonts/email/Poppins-Bold.ttf') format('truetype')}
@font-face{font-family:Lexend;font-style:normal;font-weight:100 900;src:url('${escape(emailAssetOrigin)}/fonts/email/Lexend-Variable.ttf') format('truetype')}
</style><!--<![endif]-->
<!--[if mso]><style>table{border-collapse:collapse}td,p,a,h1{font-family:Arial,sans-serif!important}</style><![endif]--></head>
<body style="margin:0;padding:0;background-color:#39304f;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#39304f" style="background-color:#39304f;"><tr><td align="center" style="padding:32px 12px;">
<!--[if mso]><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#1d1a2b" style="width:100%;max-width:600px;background-color:#1d1a2b;border:1px solid #2a2640;border-radius:20px;border-collapse:separate;border-spacing:0;overflow:hidden;font-family:Poppins,Arial,Helvetica,sans-serif;color:#ece9f5;">
<tr><td align="center" bgcolor="#15131f" style="background-color:#15131f;background-image:linear-gradient(#15131f,#15131f);padding:30px 24px;border-bottom:1px solid #2a2640;border-radius:20px 20px 0 0;"><img src="${escape(emailAssetOrigin)}/logo-zeroes-gfx.png" width="220" alt="zer0oes gfx" border="0" style="display:block;width:220px;max-width:100%;height:auto;color:#ece9f5;font-size:20px;"></td></tr>
<tr><td style="padding:32px 24px;"><p style="margin:0 0 12px;color:#a78bfa;font-size:11px;line-height:18px;font-weight:bold;letter-spacing:2px;">${admin ? "NOTIFICATION ADMIN" : "ZER0OES GFX"}</p><h1 style="font-family:Lexend,Poppins,Arial,Helvetica,sans-serif;margin:0 0 24px;color:#ece9f5;font-size:26px;line-height:34px;font-weight:bold;">${escape(subject)}</h1>${body}${admin ? "" : '<p style="margin:24px 0 0;color:#ece9f5;font-size:15px;line-height:26px;"><strong>Aurore</strong> <span style="color:#a39fb8;">· zer0oes gfx</span></p>'}</td></tr>
<tr><td bgcolor="#15131f" style="background-color:#15131f;padding:20px 24px;border-top:1px solid #2a2640;text-align:center;border-radius:0 0 20px 20px;color:#a39fb8;font-size:12px;line-height:20px;">${footer}</td></tr></table>
<!--[if mso]></td></tr></table><![endif]-->
<p style="margin:20px 0 0;color:#a39fb8;font-family:Poppins,Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;">zer0oes gfx · ${en ? "Visual identities for streamers" : "Identités visuelles pour streameurs"}</p>
</td></tr></table></body></html>`;
}
