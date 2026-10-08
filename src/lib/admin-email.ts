import { emailButton, emailLayout, escapeEmailHtml as escape } from "./customer-email";

export function nonEmptyNotificationFields(fields: Record<string, string>) {
  return Object.fromEntries(Object.entries(fields).filter(([, value]) => value.trim() && value.trim() !== "—"));
}

/** Keep every field, grouping the client identity into a single row. */
export function adminEmailHtml(subject: string, fields: Record<string, string>, replyTo?: string) {
  fields = nonEmptyNotificationFields(fields);
  const entries = Object.entries(fields);
  const adminLinks = entries.filter(([, value]) => {
    try { const url = new URL(value.trim()); return /^https?:$/.test(url.protocol); }
    catch { return false; }
  });
  const normalize = (label: string) => label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/-/g, "");
  const groups = [
    ["client", "nom", "email", "chaine"],
    ["type de demande", "offre envisagee", "budget"],
  ].map((names) => names.flatMap((name) => entries.filter(([label]) => normalize(label) === name)));
  const content = (label: string, value: string) => {
    const safeValue = escape(value || "—").replace(/\r?\n/g, "<br>");
    return `<p style="margin:0 0 6px;color:#a39fb8;font-size:10px;line-height:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">${escape(label.toLocaleUpperCase("fr"))}</p><p style="margin:0;color:#ece9f5;font-size:15px;line-height:26px;overflow-wrap:anywhere;word-break:break-word;">${safeValue}</p>`;
  };
  const emitted = new Set<string>();
  const rowContents: string[] = [];
  for (const [label, value] of entries) {
    if (emitted.has(label) || adminLinks.some(([key]) => key === label)) continue;
    const group = groups.find((items) => items.some(([key]) => key === label));
    if (group && group.length > 1) {
      group.forEach(([key]) => emitted.add(key));
      rowContents.push(`<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;"><tr>${group.map(([key, fieldValue], index) => `<td width="${100 / group.length}%" valign="top" style="${index < group.length - 1 ? "padding-right:12px;" : ""}">${content(key, fieldValue)}</td>`).join("")}</tr></table>`);
    } else {
      emitted.add(label);
      rowContents.push(content(label, value));
    }
  }
  const rows = rowContents.map((inner, index) => {
    return `<tr><td style="padding:18px 20px;${index ? "border-top:1px solid #2a2640;" : ""}">${inner}</td></tr>`;
  }).join("");
  const buttons = adminLinks.map(([label, value]) => {
    const path = new URL(value.trim()).pathname;
    const buttonLabel = /^\/admin(?:\/|$)/.test(path) ? "Ouvrir dans l’admin"
      : /^\/commande(?:\/|$)/.test(path) ? "Voir l’espace client"
      : /^\/devis(?:\/|$)/.test(path) ? "Voir le devis" : label === "Lien" ? "Ouvrir le lien" : label;
    return emailButton(value.trim(), buttonLabel);
  }).join("");
  const body = `${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b0a12" style="background-color:#0b0a12;border:1px solid #2a2640;border-radius:12px;">${rows}</table>` : ""}${buttons ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center" style="padding-top:20px;text-align:center;">${buttons}</td></tr></table>` : ""}`;
  const footer = replyTo
    ? `Pour répondre au client, réponds directement à ce mail.<br>Adresse de réponse : ${escape(replyTo)}`
    : "Notification automatique de ton espace d’administration zer0oes gfx.";
  return emailLayout(subject, body, { admin: true, footer });
}
