"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendBrief } from "@/app/actions";
import { href, type Locale } from "@/lib/i18n";
import { overlayTypes, type OptionChoice } from "@/lib/pricing";
import { useLocale } from "./I18nProvider";
import { Field, FormStatus, OptionsField, inputClass } from "./ui";

// Types d'overlays en anglais (la valeur envoyée reste le nom français)
const overlayEn: Record<string, string> = { Démarrage: "Starting", Pause: "Break", Fin: "Ending", Discussion: "Just chatting", Gameplay: "Gameplay" };

const texts = {
  fr: {
    email: "E-mail *",
    pseudo: "Pseudo de stream",
    channel: "Lien de ta chaîne *",
    platform: "Plateforme principale",
    other: "Autre",
    logo: "Ton logo existant *",
    logoHint: "Lien de téléchargement (Drive, WeTransfer…). Format vectoriel conseillé (SVG, AI, EPS ou PDF), sinon PNG en haute définition.",
    universe: "Univers et ambiance *",
    universeHint: "Jeux streamés, thème, mots qui décrivent ta chaîne…",
    colors: "Couleurs souhaitées",
    colorsHint: "Codes couleur, logo existant, couleurs à éviter…",
    references: "Références visuelles",
    referencesHint: "Liens vers des overlays, chaînes ou images qui t'inspirent.",
    elements: "Éléments à inclure",
    elementsHint: "Textes des écrans, réseaux sociaux à afficher, emplacement caméra…",
    overlays: "Overlays souhaités",
    options: "Options à la carte",
    deadline: "Date souhaitée",
    notes: "Remarques",
    sending: "Envoi…",
    send: "Envoyer mon brief",
    privacyNote: "Ces informations servent uniquement à réaliser ta commande.",
    privacy: "Politique de confidentialité",
  },
  en: {
    email: "Email *",
    pseudo: "Stream name",
    channel: "Link to your channel *",
    platform: "Main platform",
    other: "Other",
    logo: "Your existing logo *",
    logoHint: "Download link (Drive, WeTransfer…). Vector format recommended (SVG, AI, EPS or PDF), otherwise high-resolution PNG.",
    universe: "Universe and mood *",
    universeHint: "Games you stream, theme, words that describe your channel…",
    colors: "Preferred colours",
    colorsHint: "Colour codes, existing logo, colours to avoid…",
    references: "Visual references",
    referencesHint: "Links to overlays, channels or images that inspire you.",
    elements: "Elements to include",
    elementsHint: "Screen texts, social media to display, camera position…",
    overlays: "Overlays you want",
    options: "À la carte add-ons",
    deadline: "Preferred date",
    notes: "Notes",
    sending: "Sending…",
    send: "Send my brief",
    privacyNote: "This information is only used to complete your order.",
    privacy: "Privacy policy",
  },
} satisfies Record<Locale, Record<string, string>>;

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
  optionChoices: OptionChoice[];
  sessionId?: string;
  packId?: string;
  formulaId?: string;
  payment?: string;
  hasLogo?: boolean;
  email?: string;
  overlayHint?: string;
}) {
  const [state, action, pending] = useActionState(sendBrief, null);
  const locale = useLocale();
  const tx = texts[locale];

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="sessionId" value={sessionId ?? ""} />
      <input type="hidden" name="packId" value={packId ?? ""} />
      <input type="hidden" name="formulaId" value={formulaId ?? ""} />
      <input type="hidden" name="payment" value={payment ?? ""} />
      <input type="hidden" name="hasLogo" value={hasLogo ? "1" : ""} />
      <input type="hidden" name="lang" value={locale} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.email}>
          <input name="email" type="email" required defaultValue={email} className={inputClass} />
        </Field>
        <Field label={tx.pseudo}>
          <input name="pseudo" className={inputClass} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.channel}>
          <input name="channel" required placeholder="https://twitch.tv/…" className={inputClass} />
        </Field>
        <Field label={tx.platform}>
          <select name="platform" className={inputClass} defaultValue="Twitch">
            <option>Twitch</option>
            <option>YouTube</option>
            <option>Kick</option>
            <option>TikTok Live</option>
            <option value="Autre">{tx.other}</option>
          </select>
        </Field>
      </div>
      {hasLogo && (
        <Field label={tx.logo} hint={tx.logoHint}>
          <input name="logoLink" required placeholder="https://…" className={inputClass} />
        </Field>
      )}
      <Field label={tx.universe} hint={tx.universeHint}>
        <textarea name="universe" required rows={4} className={inputClass} />
      </Field>
      <Field label={tx.colors} hint={tx.colorsHint}>
        <input name="colors" className={inputClass} />
      </Field>
      <Field label={tx.references} hint={tx.referencesHint}>
        <textarea name="references" rows={3} className={inputClass} />
      </Field>
      <Field label={tx.elements} hint={tx.elementsHint}>
        <textarea name="elements" rows={3} className={inputClass} />
      </Field>
      <OptionsField
        name="overlays"
        legend={tx.overlays}
        hint={overlayHint}
        options={overlayTypes.map((o) => ({ id: o, label: o, main: locale === "en" ? (overlayEn[o] ?? o) : o }))}
      />
      <OptionsField legend={tx.options} options={optionChoices} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.deadline}>
          <input name="deadline" type="date" className={inputClass} />
        </Field>
        <Field label={tx.notes}>
          <input name="notes" className={inputClass} />
        </Field>
      </div>
      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? tx.sending : tx.send}
      </button>
      <p className="text-xs text-muted">
        {tx.privacyNote}{" "}
        <Link href={href(locale, "/confidentialite")} className="underline hover:text-foreground">
          {tx.privacy}
        </Link>
      </p>
    </form>
  );
}
