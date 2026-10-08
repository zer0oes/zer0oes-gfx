"use client";

import { BriefForm } from "./BriefForm";
import { sendPaidQuoteBrief } from "@/app/(livraison)/devis/actions";

export function QuoteBrief({ token, email, request, deliverables, optionalProducts = [], requiredFields }: { token: string; email: string; request: Record<string, string>; deliverables: string[]; optionalProducts?: string[]; requiredFields?: string[] }) {
  return <div className="-mx-4 mt-5 border-t border-border px-4 pt-5 sm:-mx-5 sm:px-5">
    <BriefForm requiredFields={requiredFields} fullWidthSections optionalProducts={optionalProducts} submitAction={sendPaidQuoteBrief} quoteToken={token} email={email} overlayCount={null} purchasedProducts={deliverables} portalUrl={`/commande/${token}`} defaultBrief={{ ...request, Pseudo: request.Pseudo || request.Nom, "Univers / ambiance": request["Univers / ambiance"] || request.Projet || request.Message || "", Références: request.Références || request.Inspirations || "" }} />
  </div>;
}
