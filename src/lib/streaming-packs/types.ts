// Modèle commun aux packs d'alertes et widgets ; chaque plateforme conserve son
// propre payload et sa propre version. Les contrats HTTP restent à confirmer.
// Aucun jeton OAuth ni secret de compte ne doit être ajouté à ces types.
export const streamingPlatforms = ["streamelements", "streamlabs"] as const;
export type StreamingPlatform = (typeof streamingPlatforms)[number];

export function isStreamingPlatform(value: unknown): value is StreamingPlatform {
  return streamingPlatforms.some((platform) => platform === value);
}

export type AlertPackMedia = {
  key: string;
  label: string;
  kind: "image" | "video" | "audio";
  storagePath: string;
};

export type AlertPackVersion = {
  platform: StreamingPlatform;
  kind: "alertes" | "widget";
  id: string;
  orderId: string;
  deliverableId: string;
  version: number;
  label: string;
  status: "brouillon" | "pret";
  // Fichier privé contenant la configuration ; ne pas le transmettre au navigateur.
  configurationPath: string;
  media: AlertPackMedia[];
};

export type AlertPackInstallation = {
  platform: StreamingPlatform;
  id: string;
  packVersionId: string;
  // Identifiants propres au fournisseur, sans supposer le format StreamElements.
  accountId: string;
  status: "en_attente" | "en_cours" | "reussie" | "echouee";
  resourceId?: string;
  createdAt: string;
  updatedAt: string;
};
