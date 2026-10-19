"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Bouton d'envoi placé hors du formulaire (pied d'un panneau, attribut form) : affiche tout de suite
// « Enregistrement… » pendant l'envoi, jusqu'au retour sur la page.
export function SubmitButton({ form, label, className }: { form: string; label: string; className?: string }) {
  const [pending, setPending] = useState(false);
  const params = useSearchParams();
  useEffect(() => {
    const element = document.getElementById(form);
    if (!element) return;
    const start = () => setPending(true);
    element.addEventListener("submit", start);
    return () => element.removeEventListener("submit", start);
  }, [form]);
  // Retour sur la page après l'enregistrement (nouveaux paramètres) : le bouton redevient actif
  useEffect(() => { const reset = setTimeout(() => setPending(false), 0); return () => clearTimeout(reset); }, [params]);
  return <button type="submit" form={form} disabled={pending} aria-busy={pending} className={`${className ?? ""} disabled:cursor-wait disabled:opacity-70`}>{pending ? "Enregistrement…" : label}</button>;
}
