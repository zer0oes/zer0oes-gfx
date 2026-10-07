"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { sendContact, sendMessage } from "@/app/actions";
import { href, type Locale } from "@/lib/i18n";
import type { OptionChoice } from "@/lib/pricing";
import {
  budgets,
  choiceLabel,
  identityLevels,
  MAX_REFERENCES,
  messageSubjects,
  platforms,
  providedAssets,
  referralSources,
  requestTypes,
  styles,
} from "@/lib/contact-form";
import { useLocale } from "./I18nProvider";
import { Field, FormStatus, OptionsField, inputClass } from "./ui";

// Textes des deux formulaires. Les valeurs envoyées (types, budgets, plateformes…) restent
// en français pour le serveur et les e-mails reçus par Aurore ; seul l'affichage est traduit.
const texts = {
  fr: {
    name: "Nom ou pseudo *",
    email: "E-mail *",
    project: "Ton projet",
    channel: "Lien de ta chaîne",
    type: "Type de projet",
    budget: "Budget indicatif",
    budgetUnknown: "Je ne sais pas encore",
    platforms: "Plateforme(s)",
    deadline: "Date souhaitée / deadline",
    deadlinePlaceholder: "Ex. avant le 15 novembre, pour l'anniversaire de ma chaîne…",
    universe: "Ton univers visuel",
    identity: "As-tu déjà une identité visuelle ?",
    style: "Style recherché",
    styleHint: "Plusieurs choix possibles.",
    styleOther: "Autre style (facultatif)",
    styleOtherPlaceholder: "Ex. cyberpunk pastel, cosy, horreur…",
    colors: "Couleurs à privilégier / éviter (facultatif)",
    colorsPlaceholder: "Ex. violet et bleu nuit, pas de jaune",
    references: "Liens d'inspiration",
    referencesHint: `Un lien par ligne, ${MAX_REFERENCES} maximum : chaînes, Pinterest, Behance, images…`,
    have: "Ce que tu as déjà",
    assets: "Éléments disponibles",
    filesLater: "Je pourrai envoyer mes fichiers après la prise de contact",
    filesLaterHint: "Pas besoin de les joindre maintenant : on s'organise ensemble ensuite.",
    need: "Besoin précis",
    options: "Options complémentaires",
    optional: "facultatif",
    show: "Voir ↓",
    hide: "Masquer ↑",
    optionsLegend: "Ce qui pourrait s'ajouter à ton projet",
    message: "Dis-moi ce que tu as en tête *",
    messagePlaceholder:
      "Décris-moi ce que tu imagines, l'ambiance recherchée, les éléments indispensables et tout ce qui peut m'aider à comprendre ton projet.",
    referral: "Comment m'as-tu trouvée ?",
    consentProject: "répondre à ma demande et préparer un devis",
    noteProject: "Réponse sous 48 h ouvrées. Je reviendrai vers toi avec une première estimation ou quelques questions si besoin.",
    subject: "Sujet",
    simpleMessage: "Message *",
    consentMessage: "répondre à mon message",
    noteMessage: "Réponse sous 48 h ouvrées.",
    consent: (purpose: string) => `J'accepte que mes informations soient utilisées pour ${purpose}. *`,
    privacy: "Politique de confidentialité",
    sending: "Envoi…",
    send: "Envoyer",
  },
  en: {
    name: "Name or nickname *",
    email: "Email *",
    project: "Your project",
    channel: "Link to your channel",
    type: "Project type",
    budget: "Approximate budget",
    budgetUnknown: "I don't know yet",
    platforms: "Platform(s)",
    deadline: "Preferred date / deadline",
    deadlinePlaceholder: "E.g. before 15 November, for my channel's anniversary…",
    universe: "Your visual universe",
    identity: "Do you already have a visual identity?",
    style: "Desired style",
    styleHint: "Several choices possible.",
    styleOther: "Other style (optional)",
    styleOtherPlaceholder: "E.g. pastel cyberpunk, cosy, horror…",
    colors: "Colours to favour / avoid (optional)",
    colorsPlaceholder: "E.g. purple and midnight blue, no yellow",
    references: "Inspiration links",
    referencesHint: `One link per line, ${MAX_REFERENCES} maximum: channels, Pinterest, Behance, images…`,
    have: "What you already have",
    assets: "Available assets",
    filesLater: "I can send my files after we get in touch",
    filesLaterHint: "No need to attach them now: we'll sort it out together afterwards.",
    need: "Specific needs",
    options: "Additional add-ons",
    optional: "optional",
    show: "Show ↓",
    hide: "Hide ↑",
    optionsLegend: "What could be added to your project",
    message: "Tell me what you have in mind *",
    messagePlaceholder: "Describe what you imagine, the mood you're after, the must-have elements and anything that can help me understand your project.",
    referral: "How did you find me?",
    consentProject: "answer my request and prepare a quote",
    noteProject: "Reply within 2 business days. I'll get back to you with a first estimate or a few questions if needed.",
    subject: "Subject",
    simpleMessage: "Message *",
    consentMessage: "answer my message",
    noteMessage: "Reply within 2 business days.",
    consent: (purpose: string) => `I agree that my information may be used to ${purpose}. *`,
    privacy: "Privacy policy",
    sending: "Sending…",
    send: "Send",
  },
} satisfies Record<Locale, Record<string, unknown>>;

