"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { aboutFields } from "@/lib/about-content";
import { saveDocumentFields } from "@/lib/editable-document";
import { isLegalPage, legalDocument } from "@/lib/legal-content";
import { getStore } from "@/lib/store";

export async function savePageContentAction(form: FormData) {
  await requireAdmin();
  const page = form.get("page");
  if (page !== "a-propos" && !isLegalPage(page)) throw new Error("Page inconnue.");
  const back = page === "a-propos" ? "/admin/a-propos" : `/admin/contenu-legal?onglet=${page}`;
  const store = getStore();
  const stored = await store.getHomeContent();
  if (form.get("reset") === "1") {
    if (form.get("confirm") !== "on") redirect(`${back}${back.includes("?") ? "&" : "?"}erreur=Confirmation+requise`);
    const content = stored && typeof stored === "object" ? stored : {};
    await store.saveHomeContent(Object.fromEntries(Object.entries(content).filter(([key, value]) => !key.startsWith(`page:${page}:`) && typeof value === "string")));
  } else {
    const { settings } = await store.getCatalog();
    const defaults = page === "a-propos" ? { fr: aboutFields("fr"), en: aboutFields("en") }
      : { fr: legalDocument(page, "fr", settings).fields, en: legalDocument(page, "en", settings).fields };
    await store.saveHomeContent(saveDocumentFields(stored, page, form, defaults));
  }
  revalidatePath("/", "layout");
  redirect(`${back}${back.includes("?") ? "&" : "?"}enregistre=1`);
}
