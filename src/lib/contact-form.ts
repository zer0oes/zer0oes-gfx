// Formulaire de contact : choix proposés (partagés entre le formulaire et le serveur,
// qui ne retient que les valeurs de ces listes) et mise en forme de la demande.

// Onglet « Projet sur-mesure »
export const requestTypes = ["Projet sur mesure", "Devis Univers complet"];
// Onglet « Message simple »
export const messageSubjects = ["Question sur une offre", "Collaboration / partenariat", "Autre"];
export const budgets = ["Moins de 500 €", "500 à 1 000 €", "1 000 à 2 000 €", "Plus de 2 000 €"];
export const platforms = ["Twitch", "YouTube", "TikTok", "Instagram", "Autre"];
export const identityLevels = ["Oui", "Partiellement", "Non"];
export const styles = ["Sombre", "Néon", "Minimaliste", "Rétro", "Gaming", "Coloré", "Autre"];
export const providedAssets = ["Logo", "Charte graphique", "Police(s)", "Mascotte / personnage", "Images / illustrations", "Aucun élément pour l'instant"];
export const referralSources = ["Twitch", "Instagram", "TikTok", "Google", "Recommandation", "Autre"];
export const MAX_REFERENCES = 5;

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
