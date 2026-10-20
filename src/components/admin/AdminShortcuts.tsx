"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { notifySiteChanged } from "@/lib/site-refresh";

// Formulaire visé par Ctrl + S : celui du panneau ouvert (son bouton d'enregistrement), sinon celui du champ en cours d'édition
function formToSave(): { form: HTMLFormElement; submitter?: HTMLElement } | null {
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>("dialog[open]")];
  const dialog = dialogs.at(-1);
  if (dialog) {
    const button = dialog.querySelector<HTMLButtonElement>("button[type=submit][form]");
    if (button?.form) return { form: button.form, submitter: button };
    const form = dialog.querySelector("form");
    if (form) return { form };
  }
  const active = document.activeElement;
  const form = active instanceof HTMLElement ? (active.closest("form") ?? (active as HTMLInputElement).form) : null;
  if (form) return { form };
  // Aucun champ actif : le seul formulaire d'enregistrement de la page, s'il n'y en a qu'un
  const forms = [...document.querySelectorAll<HTMLFormElement>("main form")].filter((f) => !f.closest("dialog") && f.querySelector("button[type=submit], button:not([type])") && f.querySelector("input:not([type=hidden]), textarea, select"));
  return forms.length === 1 ? { form: forms[0] } : null;
}

// Raccourcis de l'admin : Ctrl + S (⌘ + S) enregistre partout. Après un enregistrement (?enregistre=1),
// les onglets du site ouverts dans ce navigateur se mettent à jour.
// Les éditeurs qui enregistrent eux-mêmes (Laboratoire, visuels : data-own-save) gardent leur propre Ctrl + S.
export function AdminShortcuts() {
  const saved = useSearchParams().get("enregistre");
  useEffect(() => { if (saved) notifySiteChanged(); }, [saved]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
      // Éditeur qui enregistre lui-même (Laboratoire, visuel dans son panneau ouvert) : il s'en charge
      const own = [...document.querySelectorAll<HTMLElement>(".cl-root, [data-own-save]")].some((el) => { const dialog = el.closest("dialog"); return dialog ? dialog.open : true; });
      if (own) return;
      event.preventDefault();
      const target = formToSave();
      if (target) target.form.requestSubmit(target.submitter instanceof HTMLButtonElement ? target.submitter : undefined);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return null;
}
