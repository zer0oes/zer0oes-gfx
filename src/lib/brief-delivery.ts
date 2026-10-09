// Installation des widgets, alertes et overlays : plateforme (StreamElements ou Streamlabs) demandée dans le brief,
// et pour l'à la carte, mode d'installation choisi au panier (code ajouté par le client, ou installation par
// zer0oes_GFX invité comme éditeur : supplément porté par une option à la carte masquée du catalogue).
// En attendant la connexion OAuth avec les deux plateformes (lien d'installation automatique).

export const BRIEF_PLATFORM_KEY = "Plateforme des widgets et alertes";
export const BRIEF_INSTALL_KEY = "Installation";

// Option à la carte du supplément d'installation (prix et description modifiables dans l'admin)
export const INSTALL_OPTION_ID = "installation-plateforme";
// Ligne de commande correspondante (livraison, brief) : fixe, quel que soit le nom de l'option
export const INSTALL_LINE = "Installation par zer0oes_GFX (invitation comme éditeur)";

// Valeurs enregistrées (en français, comme les autres réponses). « Les deux » : demande de devis uniquement.
export const streamToolChoices = ["StreamElements", "Streamlabs", "Les deux"] as const;
export const orderStreamToolChoices = ["StreamElements", "Streamlabs"] as const;
export const installChoices = ["Code ajouté par le client", "Installation par zer0oes_GFX"] as const;

const installable = (line: string) => line !== INSTALL_LINE && /widget|alerte|alert|overlay|sc[eè]ne/i.test(line);

// Lignes de la commande (livrables du pack, options, produits du devis) à installer sur une plateforme
export function briefDeliveryNeeds(lines: readonly string[] = [], overlayCount: number | null = null) {
  const platform = (overlayCount ?? 0) > 0 || lines.some(installable);
  return { platform, install: platform };
}

// Commande à la carte : installation par zer0oes_GFX achetée
export const hasInstallLine = (lines: readonly string[] = []) => lines.includes(INSTALL_LINE);
export const withoutInstallLine = (lines: readonly string[] = []) => lines.filter((line) => line !== INSTALL_LINE);

// Réponse reçue d'un formulaire : seule une valeur proposée est conservée
export function pickChoice<T extends string>(raw: string | undefined, choices: readonly T[]): T | "" {
  return choices.find((choice) => choice === raw) ?? "";
}

// Réponse du brief à enregistrer ; null si la plateforme est demandée mais restée sans réponse
export function briefPlatformAnswer(raw: string | undefined, needed: boolean, choices: readonly string[] = orderStreamToolChoices): Record<string, string> | null {
  const platform = pickChoice(raw, choices);
  if (needed && !platform) return null;
  return platform ? { [BRIEF_PLATFORM_KEY]: platform } : {};
}
