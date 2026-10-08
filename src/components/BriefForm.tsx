"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { quoteBriefFields } from "@/lib/quote-brief";
import { sendBrief } from "@/app/actions";
import { href, type Locale } from "@/lib/i18n";
import { overlayTypes } from "@/lib/pricing";
import { productBriefHint } from "@/lib/option-products";
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
  initialBrief,
  revisionsUsed = 0,
  purchasedProducts = [],
  submitAction = sendBrief,
  defaultBrief,
  quoteToken,
  optionalProducts = [],
  fullWidthSections = false,
  requiredFields,
}: {
  optionalProducts?: string[];
  fullWidthSections?: boolean;
  requiredFields?: string[];
  submitAction?: typeof sendBrief;
  defaultBrief?: Record<string, string>;
  quoteToken?: string;
  purchasedProducts?: string[];
  revisionsUsed?: number;
  initialBrief?: Record<string, string>;
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
  const [state, action, pending] = useActionState(submitAction, null);
  const values = initialBrief ?? defaultBrief;
  const isRequired = (name: string) => requiredFields ? requiredFields.includes(name) : ["email", "channel", "universe", ...(hasLogo ? ["logoLink"] : [])].includes(name);
  const locale = useLocale();
  const tx = texts[locale];
  const [overlays, setOverlays] = useState<string[]>(() => overlayTypes.filter((o) => values?.["Overlays choisis"]?.includes(o)));
  const [missingFields, setMissingFields] = useState<string[]>([
    ...quoteBriefFields.filter((f) => isRequired(f.id) && !(values?.[f.key] || (f.id === "email" ? email : f.id === "platform" ? "Twitch" : ""))).map((f) => f.label),
    ...purchasedProducts.filter((line, index) => !optionalProducts.includes(line) && !values?.[`Création ${index + 1} : ${line}`]),
  ]);
  const remaining = overlayCount === null ? 0 : overlayCount - overlays.length;
  const missing = [...missingFields, ...(remaining > 0 ? [locale === "en" ? `${remaining} overlay${remaining > 1 ? "s" : ""} to choose` : `${remaining} overlay${remaining > 1 ? "s" : ""} à choisir`] : [])];

  useEffect(() => {
    if (!state?.ok || !portalUrl) return;
    if (initialBrief) {
      window.location.assign(portalUrl);
      return;
    }
    const timer = window.setTimeout(() => window.location.assign(portalUrl), 20_000);
    return () => window.clearTimeout(timer);
  }, [state?.ok, portalUrl, initialBrief]);

  if (state?.ok) return (
    <div className="space-y-4">
      <FormStatus state={state} />
      {portalUrl && <>
        <p className="text-sm text-foreground/80">{initialBrief ? (locale === "en" ? "Redirecting to your order space…" : "Redirection vers ton espace commande…") : locale === "en" ? "You’ll be redirected to your order space in 20 seconds." : "Tu seras redirigé vers ton espace commande dans 20 secondes."}</p>
        <a href={portalUrl} className="inline-flex rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110">{locale === "en" ? "Open my order now →" : "Accéder à ma commande maintenant →"}</a>
      </>}
    </div>
  );

  return (
    <form action={action} className="space-y-5 [&_input::placeholder]:text-foreground/65 [&_label>span.text-xs]:text-sm [&_label>span.text-xs]:text-foreground/75" onInput={(event) => {
      const form = event.currentTarget;
      const required = [...quoteBriefFields.filter((f) => isRequired(f.id)).map((f) => [f.id, f.label]), ...purchasedProducts.flatMap((line, index) => optionalProducts.includes(line) ? [] : [[`productBrief_${index}`, line]])];
      setMissingFields(required.filter(([name]) => {
        const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
        return !field?.value.trim() || !field.validity.valid;
      }).map(([, label]) => label.replace(" *", "")));
    }}>
      <input type="hidden" name="sessionId" value={sessionId ?? ""} />
      {quoteToken && <input type="hidden" name="token" value={quoteToken} />}
      <input type="hidden" name="editBrief" value={initialBrief ? "1" : "0"} />
      {initialBrief && <p className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">{locale === "en" ? `${revisionsUsed} / 2 updates used. Saving these changes uses one update and notifies me.` : `${revisionsUsed} / 2 modifications utilisées. Enregistrer ces changements utilise une modification et m’envoie une notification.`}</p>}
      <input type="hidden" name="packId" value={packId ?? ""} />
      <input type="hidden" name="formulaId" value={formulaId ?? ""} />
      <input type="hidden" name="payment" value={payment ?? ""} />
      <input type="hidden" name="hasLogo" value={hasLogo ? "1" : ""} />
      <input type="hidden" name="lang" value={locale} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.email.replace(" *", "") + (isRequired("email") ? " *" : "")}>
          <input name="email" type="email" defaultValue={values?.["E-mail"] ?? email} className={inputClass} required={isRequired("email")} />
        </Field>
        <Field label={tx.pseudo.replace(" *", "") + (isRequired("pseudo") ? " *" : "")}>
          <input name="pseudo" defaultValue={values?.["Pseudo"]} className={inputClass} required={isRequired("pseudo")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.channel.replace(" *", "") + (isRequired("channel") ? " *" : "")}>
          <input name="channel" defaultValue={values?.["Chaîne"]} placeholder="https://twitch.tv/…" className={inputClass} required={isRequired("channel")} />
        </Field>
        <Field label={tx.platform.replace(" *", "") + (isRequired("platform") ? " *" : "")}>
          <select name="platform" className={inputClass} defaultValue={values?.["Plateforme"] || "Twitch"} required={isRequired("platform")}>
            <option>Twitch</option>
            <option>YouTube</option>
            <option>Kick</option>
            <option>TikTok Live</option>
            <option value="Autre">{tx.other}</option>
          </select>
        </Field>
      </div>
      {(hasLogo || requiredFields?.includes("logoLink")) && (
        <Field label={tx.logo.replace(" *", "") + (isRequired("logoLink") ? " *" : "")} hint={tx.logoHint}>
          <input name="logoLink" defaultValue={values?.["Logo existant"]} placeholder="https://…" className={inputClass} required={isRequired("logoLink")} />
        </Field>
      )}
      <Field label={tx.universe.replace(" *", "") + (isRequired("universe") ? " *" : "")} hint={tx.universeHint}>
        <textarea name="universe" defaultValue={values?.["Univers / ambiance"]} rows={4} className={inputClass} required={isRequired("universe")} />
      </Field>
      <Field label={tx.colors.replace(" *", "") + (isRequired("colors") ? " *" : "")} hint={tx.colorsHint}>
        <input name="colors" defaultValue={values?.["Couleurs"]} className={inputClass} required={isRequired("colors")} />
      </Field>
      <Field label={tx.references.replace(" *", "") + (isRequired("references") ? " *" : "")} hint={tx.referencesHint}>
        <textarea name="references" defaultValue={values?.["Références"]} rows={3} className={inputClass} required={isRequired("references")} />
      </Field>
      <Field label={tx.elements.replace(" *", "") + (isRequired("elements") ? " *" : "")} hint={tx.elementsHint}>
        <textarea name="elements" defaultValue={values?.["Éléments à inclure"]} rows={3} className={inputClass} required={isRequired("elements")} />
      </Field>
      {purchasedProducts.length > 0 && <section className={fullWidthSections ? "-mx-4 space-y-5 border-t border-border px-4 pt-5 sm:-mx-5 sm:px-5" : "space-y-5 rounded-xl border border-accent/30 p-4"}>
        <h3 className="font-semibold">{locale === "en" ? "Your purchased creations" : "Tes créations achetées"}</h3>
        {purchasedProducts.map((line, index) => <Field key={index} label={`${line}${optionalProducts.includes(line) ? (locale === "en" ? " (optional)" : " (facultatif)") : " *"}`} hint={productBriefHint(line, locale)}><textarea name={`productBrief_${index}`} required={!optionalProducts.includes(line)} rows={3} defaultValue={values?.[`Création ${index + 1} : ${line}`]} className={inputClass} /></Field>)}
      </section>}
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
        <DatePicker defaultValue={values?.["Date souhaitée"]} name="deadline" label={tx.deadline} locale={locale} />
        <Field label={tx.notes.replace(" *", "") + (isRequired("notes") ? " *" : "")}>
          <input name="notes" defaultValue={values?.["Remarques"]} className={inputClass} required={isRequired("notes")} />
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
        {pending ? tx.sending : initialBrief ? (locale === "en" ? "Save my changes" : "Enregistrer mes modifications") : tx.send}
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
