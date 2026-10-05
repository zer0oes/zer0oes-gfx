"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContact, sendMessage } from "@/app/actions";
import { budgets, identityLevels, MAX_REFERENCES, messageSubjects, platforms, providedAssets, referralSources, requestTypes, styles } from "@/lib/contact-form";
import { Field, FormStatus, OptionsField, inputClass } from "./ui";

// Choix rapides en pastilles (cases à cocher ou boutons radio stylés)
function Chips({ legend, name, choices, type = "checkbox", hint }: { legend: string; name: string; choices: string[]; type?: "checkbox" | "radio"; hint?: string }) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium">{legend}</legend>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-muted">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {choices.map((c) => (
          <label key={c} className="cursor-pointer">
            <input type={type} name={name} value={c} className="peer sr-only" />
            <span className="inline-block rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-muted transition peer-checked:border-accent peer-checked:bg-accent/15 peer-checked:text-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:text-foreground">
              {c}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5 border-t border-border pt-6 first-of-type:border-t-0 first-of-type:pt-0">
      <h2 className="flex items-baseline gap-3 font-display text-lg font-bold">
        <span className="text-sm text-gradient">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Consentement RGPD, obligatoire sur les deux formulaires
function Consent({ purpose }: { purpose: string }) {
  return (
    <label className="flex items-start gap-2 text-sm text-muted">
      <input type="checkbox" name="consent" value="1" required className="mt-1 accent-[var(--accent)]" />
      <span>
        J&apos;accepte que mes informations soient utilisées pour {purpose}. *{" "}
        <Link href="/confidentialite" className="text-accent underline-offset-4 hover:underline">
          Politique de confidentialité
        </Link>
      </span>
    </label>
  );
}

function Submit({ pending, note }: { pending: boolean; note: string }) {
  return (
    <div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
      <p className="mt-3 text-sm text-muted">{note}</p>
    </div>
  );
}

// Pot de miel anti-spam, invisible pour les humains
function Honeypot() {
  return <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />;
}

export function ContactForm({
  defaultType = "Projet sur mesure",
  optionChoices,
}: {
  defaultType?: string;
  optionChoices: { id: string; label: string }[];
}) {
  const [state, action, pending] = useActionState(sendContact, null);

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-8">
      <Honeypot />

      <Section step="01" title="Ton projet">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom ou pseudo *">
            <input name="name" required autoComplete="nickname" className={inputClass} />
          </Field>
          <Field label="E-mail *">
            <input name="email" type="email" required autoComplete="email" className={inputClass} />
          </Field>
        </div>
        <Field label="Lien de ta chaîne">
          <input name="channel" type="url" placeholder="https://twitch.tv/…" className={inputClass} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type de projet">
            <select name="type" className={inputClass} defaultValue={defaultType}>
              {requestTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Budget indicatif">
            <select name="budget" className={inputClass} defaultValue="">
              <option value="">Je ne sais pas encore</option>
              {budgets.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
        </div>
        <Chips legend="Plateforme(s)" name="platforms" choices={platforms} />
        <Field label="Date souhaitée / deadline">
          <input name="deadline" placeholder="Ex. avant le 15 novembre, pour l'anniversaire de ma chaîne…" maxLength={100} className={inputClass} />
        </Field>
      </Section>

      <Section step="02" title="Ton univers visuel">
        <Chips legend="As-tu déjà une identité visuelle ?" name="identity" choices={identityLevels} type="radio" />
        <Chips legend="Style recherché" name="style" choices={styles} hint="Plusieurs choix possibles." />
        <Field label="Autre style (facultatif)">
          <input name="styleOther" placeholder="Ex. cyberpunk pastel, cosy, horreur…" maxLength={200} className={inputClass} />
        </Field>
        <Field label="Couleurs à privilégier / éviter (facultatif)">
          <input name="colors" placeholder="Ex. violet et bleu nuit, pas de jaune" maxLength={300} className={inputClass} />
        </Field>
        <Field label="Liens d'inspiration" hint={`Un lien par ligne, ${MAX_REFERENCES} maximum : chaînes, Pinterest, Behance, images…`}>
          <textarea name="references" rows={3} placeholder={"https://…\nhttps://…"} className={inputClass} />
        </Field>
      </Section>

      <Section step="03" title="Ce que tu as déjà">
        <Chips legend="Éléments disponibles" name="assets" choices={providedAssets} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="filesLater" value="1" className="mt-0.5 accent-[var(--accent)]" />
          <span>
            Je pourrai envoyer mes fichiers après la prise de contact
            <span className="block text-xs text-muted">Pas besoin de les joindre maintenant : on s&apos;organise ensemble ensuite.</span>
          </span>
        </label>
      </Section>

      <Section step="04" title="Besoin précis">
        {optionChoices.length > 0 && (
          <details className="group rounded-xl border border-border bg-background/40 px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm [&::-webkit-details-marker]:hidden">
              <span>
                <span className="font-medium">Options complémentaires</span>
                <span className="ml-2 text-muted">facultatif</span>
              </span>
              <span className="text-accent group-open:hidden">Voir ↓</span>
              <span className="hidden text-accent group-open:inline">Masquer ↑</span>
            </summary>
            <div className="mt-4">
              <OptionsField legend="Ce qui pourrait s'ajouter à ton projet" options={optionChoices} />
            </div>
          </details>
        )}
        <label className="block">
          <span className="mb-1.5 block font-display text-lg font-bold">Dis-moi ce que tu as en tête *</span>
          <textarea
            name="message"
            required
            minLength={10}
            rows={9}
            placeholder="Décris-moi ce que tu imagines, l'ambiance recherchée, les éléments indispensables et tout ce qui peut m'aider à comprendre ton projet."
            className={inputClass}
          />
        </label>
      </Section>

      <div className="border-t border-border pt-6">
        <Chips legend="Comment m'as-tu trouvée ?" name="referral" choices={referralSources} type="radio" />
      </div>

      <Consent purpose="répondre à ma demande et préparer un devis" />
      <FormStatus state={state} />
      <Submit pending={pending} note="Réponse sous 48 h ouvrées. Je reviendrai vers toi avec une première estimation ou quelques questions si besoin." />
    </form>
  );
}

// Onglet « Message simple » : question, collaboration…
export function MessageForm() {
  const [state, action, pending] = useActionState(sendMessage, null);

  if (state?.ok) return <FormStatus state={state} />;

  return (
    <form action={action} className="space-y-5">
      <Honeypot />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nom ou pseudo *">
          <input name="name" required autoComplete="nickname" className={inputClass} />
        </Field>
        <Field label="E-mail *">
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </Field>
      </div>
      <Field label="Sujet">
        <select name="subject" className={inputClass} defaultValue={messageSubjects[0]}>
          {messageSubjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Message *">
        <textarea name="message" required minLength={10} rows={7} className={inputClass} />
      </Field>
      <Consent purpose="répondre à mon message" />
      <FormStatus state={state} />
      <Submit pending={pending} note="Réponse sous 48 h ouvrées." />
    </form>
  );
}
