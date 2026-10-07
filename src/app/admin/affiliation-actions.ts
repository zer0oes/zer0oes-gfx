"use server";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
function finish(error?: string): never {
  revalidatePath("/admin/offres");
  redirect(`/admin/offres?onglet=affiliation&${error ? `erreur=${encodeURIComponent(error)}` : "enregistre=1"}`);
}
const field = (f: FormData, key: string, max: number) => (f.get(key)?.toString() ?? "").trim().slice(0, max);
function id(f: FormData) {
  const value = field(f, "id", 36);
  if (value && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new Error("Identifiant invalide.");
  return value || randomUUID();
}
export async function saveAffiliateAction(f: FormData) {
  await requireAdmin();
  try {
    const name = field(f, "name", 120), url = field(f, "url", 2000);
    if (!name) throw new Error("Indique le nom du partenaire.");
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Utilise un lien HTTPS sans identifiants.");
    await getStore().saveAffiliateLink({ id: id(f), name, url: parsed.href, notes: field(f, "notes", 2000) });
  } catch (e) { finish(e instanceof Error ? e.message : "Enregistrement impossible."); }
  finish();
}
export async function deleteAffiliateAction(f: FormData) {
  await requireAdmin();
  try {
    if (f.get("confirm") !== "on") throw new Error("Confirme la suppression.");
    await getStore().deleteAffiliateLink(id(f));
  } catch (e) { finish(e instanceof Error ? e.message : "Suppression impossible."); }
  finish();
}
