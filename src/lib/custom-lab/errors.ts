// Ne transmet jamais le message brut de Supabase (ni des informations de connexion).
export class LabStorageError extends Error {
  readonly reason: "setup" | "unavailable";
  constructor(code?: string) {
    const setup = code === "PGRST205" || code === "42P01";
    super(setup
      ? "Le Laboratoire n’est pas encore initialisé dans la base : sa migration doit être appliquée."
      : "Le stockage du Laboratoire est temporairement indisponible. Réessaie dans un instant.");
    this.reason = setup ? "setup" : "unavailable";
  }
}
