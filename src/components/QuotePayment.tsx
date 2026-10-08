"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const PaymentContext = createContext<{ payment: "total" | "acompte"; setPayment: (payment: "total" | "acompte") => void } | null>(null);

export function QuotePaymentProvider({ children }: { children: ReactNode }) {
  const [payment, setPayment] = useState<"total" | "acompte">("total");
  return <PaymentContext.Provider value={{ payment, setPayment }}>{children}</PaymentContext.Provider>;
}

export function useQuotePayment() {
  const context = useContext(PaymentContext);
  if (!context) throw new Error("QuotePaymentProvider manquant.");
  return context;
}

export function QuoteSteps({ en, available, declined, expired }: { en: boolean; available: boolean; declined: boolean; expired: boolean }) {
  const { payment } = useQuotePayment();
  const steps = payment === "total"
    ? (en ? ["Quote", "Payment", "Creation", "Approval", "Delivery"] : ["Devis", "Paiement", "Création", "Validation", "Livraison"])
    : (en ? ["Quote", "Deposit", "Creation", "Approval", "Balance", "Delivery"] : ["Devis", "Acompte", "Création", "Validation", "Solde", "Livraison"]);
  return <ol className="mt-4 grid w-full gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label={en ? "Project stages" : "Étapes du projet"}>
    {steps.map((label, i) => <li key={label} aria-current={i === 0 ? "step" : undefined} className="min-w-0">
      <div className={`h-1.5 rounded-full ${i === 0 && available ? "bg-accent" : "bg-surface-2"}`} />
      <p className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs sm:uppercase sm:tracking-wider ${i === 0 && available ? "text-accent" : "text-muted/60"}`}><span className="hidden sm:inline">{i + 1}. </span>{label}</p>
      <p className="text-[11px] text-muted">{i === 0 ? declined ? (en ? "declined" : "refusé") : expired ? (en ? "expired" : "expiré") : (en ? "in progress" : "en cours") : (en ? "upcoming" : "à venir")}</p>
    </li>)}
  </ol>;
}
