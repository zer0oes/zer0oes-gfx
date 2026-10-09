// Questions techniques du brief selon le contenu de la commande : plateforme des widgets et alertes
// (StreamElements, Streamlabs ou les deux) et mode de livraison des overlays.

export const BRIEF_PLATFORM_KEY = "Plateforme des widgets et alertes";
export const BRIEF_OVERLAY_DELIVERY_KEY = "Livraison des overlays";

// Valeurs enregistrées dans le brief (en français, comme les autres réponses)
export const streamToolChoices = ["StreamElements", "Streamlabs", "Les deux"] as const;
export const overlayDeliveryChoices = ["Widget StreamElements prêt à intégrer", "Fichiers à configurer soi-même"] as const;

// Lignes de la commande (livrables du pack, options, produits du devis) contenant un widget ou des alertes, ou des overlays
export function briefDeliveryNeeds(lines: readonly string[] = [], overlayCount: number | null = null) {
  return {
    platform: lines.some((line) => /widget|alerte|alert/i.test(line)),
    overlays: (overlayCount ?? 0) > 0 || lines.some((line) => /overlay|sc[eè]ne/i.test(line)),
  };
}

// Réponse reçue d'un formulaire : seule une valeur proposée est conservée
export function pickChoice<T extends string>(raw: string | undefined, choices: readonly T[]): T | "" {
  return choices.find((choice) => choice === raw) ?? "";
}

// Réponses du brief à enregistrer ; null si une question affichée est restée sans réponse
export function briefDeliveryAnswers(get: (name: string) => string | undefined, needs: { platform: boolean; overlays: boolean }): Record<string, string> | null {
  const platform = pickChoice(get("streamTool"), streamToolChoices);
  const overlays = pickChoice(get("overlayDelivery"), overlayDeliveryChoices);
  if ((needs.platform && !platform) || (needs.overlays && !overlays)) return null;
  return { ...(platform ? { [BRIEF_PLATFORM_KEY]: platform } : {}), ...(overlays ? { [BRIEF_OVERLAY_DELIVERY_KEY]: overlays } : {}) };
}
