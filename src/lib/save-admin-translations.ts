import "server-only";
import { translationsFromForm } from "@/lib/admin-translations";
import { getStore } from "@/lib/store";

export async function saveAdminTranslations(form: FormData, scope: string, fields: string[]) {
  const mapping = Object.fromEntries(fields.map((field) => [field, `translation:${scope}:${field}`]));
  await saveTranslationFields(form, mapping);
}

export async function saveTranslationFields(form: FormData, mapping: Record<string, string>) {
  if (!Object.keys(mapping).some((name) => form.has(`en:${name}`))) return;
  const store = getStore();
  await store.saveHomeContent(translationsFromForm(await store.getHomeContent(), form, mapping));
}
