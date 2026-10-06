import Link from "next/link";
import { TranslationInput, TranslationTabs } from "@/components/admin/TranslationTabs";
import { translationValues } from "@/lib/admin-translations";
import { documentKey, type DocumentField } from "@/lib/editable-document";
import type { Locale } from "@/lib/i18n";

export function PageContentEditor({ page, defaults, stored, action, formatted = false }: {
  page: string;
  defaults: Record<Locale, DocumentField[]>;
  stored: unknown;
  action: (form: FormData) => Promise<void>;
  formatted?: boolean;
}) {
  const values = stored && typeof stored === "object" ? stored as Record<string, unknown> : {};
  const english = Object.fromEntries(defaults.en.map((field) => [field.key, field.value]));
  const fields = [...defaults.fr, ...defaults.en.filter((field) => !defaults.fr.some((f) => f.key === field.key)).map((field) => ({ ...field, value: "" }))];
  const groups = Map.groupBy(fields, (field) => field.section);
  const customized = Object.keys(values).some((key) => key.startsWith(`page:${page}:`));
  return (
    <TranslationTabs stored={translationValues(stored)}>
      <div className="mb-5 flex flex-wrap gap-4 text-sm">
        <Link href={`/${page}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Voir la page en français ↗</Link>
        <Link href={`/en/${page}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Voir la page en anglais ↗</Link>
      </div>
      {formatted && <p className="mb-6 max-w-3xl text-xs text-muted">Mise en forme : **texte en gras**, [texte du lien](adresse), et retours à la ligne. Les éléments entre doubles accolades restent liés aux informations du site et aux réglages.</p>}
      <form action={action} className="space-y-6">
        <input type="hidden" name="page" value={page} />
        {[...groups].map(([section, sectionFields]) => (
          <section key={section} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="font-semibold">{section}</h2>
            <div className="mt-4 space-y-4">
              {sectionFields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1 block text-xs text-muted">{field.label}</span>
                  <TranslationInput name={`p:${field.key}`} translationKey={documentKey(page, "en", field.key)}
                    defaultValue={typeof values[documentKey(page, "fr", field.key)] === "string" ? values[documentKey(page, "fr", field.key)] as string : field.value}
                    englishDefault={english[field.key] ?? ""} multiline={field.multiline} rows={field.multiline ? 4 : undefined} maxLength={12000}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </label>
              ))}
            </div>
          </section>
        ))}
        <div className="sticky bottom-4 rounded-2xl border border-border bg-surface/95 p-4 backdrop-blur">
          <button type="submit" className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110">Enregistrer les textes</button>
        </div>
      </form>
      {customized && <form action={action} className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted">
        <input type="hidden" name="page" value={page} /><input type="hidden" name="reset" value="1" />
        <label className="flex items-center gap-1"><input type="checkbox" name="confirm" required /> confirmer</label>
        <button type="submit" className="rounded-full border border-border px-3 py-1.5 hover:text-foreground">Revenir aux textes d’origine dans les deux langues</button>
      </form>}
    </TranslationTabs>
  );
}
