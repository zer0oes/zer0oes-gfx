"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { sendBrief } from "@/app/actions";
import { href, type Locale } from "@/lib/i18n";
import { overlayTypes } from "@/lib/pricing";
import { useLocale } from "./I18nProvider";
import { DatePicker } from "./DatePicker";
import { Field, FormStatus, inputClass } from "./ui";

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
  overlayCount,
  portalUrl,
}: {
  portalUrl?: string;
  overlayCount: number | null;
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
  const [overlays, setOverlays] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([
    ...(!email ? [tx.email.replace(" *", "")] : []), tx.channel.replace(" *", ""),
    ...(hasLogo ? [tx.logo.replace(" *", "")] : []), tx.universe.replace(" *", ""),
  ]);
  const remaining = overlayCount === null ? 0 : overlayCount - overlays.length;
  const missing = [...missingFields, ...(remaining > 0 ? [locale === "en" ? `${remaining} overlay${remaining > 1 ? "s" : ""} to choose` : `${remaining} overlay${remaining > 1 ? "s" : ""} à choisir`] : [])];

  useEffect(() => {
    if (!state?.ok || !portalUrl) return;
    const timer = window.setTimeout(() => window.location.assign(portalUrl), 20_000);
    return () => window.clearTimeout(timer);
  }, [state?.ok, portalUrl]);

  if (state?.ok) return (
    <div className="space-y-4">
      <FormStatus state={state} />
      {portalUrl && <>
        <p className="text-sm text-foreground/80">{locale === "en" ? "You’ll be redirected to your order space in 20 seconds." : "Tu seras redirigé vers ton espace commande dans 20 secondes."}</p>
        <a href={portalUrl} className="inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110">{locale === "en" ? "Open my order now →" : "Accéder à ma commande maintenant →"}</a>
      </>}
    </div>
  );

  return (
    <form action={action} className="space-y-5 [&_input::placeholder]:text-foreground/65 [&_label>span.text-xs]:text-sm [&_label>span.text-xs]:text-foreground/75" onInput={(event) => {
      const form = event.currentTarget;
      const required = [["email", tx.email], ["channel", tx.channel], ...(hasLogo ? [["logoLink", tx.logo]] : []), ["universe", tx.universe]];
      setMissingFields(required.filter(([name]) => {
        const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`input[name="${name}"], textarea[name="${name}"]`);
        return !field?.value.trim() || !field.validity.valid;
      }).map(([, label]) => label.replace(" *", "")));
    }}>
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
      {overlayCount !== null && <fieldset>
        <legend className="text-sm font-medium">{tx.overlays}</legend>
        <p id="overlay-count" aria-live="polite" className="mt-1 text-sm text-foreground/75">{overlayHint} {overlays.length} / {overlayCount} {locale === "en" ? "selected" : "sélectionnés"}</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {overlayTypes.map((o) => {
            const selected = overlays.includes(o);
            const disabled = !selected && overlays.length >= overlayCount;
            return <label key={o} className={`flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm ${disabled ? "opacity-50" : "cursor-pointer"}`}>
              <input type="checkbox" name="overlays" value={o} checked={selected} disabled={disabled} aria-describedby="overlay-count" onChange={(e) => setOverlays((current) => e.target.checked ? [...current, o].slice(0, overlayCount) : current.filter((v) => v !== o))} className="mt-0.5 accent-[var(--accent)]" />
              {locale === "en" ? overlayEn[o] ?? o : o}
            </label>;
          })}
        </div>
      </fieldset>}
      <div className="grid gap-5 sm:grid-cols-2">
        <DatePicker name="deadline" label={tx.deadline} locale={locale} />
        <Field label={tx.notes}>
          <input name="notes" className={inputClass} />
        </Field>
      </div>
      <FormStatus state={state} />
      <p id="brief-missing" role="status" className="text-sm leading-relaxed text-foreground/80">{missing.length ? `${locale === "en" ? "Before sending, complete: " : "Pour envoyer ton brief, complète : "}${missing.join(" · ")}.` : locale === "en" ? "Your brief is ready to send." : "Ton brief est prêt à être envoyé."}</p>
      <button
        type="submit"
        disabled={pending || missing.length > 0}
        aria-describedby="brief-missing brief-next"
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? tx.sending : tx.send}
      </button>
      <p id="brief-next" className="text-sm leading-relaxed text-foreground/80">{locale === "en" ? "After you send your brief, I’ll review your details and reply within 2 business days to confirm the next steps or clarify any missing information. Your previews will then appear in your order space." : "Après l’envoi, je relis tes informations et te réponds sous 2 jours ouvrés pour confirmer la suite ou préciser les éléments manquants. Tes aperçus seront ensuite disponibles dans ton espace commande."}</p>
      <p className="text-xs text-muted">
        {tx.privacyNote}{" "}
        <Link href={href(locale, "/confidentialite")} className="underline hover:text-foreground">
          {tx.privacy}
        </Link>
      </p>
    </form>
  );
}
