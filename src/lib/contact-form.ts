// Formulaire de contact : choix proposés (partagés entre le formulaire et le serveur,
// qui ne retient que les valeurs de ces listes) et mise en forme de la demande.

export const requestTypes = ["Projet sur mesure", "Devis Univers complet", "Question sur une offre", "Collaboration / partenariat", "Autre"];
export const budgets = ["Moins de 500 €", "500 à 1 000 €", "1 000 à 2 000 €", "Plus de 2 000 €"];
export const platforms = ["Twitch", "YouTube", "TikTok", "Instagram", "Autre"];
export const identityLevels = ["Oui", "Non", "Partiellement"];
export const providedAssets = ["Logo", "Couleurs", "Police", "Mascotte", "Assets", "Rien pour l'instant"];
export const styles = ["Sombre", "Néon", "Minimal", "Gaming", "Rétro", "Kawaii", "Autre"];
export const MAX_REFERENCES = 3;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Get = (name: string) => string;
type GetAll = (name: string) => string[];

// Seules les valeurs prévues sont gardées (une case cochée ne peut pas injecter de texte libre)
const pick = (values: string[], allowed: string[]) => [...new Set(values.filter((v) => allowed.includes(v)))];

function httpsLink(raw: string) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 500) : null;
  } catch {
    return null;
  }
}

export type ContactRequest = { name: string; email: string; message: string; type: string; fields: Record<string, string> };

export function parseContact(get: Get, getAll: GetAll): { ok: true; request: ContactRequest } | { ok: false; message: string } {
  const text = (k: string, max: number) => get(k).trim().slice(0, max);
  const name = text("name", 200);
  const email = text("email", 200);
  const message = text("message", 5000);
  if (!name || !EMAIL_RE.test(email) || message.length < 10) {
    return { ok: false, message: "Merci d'indiquer ton nom, un e-mail valide et quelques mots sur ton projet (10 caractères minimum)." };
  }
  const rawRefs = getAll("references").map((r) => r.trim()).filter(Boolean).slice(0, MAX_REFERENCES);
  const refs = rawRefs.map(httpsLink);
  if (refs.some((r) => !r)) return { ok: false, message: "Les références doivent être des liens (https://…)." };

  const type = requestTypes.includes(get("type")) ? get("type") : "Projet sur mesure";
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
        Plateformes: join(pick(getAll("platforms"), platforms)),
        Budget: budgets.includes(get("budget")) ? get("budget") : "Je ne sais pas encore",
        "Date souhaitée": text("deadline", 100),
        "Identité visuelle existante": identityLevels.includes(get("identity")) ? get("identity") : "",
        "Éléments à fournir": join(pick(getAll("assets"), providedAssets)),
        "Style recherché": join([...style.filter((s) => s !== "Autre"), ...(style.includes("Autre") || styleOther ? [styleOther || "Autre"] : [])]),
        Références: (refs as string[]).join("\n"),
        Options: getAll("options").map((o) => o.slice(0, 200)).slice(0, 20).join(", "),
        Projet: message,
      },
    },
  };
}