// Choix rapides en pastilles (cases à cocher ou boutons radio stylés)
function Chips({ legend, name, choices, type = "checkbox", hint }: { legend: string; name: string; choices: string[]; type?: "checkbox" | "radio"; hint?: string }) {
  const locale = useLocale();
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">{legend}</legend>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <label key={c} className="cursor-pointer">
            <input type={type} name={name} value={c} className="peer sr-only" />
            <span className="inline-block rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-muted transition peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:text-foreground">
              {choiceLabel(locale, c)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Section({ step, title, children }: { step?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="relative space-y-5 pt-6 before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border first-of-type:pt-0 first-of-type:before:hidden sm:before:-left-8 sm:before:-right-8">
      {title && <h2 className="flex items-baseline gap-3 font-display text-lg font-bold">
        {step && <span className="text-sm text-gradient">{step}</span>}
        {title}
      </h2>}
      {children}
    </section>
  );
}

// Consentement RGPD, obligatoire sur les deux formulaires
function Consent({ purpose }: { purpose: string }) {
  const locale = useLocale();
  const tx = texts[locale];
  return (
    <label className="flex items-start gap-2 text-sm text-muted">
      <input type="checkbox" name="consent" value="1" required className="mt-1 accent-[var(--accent)]" />
      <span>
        {tx.consent(purpose)}{" "}
        <Link href={href(locale, "/confidentialite")} className="text-accent underline-offset-4 hover:underline">
          {tx.privacy}
        </Link>
      </span>
    </label>
  );
}

function Submit({ pending, note }: { pending: boolean; note: string }) {
  const tx = texts[useLocale()];
  return (
    <div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? tx.sending : tx.send}
      </button>
      <p className="mt-3 text-sm text-muted">{note}</p>
    </div>
  );
}

// Pot de miel anti-spam, invisible pour les humains ; langue du visiteur pour les réponses du serveur
function Hidden() {
  const locale = useLocale();
  return (
    <>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input type="hidden" name="lang" value={locale} />
    </>
  );
}

export function ContactForm({
  defaultType = "Projet sur mesure",
  optionChoices,
  selectedOffer,
  offerChoices,
  selectedOptionId,
}: {
  selectedOptionId?: string;
  defaultType?: string;
  selectedOffer?: string;
  offerChoices: string[];
  optionChoices: OptionChoice[];
}) {
  const [state, action, pending] = useActionState(sendContact, null);
  const [subject, setSubject] = useState(defaultType);
  const [offer, setOffer] = useState(selectedOffer ?? "");
  const isOfferQuestion = subject === "Question sur une offre";
  const isProject = subject === "Projet sur mesure" || subject === "Devis Univers complet";
  const locale = useLocale();
  const tx = texts[locale];

  const subjectCopy: Record<string, { fr: [string, string]; en: [string, string] }> = {
    "Question sur une offre": {
      fr: ["Ta question *", "Indique l'offre qui t'intéresse et ce que tu aimerais savoir. Si tu hésites entre plusieurs packs, dis-moi ce dont tu as besoin."],
      en: ["Your question *", "Tell me which package interests you and what you would like to know. If you are choosing between packages, describe what you need."],
    },
    "Suivi d'une commande": {
      fr: ["Ton message *", "Indique la référence de ta commande si tu l'as, puis explique ta question sur le projet en cours."],
      en: ["Your message *", "Include your order reference if you have it, then tell me your question about the ongoing project."],
    },
    "Collaboration / partenariat": {
      fr: ["Ton idée de collaboration *", "Présente-toi et décris ton idée de collaboration : concept, objectifs et calendrier envisagé."],
      en: ["Your collaboration idea *", "Introduce yourself and describe your collaboration idea: concept, goals and proposed timeline."],
    },
    "Autre demande": {
      fr: ["Ton message *", "Dis-moi ce qui t'amène et comment je peux t'aider."],
      en: ["Your message *", "Tell me what brings you here and how I can help."],
    },
  };
  const [messageLabel, messagePlaceholder] = subjectCopy[subject]?.[locale] ?? [tx.message, tx.messagePlaceholder];

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-8">
      <Hidden />

      {!isOfferQuestion && selectedOffer && <><input type="hidden" name="offer" value={selectedOffer} /><p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">{locale === "fr" ? "Offre envisagée : " : "Package you're considering: "}<strong>{selectedOffer}</strong></p></>}
      <p className="text-sm text-muted">{locale === "fr" ? "Ton nom, ton e-mail et quelques mots suffisent pour commencer. Les détails peuvent attendre notre échange." : "Your name, email and a few words are enough to get started. We can discuss the details afterwards."}</p>
      <Field label={tx.subject}>
        <select name="type" className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)}>
          {requestTypes.filter((value) => value !== "Devis Univers complet" || defaultType === value).map((value) => (
            <option key={value} value={value}>{choiceLabel(locale, value)}</option>
          ))}
        </select>
      </Field>
      {isOfferQuestion && (
        <Field label={locale === "fr" ? "Offre concernée" : "Package you are asking about"}>
          <select name="offer" className={inputClass} value={offer} onChange={(event) => setOffer(event.target.value)}>
            <option value="">{locale === "fr" ? "Choisir une offre" : "Choose a package"}</option>
            {Array.from(new Set([...offerChoices, ...(selectedOffer ? [selectedOffer] : [])])).map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </Field>
      )}
      {subject === "Suivi d'une commande" && (
        <Field label={locale === "fr" ? "Numéro de commande (facultatif)" : "Order number (optional)"}>
          <input name="orderNumber" type="text" maxLength={100} autoComplete="off" placeholder={locale === "fr" ? "Le numéro indiqué dans ton e-mail de confirmation" : "The number in your confirmation email"} className={inputClass} />
        </Field>
      )}
      <Section step={isProject ? "01" : undefined} title={isProject ? tx.project : undefined}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={tx.name}>
            <input name="name" required autoComplete="nickname" className={inputClass} />
          </Field>
          <Field label={tx.email}>
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </Field>
        </div>
        <label className="block">
          <span className="mb-1.5 block font-display text-lg font-bold">{messageLabel}</span>
          <textarea name="message" required minLength={10} rows={4} placeholder={messagePlaceholder} className={inputClass} />
        </label>
      </Section>
      {isProject && <details className="relative pt-6 before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border sm:before:-left-8 sm:before:-right-8">
        <summary className="cursor-pointer font-semibold">{locale === "fr" ? "Préciser mon projet (facultatif)" : "Add project details (optional)"}</summary>
        <div className="mt-6 space-y-6">
          <Section>
            <Field label={tx.channel}>
              <input name="channel" type="url" placeholder="https://twitch.tv/…" className={inputClass} />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={tx.budget}>
                <select name="budget" className={inputClass} defaultValue="">
                  <option value="">{tx.budgetUnknown}</option>
                  {budgets.map((b) => (
                    <option key={b} value={b}>
                      {choiceLabel(locale, b)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Chips legend={tx.platforms} name="platforms" choices={platforms} />
            <Field label={tx.deadline}>
              <input name="deadline" placeholder={tx.deadlinePlaceholder} maxLength={100} className={inputClass} />
            </Field>
          </Section>

          <Section step="02" title={tx.universe}>
            <Chips legend={tx.identity} name="identity" choices={identityLevels} type="radio" />
            <Chips legend={tx.style} name="style" choices={styles} hint={tx.styleHint} />
            <Field label={tx.styleOther}>
              <input name="styleOther" placeholder={tx.styleOtherPlaceholder} maxLength={200} className={inputClass} />
            </Field>
            <Field label={tx.colors}>
              <input name="colors" placeholder={tx.colorsPlaceholder} maxLength={300} className={inputClass} />
            </Field>
            <Field label={tx.references} hint={tx.referencesHint}>
              <textarea name="references" rows={3} placeholder={"https://…\nhttps://…"} className={inputClass} />
            </Field>
          </Section>

          <Section step="03" title={tx.have}>
            <Chips legend={tx.assets} name="assets" choices={providedAssets} />
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="filesLater" value="1" className="mt-0.5 accent-[var(--accent)]" />
              <span>
                {tx.filesLater}
                <span className="block text-xs text-muted">{tx.filesLaterHint}</span>
              </span>
            </label>
          </Section>

          <Section step="04" title={tx.need}>
            {optionChoices.length > 0 && (
              <details open={selectedOptionId ? true : undefined} className="group rounded-xl border border-border bg-background/40 px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="font-medium">{tx.options}</span>
                    <span className="ml-2 text-muted">{tx.optional}</span>
                  </span>
                  <span className="text-accent group-open:hidden">{tx.show}</span>
                  <span className="hidden text-accent group-open:inline">{tx.hide}</span>
                </summary>
                <div className="mt-4">
                  <OptionsField legend={tx.optionsLegend} options={optionChoices} selectedIds={selectedOptionId ? [selectedOptionId] : []} />
                </div>
              </details>
            )}

          </Section>

          <div className="relative pt-6 before:absolute before:-left-6 before:-right-6 before:top-0 before:border-t before:border-border sm:before:-left-8 sm:before:-right-8">
            <Chips legend={tx.referral} name="referral" choices={referralSources} type="radio" />
          </div>

        </div>
      </details>}
      <Consent purpose={isProject ? tx.consentProject : tx.consentMessage} />
      <FormStatus state={state} />
      <Submit pending={pending} note={isProject ? tx.noteProject : tx.noteMessage} />
    </form>
  );
}

// Onglet « Message simple » : question, collaboration…
export function MessageForm() {
  const [state, action, pending] = useActionState(sendMessage, null);
  const locale = useLocale();
  const tx = texts[locale];

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      <Hidden />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={tx.name}>
          <input name="name" required autoComplete="nickname" className={inputClass} />
        </Field>
        <Field label={tx.email}>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
      </div>
      <Field label={tx.subject}>
        <select name="subject" className={inputClass} defaultValue={messageSubjects[0]}>
          {messageSubjects.map((s) => (
            <option key={s} value={s}>
              {choiceLabel(locale, s)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tx.simpleMessage}>
        <textarea name="message" required minLength={10} rows={7} className={inputClass} />
      </Field>
      <Consent purpose={tx.consentMessage} />
      <FormStatus state={state} />
      <Submit pending={pending} note={tx.noteMessage} />
    </form>
  );
}
