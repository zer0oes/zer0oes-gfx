// Projet mis en avant sur la page Portfolio (carte sur deux colonnes, en premier), choisi dans Admin > Portfolio.
// Rangé dans le contenu JSON existant : « page:portfolio:featured » = identifiant du projet ("" : aucun).
export const featuredProjectKey = "page:portfolio:featured";

export function featuredProjectId(raw: unknown): string {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[featuredProjectKey] : undefined;
  return typeof value === "string" ? value : "";
}
