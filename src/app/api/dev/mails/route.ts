import { adminEmailHtml } from "@/lib/admin-email";
import { cancellationEmail } from "@/lib/cancellation-email";
import { contactReceiptMessage } from "@/lib/contact-receipt";
import { customerEmailHtml, escapeEmailHtml } from "@/lib/customer-email";
import { deliveryEmail, portalEmail } from "@/lib/delivery";
import { isProductionLike } from "@/lib/env";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development" || isProductionLike()) {
    return new Response("Not found", { status: 404 });
  }

  const base = new URL(request.url).origin;
  const order = { id: "commande-exemple", offerName: "Premier look", customerName: "Camille" };
  const url = `${base}/commande/exemple`;
  const client = (mail: { subject: string; text: string; footer?: string; eyebrow?: string; heading?: string; highlights?: string[] }, contact = false) =>
    customerEmailHtml(mail.subject, mail.text, contact, mail.footer, mail);
  const previews = [
    { id: "confirmation", label: "Confirmation de commande", html: client(portalEmail({ offerName: order.offerName, url })) },
    { id: "brief", label: "Brief reçu · admin", html: adminEmailHtml("[Brief] Camille", {
      Commande: order.offerName, "E-mail": "camille@example.com", Pseudo: "Camille",
      Chaîne: "https://www.twitch.tv/exemple", "Univers / ambiance": "Néon rétro synthwave",
      Couleurs: "Bleu, violet et rose", "Overlays choisis": "Démarrage, Gameplay",
      Administration: `${base}/admin/commandes/${order.id}`,
    }, "camille@example.com") },
    { id: "annulation", label: "Annulation · remboursement confirmé", html: client(cancellationEmail(order, 39000, false)) },
    { id: "annulation-attente", label: "Annulation · remboursement en cours", html: client(cancellationEmail(order, 39000, true)) },
    { id: "livraison", label: "Livraison", html: client(deliveryEmail({ offerName: order.offerName, url, links: 2, files: 3 })) },
    { id: "contact", label: "Accusé de réception · contact", html: client(contactReceiptMessage("Camille", { Projet: "Un overlay pour mes lives" }, "fr"), true) },
  ];
  const selected = previews.find((preview) => preview.id === new URL(request.url).searchParams.get("mail")) ?? previews[0];
  const escape = escapeEmailHtml;
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aperçu des mails</title>
<style>body{margin:0;background:#0b0a12;color:#ece9f5;font:15px Arial,sans-serif}header{padding:20px;max-width:1000px;margin:auto}h1{font-size:22px}p{color:#a39fb8}nav{display:flex;gap:8px;flex-wrap:wrap}a{padding:10px 14px;border:1px solid #39304f;border-radius:20px;color:#ece9f5;text-decoration:none}a[aria-current]{background:#a78bfa;color:#0b0a12}iframe{display:block;width:100%;height:1100px;border:0;background:#39304f}</style></head>
<body><header><h1>Aperçu des mails</h1><p>Données fictives · aucun mail envoyé. Le rendu exact peut varier selon la messagerie.</p><nav aria-label="Choisir un mail">${previews.map((preview) => `<a href="?mail=${preview.id}"${preview.id === selected.id ? ' aria-current="page"' : ""}>${escape(preview.label)}</a>`).join("")}</nav></header>
<iframe title="${escape(selected.label)}" sandbox srcdoc="${escape(selected.html)}"></iframe></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
