"use client";

// Fichiers choisis dans un panneau (aperçu, fichier HD…) en attente d'envoi : ils partent tous
// au clic sur « Enregistrer » du panneau (scope = identifiant du panneau).
type Uploader = () => Promise<boolean>;
const scopes = new Map<string, Map<string, Uploader>>();

export function registerUpload(scope: string, key: string, upload: Uploader | null) {
  const list = scopes.get(scope) ?? new Map<string, Uploader>();
  if (upload) list.set(key, upload);
  else list.delete(key);
  scopes.set(scope, list);
}

// Envoie les fichiers en attente du panneau ; false si l'un d'eux a échoué (le message s'affiche dans sa zone)
export async function flushUploads(scope: string): Promise<boolean> {
  const list = [...(scopes.get(scope)?.values() ?? [])];
  const results = await Promise.all(list.map((upload) => upload()));
  return results.every(Boolean);
}
