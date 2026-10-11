"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { quoteBriefFields } from "@/lib/quote-brief";
import { sendBrief } from "@/app/actions";
import { href, type Locale } from "@/lib/i18n";
import { overlayTypes } from "@/lib/pricing";
import { productBriefBlock } from "@/lib/option-products";
import { trOfferName } from "@/lib/translations-en";
import { productBriefFieldName, productBriefParts, splitProductBrief } from "@/lib/product-brief";
import { BRIEF_PLATFORM_KEY, briefDeliveryNeeds, hasInstallLine } from "@/lib/brief-delivery";
import { BriefDeliveryQuestions } from "./BriefDeliveryQuestions";
import { useLocale } from "./I18nProvider";
import { DatePicker } from "./DatePicker";
import { Field, FormStatus, inputClass } from "./ui";
import { MaterialIcon } from "./admin/MaterialIcon";

// Champs des créations achetées : fond plus sombre et bordure plus marquée que les autres champs
const briefInputClass = inputClass.replace("bg-surface", "bg-background").replace("border-border", "border-foreground/20");


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
    referencesHint: "Liens vers des créations ou images qui t’inspirent.",
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
    referencesHint: "Links to creations or images that inspire you.",
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
  productLines,
}: {
  productLines?: string[];
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
  const sectionClass = fullWidthSections
    ? "-mx-4 border-t border-border px-4 pt-6 sm:-mx-5 sm:px-5"
    : "-mx-6 border-t border-border px-6 pt-6 sm:-mx-8 sm:px-8";
  const showElements = purchasedProducts.length === 0;
  const productLabel = (line: string) => productBriefBlock(line, locale).title;
  const [answers, setAnswers] = useState<Record<string, string>>(() => Object.fromEntries(purchasedProducts.flatMap((line, index) => {
    const saved = values?.[`Création ${index + 1} : ${line}`];
    const parts = productBriefParts(line);
    const split = splitProductBrief(line, saved);
    return parts ? parts.map((_, j) => [productBriefFieldName(index, j), split[j] ?? ""]) : [[productBriefFieldName(index), saved ?? ""]];
  })));
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const fieldError = (name: string) => invalidFields.includes(name) ? (locale === "en" ? "Please complete this field." : "Complète ce champ pour envoyer ton brief.") : undefined;
  const creationNames = purchasedProducts.flatMap((line, index) => productBriefParts(line)?.map((_, j) => productBriefFieldName(index, j)) ?? [productBriefFieldName(index)]);
  const completed = creationNames.filter((name) => answers[name]?.trim()).length;
  const [overlays, setOverlays] = useState<string[]>(() => overlayTypes.filter((o) => values?.["Overlays choisis"]?.includes(o)));
  const [missingFields, setMissingFields] = useState<string[]>([
    ...quoteBriefFields.filter((f) => isRequired(f.id) && (showElements || f.id !== "elements") && !(values?.[f.key] || (f.id === "email" ? email : f.id === "platform" ? "Twitch" : ""))).map((f) => f.label),
    ...purchasedProducts.filter((line, index) => !optionalProducts.includes(line) && !values?.[`Création ${index + 1} : ${line}`]).map(productLabel),
  ]);
  // Questions techniques selon le contenu de la commande (widgets / alertes, overlays)
  const needs = briefDeliveryNeeds(productLines ?? purchasedProducts, overlayCount);
  const [streamTool, setStreamTool] = useState(values?.[BRIEF_PLATFORM_KEY] ?? "");
  // Note sous la plateforme : livraison par lien d'installation (packs et à la carte) ; installation par zer0oes_GFX si achetée
  const lines = productLines ?? purchasedProducts;
  const alaCarte = packId === "options" || packId?.startsWith("option:");
  // Livraison par lien d'installation (Streamlabs : Widget Theme ; StreamElements : code c4ldas), avec les fichiers sources
  const linkNote = locale === "en"
    ? "You’ll receive a link to install your creations on your platform in a few clicks, with step-by-step instructions and the source files."
    : "Tu recevras un lien pour installer tes créations en quelques clics sur ta plateforme, avec les instructions et les fichiers sources.";
  const installNote = quoteToken ? undefined : alaCarte && hasInstallLine(lines)
    ? (locale === "en" ? "You chose installation by zer0oes_GFX: you’ll invite the zer0oes_GFX account as an editor of your platform." : "Tu as choisi l’installation par zer0oes_GFX : tu inviteras le compte zer0oes_GFX comme éditeur de ta plateforme.")
    : linkNote;
  const remaining = overlayCount === null ? 0 : overlayCount - overlays.length;
  const missing = [...missingFields, ...(needs.platform && !streamTool ? [locale === "en" ? "platform for widgets and alerts" : "plateforme des widgets et alertes"] : []), ...(remaining > 0 ? [locale === "en" ? `${remaining} overlay${remaining > 1 ? "s" : ""} to choose` : `${remaining} overlay${remaining > 1 ? "s" : ""} à choisir`] : [])];

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
    <form action={action} className="space-y-5 [&_input::placeholder]:text-foreground/65 [&_textarea::placeholder]:text-foreground/65 [&_label>span.text-xs]:text-sm [&_label>span.text-xs]:text-foreground/75" onInvalidCapture={(event) => {
      event.preventDefault();
      const field = event.target as unknown as HTMLInputElement;
      setInvalidFields((current) => [...new Set([...current, field.name])]);
      const details = field.closest("details");
      if (details) details.open = true;
      const first = event.currentTarget.querySelector<HTMLInputElement>("input:invalid, textarea:invalid, select:invalid");
      if (first === field) requestAnimationFrame(() => field.focus());
    }} onBlur={(event) => {
      const field = event.target as unknown as HTMLInputElement;
      if (field.name && field.validity) setInvalidFields((current) => field.validity.valid ? current.filter((name) => name !== field.name) : [...new Set([...current, field.name])]);
    }} onInput={(event) => {
      const form = event.currentTarget;
      const field = event.target as HTMLInputElement;
      if (field.name?.startsWith("productBrief_")) setAnswers((current) => ({ ...current, [field.name]: field.value }));
      if (field.validity?.valid) setInvalidFields((current) => current.filter((name) => name !== field.name));
      const required = [...quoteBriefFields.filter((f) => isRequired(f.id) && (showElements || f.id !== "elements")).map((f) => [f.id, f.label]), ...purchasedProducts.flatMap((line, index) => optionalProducts.includes(line) ? [] : productBriefParts(line)?.map((part, j) => [productBriefFieldName(index, j), `${line} · ${locale === "en" ? part.labelEn : part.label}`]) ?? [[productBriefFieldName(index), line]])];
      setMissingFields(required.filter(([name]) => {
        const field = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
        return !field?.value.trim() || !field.validity.valid;
      }).map(([, label]) => {
        const line = purchasedProducts.find((product) => label === product || label.startsWith(`${product} · `));
        return line ? label.replace(line, productLabel(line)) : label.replace(" *", "");
      }));
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
      <fieldset className="space-y-5">
        <legend className="mb-4 flex items-center gap-3 font-display text-lg font-bold"><span aria-hidden className="text-gradient text-xl font-bold tabular-nums">01</span>{locale === "en" ? "Your channel" : "Ta chaîne"}</legend>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.email.replace(" *", "") + (isRequired("email") ? " *" : "")} hint={fieldError("email")}>
          <input name="email" type="email" defaultValue={values?.["E-mail"] ?? email} className={inputClass} required={isRequired("email")} />
        </Field>
        <Field label={tx.pseudo.replace(" *", "") + (isRequired("pseudo") ? " *" : "")} hint={fieldError("pseudo")}>
          <input name="pseudo" defaultValue={values?.["Pseudo"]} className={inputClass} required={isRequired("pseudo")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.channel.replace(" *", "") + (isRequired("channel") ? " *" : "")} hint={fieldError("channel")}>
          <input name="channel" defaultValue={values?.["Chaîne"]} placeholder="https://twitch.tv/…" className={inputClass} required={isRequired("channel")} />
        </Field>
        <Field label={tx.platform.replace(" *", "") + (isRequired("platform") ? " *" : "")} hint={fieldError("platform")}>
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
        <Field label={tx.logo.replace(" *", "") + (isRequired("logoLink") ? " *" : "")} hint={fieldError("logoLink") ?? tx.logoHint}>
          <input name="logoLink" defaultValue={values?.["Logo existant"]} placeholder="https://…" className={inputClass} required={isRequired("logoLink")} />
        </Field>
      )}
      <BriefDeliveryQuestions mode={quoteToken ? "quote-brief" : "brief"} note={installNote} needs={needs} en={locale === "en"} streamTool={streamTool} onStreamTool={setStreamTool} />
      {fieldError("streamTool") && <p className="text-sm text-rose-300">{locale === "en" ? "Choose your alert platform." : "Choisis la plateforme de tes alertes et widgets."}</p>}
      </fieldset>
      <div className={sectionClass}>
      <fieldset className="space-y-5">
        <legend className="mb-4 flex items-center gap-3 font-display text-lg font-bold"><span aria-hidden className="text-gradient text-xl font-bold tabular-nums">02</span>{locale === "en" ? "Your visual universe" : "Ton univers visuel"}</legend>
      <Field label={tx.universe.replace(" *", "") + (isRequired("universe") ? " *" : "")} hint={fieldError("universe") ?? tx.universeHint}>
        <textarea name="universe" defaultValue={values?.["Univers / ambiance"]} rows={3} className={inputClass} required={isRequired("universe")} />
      </Field>
      <Field label={tx.colors.replace(" *", "") + (isRequired("colors") ? " *" : "")} hint={fieldError("colors") ?? tx.colorsHint}>
        <input name="colors" defaultValue={values?.["Couleurs"]} className={inputClass} required={isRequired("colors")} />
      </Field>
      <Field label={tx.references.replace(" *", "") + (isRequired("references") ? " *" : locale === "en" ? " (optional)" : " (facultatif)")} hint={fieldError("references") ?? tx.referencesHint}>
        <textarea name="references" defaultValue={values?.["Références"]} rows={2} className={inputClass} required={isRequired("references")} />
      </Field>
      {/* Avec des créations achetées, leurs blocs remplacent « Éléments à inclure » (une réponse déjà donnée est conservée) */}
      {showElements ? <Field label={tx.elements.replace(" *", "") + (isRequired("elements") ? " *" : "")} hint={fieldError("elements") ?? tx.elementsHint}>
        <textarea name="elements" defaultValue={values?.["Éléments à inclure"]} rows={3} className={inputClass} required={isRequired("elements")} />
      </Field> : values?.["Éléments à inclure"] && <input type="hidden" name="elements" value={values["Éléments à inclure"]} />}
      </fieldset>
      </div>
      {purchasedProducts.length > 0 && <section className={`space-y-5 ${sectionClass}`}>
        <h2 className="flex items-center gap-3 font-display text-lg font-bold"><span aria-hidden className="text-gradient text-xl font-bold tabular-nums">03</span>{locale === "en" ? "Your creations" : "Tes créations"}</h2>
        <div className="space-y-2">
          <p className="text-sm text-foreground/75" role="status">{locale === "en" ? `${completed} of ${creationNames.length} creations filled in` : `${completed} création${completed === 1 ? "" : "s"} sur ${creationNames.length} renseignée${completed === 1 ? "" : "s"}`}</p>
          <progress value={completed} max={creationNames.length} aria-label={locale === "en" ? "Creation progress" : "Progression des créations"} className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-border [&::-webkit-progress-value]:bg-accent [&::-moz-progress-bar]:bg-accent" />
        </div>
        {purchasedProducts.map((line, index) => {
          const en = locale === "en";
          const optional = optionalProducts.includes(line);
          const saved = values?.[`Création ${index + 1} : ${line}`];
          const parts = productBriefParts(line);
          // Titre du bloc selon l'offre, puis le produit commandé (et ce qu'il inclut) en sous-titre, puis la consigne
          const block = productBriefBlock(line, locale);
          const [name, ...detail] = line.split(" — ");
          const included = parts ? `${parts.length} ${/emote/i.test(line) ? (en ? "emotes included" : "emotes incluses") : /panneau|panel/i.test(line) ? (en ? "panels included" : "panneaux inclus") : en ? "alerts included" : "alertes incluses"}` : detail.join(" — ");
          const names = parts?.map((_, j) => productBriefFieldName(index, j)) ?? [productBriefFieldName(index)];
          const filled = names.filter((name) => answers[name]?.trim()).length;
          const header = <div className="mb-2">
            <h3 className="font-display text-xl font-bold">{block.title}</h3>
            <span className="mt-1 block text-sm text-muted">{[trOfferName(locale, name), included].filter(Boolean).join(" · ")}{optional && (en ? " (optional)" : " (facultatif)")}</span>
          </div>;
          // Séparateur pleine largeur entre deux créations
          const separated = index > 0 ? sectionClass : "";
          // Le séparateur est sur un conteneur : une bordure de fieldset passerait au milieu de la légende
          const savedParts = splitProductBrief(line, saved);
          const content = <fieldset aria-label={block.title}>
            {purchasedProducts.length === 1 && header}
            <p className="text-sm text-foreground/80">{block.hint}</p>
            {!parts ? <><textarea name={productBriefFieldName(index)} aria-label={line} aria-invalid={invalidFields.includes(productBriefFieldName(index))} required={!optional} rows={3} defaultValue={saved} placeholder={block.example} className={`mt-3 ${briefInputClass}`} />{fieldError(productBriefFieldName(index)) && <p className="mt-1 text-sm text-rose-300">{fieldError(productBriefFieldName(index))}</p>}</> : <div className="mt-4 space-y-3">
              {parts.map((part, j) => {
                const id = `${productBriefFieldName(index, j)}-field`;
                return <div key={j} className="grid gap-2 sm:grid-cols-[7.5rem_1fr] sm:gap-3">
                  <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold sm:pt-3 sm:items-start">
                    <span aria-hidden className="size-2 shrink-0 rounded-full bg-accent sm:mt-1.5" />
                    <span className="whitespace-nowrap">{en ? part.labelEn : part.label}{!optional && <span aria-hidden className="ml-0.5 text-accent">*</span>}</span>
                  </label>
                  <div><textarea id={id} name={productBriefFieldName(index, j)} aria-invalid={invalidFields.includes(productBriefFieldName(index, j))} aria-describedby={fieldError(productBriefFieldName(index, j)) ? `${id}-error` : undefined} required={!optional} rows={2} defaultValue={savedParts[j]} placeholder={en ? part.exampleEn : part.example} className={briefInputClass} />{fieldError(productBriefFieldName(index, j)) && <p id={`${id}-error`} className="mt-1 text-sm text-rose-300">{fieldError(productBriefFieldName(index, j))}</p>}</div>
                </div>;
              })}
            </div>}
          </fieldset>;
          return <div key={index} className={separated}>{purchasedProducts.length > 1 ? <details open={index === 0} className="group">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden"><div className="flex items-start justify-between gap-3">{header}<span className="mt-1 shrink-0 text-accent"><span className="block group-open:hidden"><MaterialIcon name="keyboard_arrow_down" className="size-6" /></span><span className="hidden group-open:block"><MaterialIcon name="keyboard_arrow_up" className="size-6" /></span></span></div><p className="mb-4 text-sm text-accent">{filled}/{names.length} {en ? "filled in" : "renseignées"}</p></summary>
            {content}
          </details> : content}</div>;
        })}
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
      <div className={sectionClass}>
      <h2 className="mb-4 font-display text-lg font-bold">{locale === "en" ? "Final details" : "Dernières précisions"}<span className="ml-2 text-sm font-normal text-muted">{!isRequired("notes") && !isRequired("deadline") && (locale === "en" ? "Optional" : "Facultatif")}</span></h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <DatePicker defaultValue={values?.["Date souhaitée"]} name="deadline" label={tx.deadline} locale={locale} />
        <Field label={tx.notes.replace(" *", "") + (isRequired("notes") ? " *" : "")} hint={fieldError("notes")}>
          <input name="notes" defaultValue={values?.["Remarques"]} className={inputClass} required={isRequired("notes")} />
        </Field>
      </div>
      </div>
      <FormStatus state={state} />
      <p id="brief-missing" role="status" className="text-sm leading-relaxed text-foreground/80">{missing.length ? (locale === "en" ? "Complete the required fields marked * before sending." : "Complète les champs obligatoires marqués d’un * avant l’envoi.") : locale === "en" ? "Your brief is ready to send." : "Ton brief est prêt à être envoyé."}</p>
      <button
        type="submit"
        disabled={pending}
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
