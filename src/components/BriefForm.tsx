"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendBrief } from "@/app/actions";
import { overlayTypes } from "@/lib/pricing";
import { Field, FormStatus, OptionsField, inputClass } from "./ui";

export function BriefForm({
  sessionId,
  packId,
  formulaId,
  payment,
  hasLogo,
  email,
  overlayHint,
  optionChoices,
}: {
  optionChoices: { id: string; label: string }[];
  sessionId?: string;
  packId?: string;
  formulaId?: string;
  payment?: string;
  hasLogo?: boolean;
  email?: string;
  overlayHint?: string;
}) {
  const [state, action, pending] = useActionState(sendBrief, null);

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="sessionId" value={sessionId ?? ""} />
      <input type="hidden" name="packId" value={packId ?? ""} />
      <input type="hidden" name="formulaId" value={formulaId ?? ""} />
      <input type="hidden" name="payment" value={payment ?? ""} />
      <input type="hidden" name="hasLogo" value={hasLogo ? "1" : ""} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="E-mail *">
          <input name="email" type="email" required defaultValue={email} className={inputClass} />
        </Field>
        <Field label="Pseudo de stream">
          <input name="pseudo" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Lien de ta chaîne *">
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
      {hasLogo && (
        <Field
          label="Ton logo existant *"
          hint="Lien de téléchargement (Drive, WeTransfer…). Format vectoriel conseillé (SVG, AI, EPS ou PDF), sinon PNG en haute définition."
        >
          <input name="logoLink" required placeholder="https://…" className={inputClass} />
        </Field>
      )}
      <Field label="Univers et ambiance *" hint="Jeux streamés, thème, mots qui décrivent ta chaîne…">
        <textarea name="universe" required rows={4} className={inputClass} />
      </Field>
      <Field label="Couleurs souhaitées" hint="Codes couleur, logo existant, couleurs à éviter…">
        <input name="colors" className={inputClass} />
      </Field>
      <Field label="Références visuelles" hint="Liens vers des overlays, chaînes ou images qui t'inspirent.">
        <textarea name="references" rows={3} className={inputClass} />
      </Field>
      <Field label="Éléments à inclure" hint="Textes des écrans, réseaux sociaux à afficher, emplacement caméra…">
        <textarea name="elements" rows={3} className={inputClass} />
      </Field>
      <OptionsField
        name="overlays"
        legend="Overlays souhaités"
        hint={overlayHint}
        options={overlayTypes.map((t) => ({ id: t, label: t }))}
      />
      <OptionsField legend="Options à la carte" options={optionChoices} />
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
      <p className="text-xs text-muted">
        Ces informations servent uniquement à réaliser ta commande.{" "}
        <Link href="/confidentialite" className="underline hover:text-foreground">
          Politique de confidentialité
        </Link>
      </p>
    </form>
  );
}
