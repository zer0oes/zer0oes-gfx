"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/actions";
import { optionChoices } from "@/data/packs";
import { Field, FormStatus, OptionsField, inputClass } from "./ui";

export function ContactForm({ defaultType = "Projet sur mesure" }: { defaultType?: string }) {
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
          <select name="type" className={inputClass} defaultValue={defaultType}>
            <option>Projet sur mesure</option>
            <option>Devis Univers complet</option>
            <option>Question sur une offre</option>
            <option>Collaboration / partenariat</option>
            <option>Autre</option>
          </select>
        </Field>
      </div>
      <Field label="Budget indicatif">
        <select name="budget" className={inputClass} defaultValue="">
          <option value="">Je ne sais pas encore</option>
          <option>Moins de 400 €</option>
          <option>400 à 900 €</option>
          <option>900 à 1 600 €</option>
          <option>Plus de 1 600 €</option>
        </select>
      </Field>
      <OptionsField options={optionChoices} />
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
