import { BRIEF_OVERLAY_DELIVERY_KEY, BRIEF_PLATFORM_KEY, overlayDeliveryChoices, pickChoice, streamToolChoices } from "./brief-delivery";

// Formulaire de contact : choix proposés (partagés entre le formulaire et le serveur,
// qui ne retient que les valeurs de ces listes) et mise en forme de la demande.

// Onglet « Projet sur-mesure »
export const requestTypes = ["Projet sur mesure", "Demande de devis", "Question sur une offre", "Suivi d'une commande", "Collaboration / partenariat", "Autre demande", "Devis Univers complet"];
// Onglet « Message simple »
export const messageSubjects = ["Question sur une offre", "Collaboration / partenariat", "Autre"];
export const budgets = ["Moins de 500 €", "500 à 1 000 €", "1 000 à 2 000 €", "Plus de 2 000 €"];
export const platforms = ["Twitch", "YouTube", "TikTok", "Instagram", "Autre"];
export const identityLevels = ["Oui", "Partiellement", "Non"];
export const styles = ["Sombre", "Néon", "Minimaliste", "Rétro", "Gaming", "Coloré", "Autre"];
export const providedAssets = ["Logo", "Charte graphique", "Police(s)", "Mascotte / personnage", "Images / illustrations", "Aucun élément pour l'instant"];
export const referralSources = ["Twitch", "Instagram", "TikTok", "Google", "Recommandation", "Autre"];
export const MAX_REFERENCES = 5;

// Affichage en anglais des choix (la valeur envoyée reste la valeur française ci-dessus)
const choicesEn: Record<string, string> = {
  "Projet sur mesure": "Custom project",
  "Demande de devis": "Quote request",
  "Suivi d'une commande": "Order follow-up",
  "Autre demande": "Other enquiry",
  "Devis Univers complet": "Full Universe quote",
  "Question sur une offre": "Question about a package",
  "Collaboration / partenariat": "Collaboration / partnership",
  Autre: "Other",
  "Moins de 500 €": "Under €500",
  "500 à 1 000 €": "€500 to €1,000",
  "1 000 à 2 000 €": "€1,000 to €2,000",
  "Plus de 2 000 €": "Over €2,000",
  Oui: "Yes",
  Partiellement: "Partly",
  Non: "No",
  Sombre: "Dark",
  Néon: "Neon",
  Minimaliste: "Minimalist",
  Rétro: "Retro",
  Coloré: "Colourful",
  "Charte graphique": "Brand guidelines",
  "Police(s)": "Font(s)",
  "Mascotte / personnage": "Mascot / character",
  "Images / illustrations": "Images / illustrations",
  "Aucun élément pour l'instant": "Nothing yet",
  Recommandation: "Recommendation",
};

export function choiceLabel(locale: "fr" | "en", value: string) {
  return locale === "en" ? (choicesEn[value] ?? value) : value;
}

// Messages renvoyés au visiteur par les formulaires (contact, message, brief), en anglais sur /en
const messagesEn: Record<string, string> = {
  "Merci d'indiquer ton nom, un e-mail valide et quelques mots sur ce que tu as en tête (10 caractères minimum).":
    "Please give your name, a valid email and a few words about what you have in mind (10 characters minimum).",
  "Merci d'indiquer ton nom, un e-mail valide et ton message (10 caractères minimum).":
    "Please give your name, a valid email and your message (10 characters minimum).",
  "Coche la case d'accord pour que je puisse utiliser tes informations et te répondre.":
    "Please tick the consent box so I can use your information and reply to you.",
  [`${MAX_REFERENCES} liens d'inspiration maximum.`]: `${MAX_REFERENCES} inspiration links maximum.`,
  "Les inspirations doivent être des liens (https://…), un par ligne.": "Inspirations must be links (https://…), one per line.",
  "Merci !": "Thank you!",
  "L'envoi a échoué, réessaie ou écris-moi directement par e-mail.": "Sending failed, please try again or email me directly.",
  "Message envoyé ! Je te réponds sous 48 h ouvrées.": "Message sent! I'll reply within 2 business days.",
  "Merci d'indiquer au minimum ton e-mail, ta chaîne et ton univers.": "Please give at least your email, your channel and your universe.",
  "Merci d'indiquer le lien vers ton logo existant.": "Please give the link to your existing logo.",
  "L'envoi a échoué, réessaie ou envoie ton brief par e-mail.": "Sending failed, please try again or send your brief by email.",
  "Brief bien reçu ! Je reviens vers toi sous 2 jours ouvrés pour démarrer.": "Brief received! I'll get back to you within 2 business days to get started.",
};

