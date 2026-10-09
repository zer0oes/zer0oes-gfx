"use client";

// Fichiers choisis dans un panneau (aperçu, fichier HD…) en attente d'envoi : ils partent tous
// au clic sur « Enregistrer » du panneau (scope = identifiant du panneau).
type Uploader = { upload: () => Promise<boolean>; label: string };
const scopes = new Map<string, Map<string, Uploader>>();

// label : nom de la section du panneau, cité si l'envoi échoue
export function registerUpload(scope: string, key: string, upload: (() => Promise<boolean>) | null, label = "") {
  const list = scopes.get(scope) ?? new Map<string, Uploader>();
  if (upload) list.set(key, { upload, label });
  else list.delete(key);
  scopes.set(scope, list);
}

// Envoie les fichiers en attente du panneau ; renvoie les sections dont l'envoi a échoué
// (le détail de l'erreur s'affiche sous la zone de dépôt concernée)
export async function flushUploads(scope: string): Promise<string[]> {
  const list = [...(scopes.get(scope)?.values() ?? [])];
  const results = await Promise.all(list.map(async (u) => ((await u.upload()) ? null : u.label)));
  return results.filter((label): label is string => label !== null);
}

export function hasPendingUploads(scope: string) {
  return (scopes.get(scope)?.size ?? 0) > 0;
}
