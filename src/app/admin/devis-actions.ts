"use server";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { quoteEditable, quoteExpired, validQuoteProposal } from "@/lib/quotes";
import { sendToCustomer } from "@/lib/notify";
import { siteUrl } from "@/lib/site-url";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quoteBriefFields } from "@/lib/quote-brief";

export async function saveQuoteBriefRequirements(data: FormData) {
  await requireAdmin();
  const store = getStore();
  const q = await store.getQuote(String(data.get("id") ?? ""));
  if (!q || q.briefCompletedAt) redirect("/admin/devis");
  const selected = data.get("requiredDeliverablesMode") === "1"
    ? q.deliverables.filter((line) => !data.getAll("requiredDeliverable").map(String).includes(line))
    : data.getAll("optionalBrief").map(String);
  const required = data.getAll("requiredBrief").map(String);
  const next = { ...q, requiredBriefFields: quoteBriefFields.filter((field) => required.includes(field.id)).map((field) => field.id), optionalBriefDeliverables: q.deliverables.filter((line) => selected.includes(line)), updatedAt: new Date().toISOString() };
  if (!await store.saveQuoteMailState(next, String(data.get("updatedAt")))) redirect(`/admin/devis/${q.id}?erreur=conflit`);
  revalidatePath(`/admin/devis/${q.id}`); revalidatePath(`/commande/${q.token}`);
  if (q.orderId) revalidatePath(`/admin/commandes/${q.orderId}`);
  if (q.orderId && data.get("backToOrder") === "1") redirect(`/admin/commandes/${q.orderId}?brief=1`);
  redirect(`/admin/devis/${q.id}?brief=1#proposition`);
}

export async function deleteProjectQuote(data: FormData) {
  await requireAdmin();
  const id = String(data.get("id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) redirect("/admin/devis");
  if (data.get("confirm") !== "on") redirect(`/admin/devis/${id}`);
  const store = getStore();
  const q = await store.getQuote(id);
  if (!q) redirect("/admin/devis");
  if (!await store.deleteQuote(id, String(data.get("updatedAt") ?? ""))) redirect(`/admin/devis/${id}?erreur=suppression`);
  revalidatePath("/admin/devis");
  revalidatePath(`/admin/devis/${id}`);
  revalidatePath(`/devis/${q.token}`);
  redirect("/admin/devis?supprime=1");
}

export async function proposeProjectQuote(data: FormData) {
  await requireAdmin();
  const id = String(data.get("id") ?? "");
  const store = getStore();
  const q = await store.getQuote(id);
  if (!q || !quoteEditable(q)) redirect("/admin/devis");
  const rawPrice = String(data.get("price") ?? "").trim().replace(",", ".");
  const proposal = { ...q, title: String(data.get("title") ?? "").trim().slice(0, 200),
    paymentType: data.get("paymentType") === "acompte" ? "acompte" as const : "total" as const,
    depositPercent: data.get("paymentType") === "acompte" ? Number(data.get("depositPercent")) : 0,
    description: String(data.get("description") ?? "").trim().slice(0, 5000),
    deliverables: String(data.get("deliverables") ?? "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
    totalPrice: /^\d+(\.\d{1,2})?$/.test(rawPrice) ? Math.round(Number(rawPrice) * 100) : NaN,
    validUntil: String(data.get("validUntil") ?? ""), status: "propose" as const, updatedAt: new Date().toISOString() };
  if (!validQuoteProposal(proposal)) redirect(`/admin/devis/${id}?modifier=1&erreur=validation#proposition`);
  if (!await store.proposeQuote(proposal, String(data.get("updatedAt")))) redirect(`/admin/devis/${id}?modifier=1&erreur=conflit#proposition`);
  revalidatePath("/admin/devis"); revalidatePath(`/admin/devis/${id}`);
  revalidatePath(`/devis/${q.token}`);
  redirect(`/admin/devis/${id}?publie=1#proposition`);
}

export async function sendProjectQuote(data: FormData) {
  await requireAdmin();
  const store = getStore();
  const q = await store.getQuote(String(data.get("id") ?? ""));
  if (!q || q.status !== "propose" || q.sendingAt || quoteExpired(q)) redirect("/admin/devis");
  if (String(data.get("updatedAt")) !== q.updatedAt) redirect(`/admin/devis/${q.id}?erreur=conflit`);
  const sending = { ...q, sendingAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!await store.saveQuoteMailState(sending, q.updatedAt)) redirect(`/admin/devis/${q.id}?erreur=conflit`);
  let sent = false;
  try {
    const en = q.locale === "en";
    const result = await sendToCustomer({ to: q.email, subject: en ? "Your zer0oes gfx quote" : "Ton devis zer0oes gfx",
      text: `${en ? "Your proposal is ready. View the details and accept or decline it here:" : "Ta proposition est prête. Consulte le détail et accepte ou refuse le devis ici :"}\n${await siteUrl()}/devis/${q.token}` });
    sent = result.sent;
  } catch (e) { console.error(e); }
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await store.getQuote(q.id);
    if (!current || current.sendingAt !== sending.sendingAt) break;
    if (await store.saveQuoteMailState({ ...current, sendingAt: undefined,
      sentAt: sent ? current.sentAt ?? new Date().toISOString() : current.sentAt,
      updatedAt: new Date().toISOString() }, current.updatedAt)) break;
  }
  revalidatePath(`/admin/devis/${q.id}`);
  revalidatePath("/admin/devis");
  redirect(`/admin/devis/${q.id}?email=${sent ? "envoye" : "echec"}`);
}
