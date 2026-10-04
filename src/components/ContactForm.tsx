"use client";

import { useActionState } from "react";
import { sendContact } from "@/app/actions";
import { budgets, identityLevels, MAX_REFERENCES, platforms, providedAssets, requestTypes, styles } from "@/lib/contact-form";
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
      {/* Pot de miel anti-spam, invisible pour les humains */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <Section step="01" title="Toi">
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
      </Section>

      <Section step="02" title="Ton projet">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Type de demande">
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
        <Chips legend="Plateforme(s) concernée(s)" name="platforms" choices={platforms} />
        <Field label="Date souhaitée / deadline">
          <input name="deadline" placeholder="Ex. avant le 15 novembre, pour mon anniversaire de chaîne…" maxLength={100} className={inputClass} />
        </Field>
      </Section>

      <Section step="03" title="Ton univers">
        <Chips legend="As-tu déjà une identité visuelle ?" name="identity" choices={identityLevels} type="radio" />
        <Chips legend="As-tu déjà des éléments à fournir ?" name="assets" choices={providedAssets} />
        <Chips legend="Style recherché" name="style" choices={styles} hint="Plusieurs choix possibles." />
        <Field label="Autre style (facultatif)">
          <input name="styleOther" placeholder="Ex. cyberpunk pastel, cosy, horreur…" maxLength={200} className={inputClass} />
        </Field>
        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium">Références / inspirations</legend>
          <p className="-mt-0.5 mb-2 text-xs text-muted">Jusqu&apos;à {MAX_REFERENCES} liens : chaînes, Pinterest, Behance, images…</p>
          <div className="space-y-2">
            {Array.from({ length: MAX_REFERENCES }, (_, i) => (
              <input key={i} name="references" type="url" placeholder="https://…" aria-label={`Référence ${i + 1}`} className={inputClass} />
            ))}
          </div>
        </fieldset>
      </Section>

      {optionChoices.length > 0 && (
        <section className="border-t border-border pt-6">
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
        </section>
      )}

      <Section step="04" title="Parle-moi de ton projet">
        <Field label="Ton projet *">
          <textarea
            name="message"
            required
            minLength={10}
            rows={8}
            placeholder="Ce dont tu as besoin, l'ambiance de ta chaîne, ce que tu aimes (ou pas)…"
            className={inputClass}
          />
        </Field>
      </Section>

      <FormStatus state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3 font-semibold text-background transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
