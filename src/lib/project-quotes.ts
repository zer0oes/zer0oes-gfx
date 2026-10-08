import "server-only";
import { randomUUID } from "node:crypto";
import { newDeliveryToken } from "@/lib/delivery";
import { getStore } from "@/lib/store";
import type { ProjectQuote } from "@/lib/quotes";

export async function recordQuoteRequest(request: { name: string; email: string; fields: Record<string, string> }, locale: "fr" | "en") {
  const now = new Date().toISOString();
  const catalog = await getStore().getCatalog();
  const offer = (request.fields["Offre envisagée"] ?? "").trim().toLocaleLowerCase("fr");
  const aLaCarte = (offer === "logo" && request.fields["Type de demande"] === "Demande de devis") || (offer !== "" && catalog.options.some((option) => {
    const name = option.name.trim().toLocaleLowerCase("fr");
    return name === offer || (request.fields["Type de demande"] === "Demande de devis" && name.startsWith(`${offer} `));
  }));
  const q: ProjectQuote = { id: randomUUID(), token: newDeliveryToken(), createdAt: now, updatedAt: now,
    name: request.name, email: request.email, locale, request: request.fields, status: "demande",
    title: "", description: "", deliverables: [], totalPrice: 0, validUntil: "", revisionsIncluded: aLaCarte ? 1 : 2 };
  await getStore().createQuote(q);
  return q;
}
