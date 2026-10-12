"use client";

import { useFormStatus } from "react-dom";

// L'import des visuels peut prendre quelques secondes : bouton bloqué pendant l'envoi (pas de double projet)
export function ConvertToProjectButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-40">{pending ? "Création du projet…" : "Convertir en projet du portfolio"}</button>;
}
