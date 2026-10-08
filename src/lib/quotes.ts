export type ProjectQuote = {
  id: string; token: string; createdAt: string; updatedAt: string;
  name: string; email: string; locale: "fr" | "en"; request: Record<string, string>;
  status: "demande" | "propose" | "accepte" | "refuse";
  title: string; description: string; deliverables: string[]; totalPrice: number;
  validUntil: string; orderId?: string; acceptedAt?: string;
  sentAt?: string; sendingAt?: string;
  paymentType?: "total" | "acompte"; depositPercent?: number;
  declineReason?: string;
  revisionsIncluded?: number;
  briefCompletedAt?: string;
  optionalBriefDeliverables?: string[];
  requiredBriefFields?: string[];
};

export function quoteEditable(q: ProjectQuote) {
  return (q.status === "demande" || q.status === "propose") && !q.sentAt && !q.sendingAt && !q.orderId;
}

export const quoteLabels = { demande: "Nouvelle demande", propose: "Proposé", accepte: "Accepté", refuse: "Refusé" };

export function validQuoteProposal(q: Pick<ProjectQuote, "title" | "description" | "deliverables" | "totalPrice" | "validUntil" | "paymentType" | "depositPercent">, now = new Date()) {
  return Boolean(q.title.trim() && q.description.trim() && q.deliverables.length && q.deliverables.length <= 20 &&
    (!q.paymentType || q.paymentType === "total" || (q.paymentType === "acompte" && Number.isInteger(q.depositPercent) && q.depositPercent! > 0 && q.depositPercent! < 100 && Math.round(q.totalPrice * q.depositPercent! / 100) >= 50 && q.totalPrice - Math.round(q.totalPrice * q.depositPercent! / 100) >= 50)) &&
    q.deliverables.every((s) => s.trim() && s.length <= 500) && Number.isSafeInteger(q.totalPrice) &&
    q.totalPrice >= 50 && q.totalPrice <= 100000000 && /^\d{4}-\d{2}-\d{2}$/.test(q.validUntil) &&
    Number.isFinite(Date.parse(q.validUntil)) && new Date(q.validUntil).toISOString().slice(0, 10) === q.validUntil && q.validUntil >= now.toISOString().slice(0, 10));
}

export function quoteExpired(q: Pick<ProjectQuote, "validUntil">, now = new Date()) {
  return !q.validUntil || q.validUntil < now.toISOString().slice(0, 10);
}