export function formMessage(locale: "fr" | "en", message: string) {
  return locale === "en" ? (messagesEn[message] ?? message) : message;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Get = (name: string) => string;
type GetAll = (name: string) => string[];

// Seules les valeurs prévues sont gardées (une case cochée ne peut pas injecter de texte libre)
const pick = (values: string[], allowed: string[]) => [...new Set(values.filter((v) => allowed.includes(v)))];
const one = (value: string, allowed: string[]) => (allowed.includes(value) ? value : "");

function webLink(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

// Champs communs aux deux formulaires : nom, e-mail valide, message, consentement
function identity(get: Get, emptyMessage: string) {
  const text = (k: string, max: number) => get(k).trim().slice(0, max);
  const name = text("name", 200);
  const email = text("email", 200);
  const message = text("message", 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 10) return { ok: false as const, message: emptyMessage };
  // Consentement explicite (RGPD) : vérifié ici, pas seulement par le navigateur
  if (get("consent") !== "1") {
    return { ok: false as const, message: "Coche la case d'accord pour que je puisse utiliser tes informations et te répondre." };
  }
  return { ok: true as const, name, email, message, text };
}

export type ContactRequest = { name: string; email: string; message: string; type: string; fields: Record<string, string> };

export function parseContact(get: Get, getAll: GetAll): { ok: true; request: ContactRequest } | { ok: false; message: string } {
  const id = identity(get, "Merci d'indiquer ton nom, un e-mail valide et quelques mots sur ce que tu as en tête (10 caractères minimum).");
  if (!id.ok) return id;
  const { name, email, message, text } = id;
  // Liens d'inspiration : un par ligne (ou séparés par des espaces)
  const rawRefs = get("references").split(/\s+/).filter(Boolean);
  if (rawRefs.length > MAX_REFERENCES) return { ok: false, message: `${MAX_REFERENCES} liens d'inspiration maximum.` };
  const refs = rawRefs.map(webLink);
  if (refs.some((r) => !r)) return { ok: false, message: "Les inspirations doivent être des liens (https://…), un par ligne." };

  const type = one(get("type"), requestTypes) || "Projet sur mesure";
  const style = pick(getAll("style"), styles);
  const styleOther = text("styleOther", 200);
  const join = (a: string[]) => a.join(", ");
  return {
    ok: true,
    request: {
      name,
      email,
      message,
      type,
      fields: {
        Nom: name,
        "E-mail": email,
        Chaîne: text("channel", 300),
        "Type de demande": type,
        ...(type === "Suivi d'une commande" ? { "Numéro de commande": text("orderNumber", 100) } : {}),
        "Offre envisagée": text("offer", 200),
        Budget: one(get("budget"), budgets) || "Je ne sais pas encore",
        Plateformes: join(pick(getAll("platforms"), platforms)),
        "Date souhaitée": text("deadline", 100),
        "Identité visuelle existante": one(get("identity"), identityLevels),
        "Style recherché": join([...style.filter((s) => s !== "Autre"), ...(style.includes("Autre") || styleOther ? [styleOther || "Autre"] : [])]),
        Couleurs: text("colors", 300),
        Inspirations: (refs as string[]).join("\n"),
        "Éléments disponibles": join(pick(getAll("assets"), providedAssets)),
        "Fichiers envoyés après la prise de contact": get("filesLater") === "1" ? "Oui" : "",
        Options: getAll("options").map((o) => o.slice(0, 200)).slice(0, 20).join(", "),
        [BRIEF_PLATFORM_KEY]: pickChoice(get("streamTool"), streamToolChoices),
        [BRIEF_OVERLAY_DELIVERY_KEY]: pickChoice(get("overlayDelivery"), overlayDeliveryChoices),
        Projet: message,
        "M'a trouvée via": one(get("referral"), referralSources),
      },
    },
  };
}

export type SimpleMessage = { name: string; email: string; subject: string; fields: Record<string, string> };

export function parseMessage(get: Get): { ok: true; request: SimpleMessage } | { ok: false; message: string } {
  const id = identity(get, "Merci d'indiquer ton nom, un e-mail valide et ton message (10 caractères minimum).");
  if (!id.ok) return id;
  const subject = one(get("subject"), messageSubjects) || "Autre";
  return {
    ok: true,
    request: { name: id.name, email: id.email, subject, fields: { Nom: id.name, "E-mail": id.email, Sujet: subject, Message: id.message } },
  };
}
