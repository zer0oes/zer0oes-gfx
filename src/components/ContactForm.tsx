"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/actions";
import { Field, FormStatus, inputClass } from "./ui";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContact, null);

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      {/* Pot de miel anti-spam, invisible pour les humains */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom ou pseudo *">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="E-mail *">
          <input name="email" type="email" required className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Lien de votre chaîne">
          <input name="channel" type="url" placeholder="https://twitch.tv/…" className={inputClass} />
        </Field>
        <Field label="Type de demande">
          <select name="type" className={inputClass} defaultValue="Projet sur mesure">
            <option>Projet sur mesure</option>
            <option>Question sur une offre</option>
            <option>Collaboration / partenariat</option>
            <option>Autre</option>
          </select>
        </Field>
      </div>
      <Field label="Budget indicatif">
        <select name="budget" className={inputClass} defaultValue="">
          <option value="">Je ne sais pas encore</option>
          <option>Moins de 100 €</option>
          <option>100 à 250 €</option>
          <option>250 à 500 €</option>
          <option>Plus de 500 €</option>
        </select>
      </Field>
      <Field label="Votre projet *">
        <textarea
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="Décrivez ce dont vous avez besoin : éléments, ambiance, délais…"
          className={inputClass}
        />
      </Field>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
