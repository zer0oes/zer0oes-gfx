import { briefDeliveryNeeds, briefPlatformAnswer, streamToolChoices } from "./brief-delivery";

export const quoteBriefFields = [
  { id: "email", label: "E-mail", key: "E-mail" }, { id: "pseudo", label: "Pseudo", key: "Pseudo" },
  { id: "channel", label: "Lien de la chaîne", key: "Chaîne" }, { id: "platform", label: "Plateforme", key: "Plateforme" },
  { id: "universe", label: "Univers et ambiance", key: "Univers / ambiance" }, { id: "colors", label: "Couleurs", key: "Couleurs" },
  { id: "references", label: "Références", key: "Références" }, { id: "elements", label: "Éléments à inclure", key: "Éléments à inclure" },
  { id: "logoLink", label: "Logo existant", key: "Logo existant" }, { id: "deadline", label: "Date souhaitée", key: "Date souhaitée" },
  { id: "notes", label: "Remarques", key: "Remarques" },
] as const;
export const defaultQuoteRequiredFields = ["email", "channel", "universe"];

export function parseQuoteBrief(data: FormData, deliverables: string[], optional: string[] = [], required: string[] = ["universe"]) {
  const field = (name: string, max = 5000) => String(data.get(name) ?? "").trim().slice(0, max);
  if (required.some((name) => !field(name))) return null;
  if (field("email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field("email"))) return null;
  const brief: Record<string, string> = { Pseudo: field("pseudo", 200), Chaîne: field("channel", 500),
    "Univers / ambiance": field("universe"), Couleurs: field("colors", 500),
    Références: field("references"), "Logo existant": field("logoLink", 1000),
    "Date souhaitée": field("deadline", 100), Remarques: field("notes") };
  for (const [i, label] of deliverables.entries()) {
    const description = field(`creation_${i}`);
    if (!description && !optional.includes(label)) return null;
    brief[`Création ${i + 1} — ${label}`] = description;
  }
  // Plateforme d'installation des widgets, alertes et overlays, selon les produits du devis
  const answers = briefPlatformAnswer(field("streamTool", 100) || undefined, briefDeliveryNeeds(deliverables).platform, streamToolChoices);
  if (!answers) return null;
  return { ...brief, ...answers };
}
