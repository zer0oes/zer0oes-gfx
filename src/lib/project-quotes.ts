import "server-only";
import { randomUUID } from "node:crypto";
import { newDeliveryToken } from "@/lib/delivery";
import { getStore } from "@/lib/store";
import type { ProjectQuote } from "@/lib/quotes";
import { trDeep } from "@/lib/translations-en";
import { launchRates } from "@/lib/launch-offer";

export async function recordQuoteRequest(request: { name: string; email: string; fields: Record<string, string> }, locale: "fr" | "en") {
  const now = new Date().toISOString();
  const [catalog, launch] = await Promise.all([getStore().getCatalog(), getStore().getLaunchState()]);
  const rates = launchRates(launch);
  const offer = (request.fields["Offre envisagée"] ?? "").trim().toLocaleLowerCase("fr");
  const translated = trDeep(locale, catalog);
  const isPack = [...catalog.packs, ...translated.packs].some((p) => p.name.trim().toLocaleLowerCase("fr") === offer);
  const isOption = [...catalog.options, ...translated.options].some((o) => o.name.trim().toLocaleLowerCase("fr") === offer);
  const customCreation = ["Projet sur mesure", "Demande de devis"].includes(request.fields["Type de demande"]);
  const aLaCarte = (offer === "logo" && request.fields["Type de demande"] === "Demande de devis") || (offer !== "" && catalog.options.some((option) => {
    const name = option.name.trim().toLocaleLowerCase("fr");
    return name === offer || (request.fields["Type de demande"] === "Demande de devis" && name.startsWith(`${offer} `));
  }));
  const q: ProjectQuote = { id: randomUUID(), token: newDeliveryToken(), createdAt: now, updatedAt: now,
    name: request.name, email: request.email, locale, request: request.fields, status: "demande",
    title: "", description: "", deliverables: [], totalPrice: 0, validUntil: "", revisionsIncluded: aLaCarte ? 1 : 2,
    ...(isPack ? { launchPercent: rates.packs } : isOption || customCreation ? { launchPercent: rates.options } : {}) };
  await getStore().createQuote(q);
  return q;
}
