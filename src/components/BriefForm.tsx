"use client";

import { useActionState } from "react";
import { sendBrief } from "@/app/actions";
import { Field, FormStatus, inputClass } from "./ui";

export function BriefForm({
  sessionId,
  packId,
  email,
}: {
  sessionId?: string;
  packId?: string;
  email?: string;
}) {
  const [state, action, pending] = useActionState(sendBrief, null);

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="sessionId" value={sessionId ?? ""} />
      <input type="hidden" name="packId" value={packId ?? ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail *">
          <input name="email" type="email" required defaultValue={email} className={inputClass} />
        </Field>
        <Field label="Pseudo de stream">
          <input name="pseudo" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Lien de votre chaîne *">
          <input name="channel" required placeholder="https://twitch.tv/…" className={inputClass} />
        </Field>
        <Field label="Plateforme principale">
          <select name="platform" className={inputClass} defaultValue="Twitch">
            <option>Twitch</option>
            <option>YouTube</option>
            <option>Kick</option>
            <option>TikTok Live</option>
            <option>Autre</option>
          </select>
        </Field>
      </div>
      <Field label="Univers et ambiance *" hint="Jeux streamés, thème, mots qui décrivent votre chaîne…">
        <textarea name="universe" required rows={4} className={inputClass} />
      </Field>
      <Field label="Couleurs souhaitées" hint="Codes couleur, logo existant, couleurs à éviter…">
        <input name="colors" className={inputClass} />
      </Field>
      <Field label="Références visuelles" hint="Liens vers des overlays, chaînes ou images qui vous inspirent.">
        <textarea name="references" rows={3} className={inputClass} />
      </Field>
      <Field label="Éléments à inclure" hint="Textes des écrans, réseaux sociaux à afficher, emplacement caméra…">
        <textarea name="elements" rows={3} className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date souhaitée">
          <input name="deadline" type="date" className={inputClass} />
        </Field>
        <Field label="Remarques">
          <input name="notes" className={inputClass} />
        </Field>
      </div>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer mon brief"}
      </button>
    </form>
  );
}
