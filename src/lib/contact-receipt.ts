export function contactReceiptMessage(name: string, fields: Record<string, string>, locale: "fr" | "en") {
  const en = locale === "en";
  const recap = Object.entries(fields).filter(([, value]) => value.trim() && value.trim() !== "—")
    .map(([label, value]) => `${label} :\n${value}`).join("\n\n");
  return {
    subject: en ? "Your message has been received" : "Ta demande a bien été reçue",
    eyebrow: en ? "Acknowledgement of receipt" : "Accusé de réception",
    text: [en ? `Hello ${name},` : `Bonjour ${name},`,
      en ? "Thank you for your message! Your request has been received. I will reply within 48 business hours."
        : "Merci pour ton message ! Ta demande a bien été reçue. Je te réponds sous 48 h ouvrées.",
      en ? "Summary" : "Récapitulatif", recap,
      en ? "To add any details, simply reply to this email." : "Pour ajouter une précision, réponds simplement à ce mail.",
      "Aurore — zer0oes gfx"].join("\n\n"),
  };
}
