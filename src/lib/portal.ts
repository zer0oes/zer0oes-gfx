// Espace commande du client (/commande/<jeton>) : étapes du projet, paiement et durée de
// conservation des fichiers. Logique pure, testée (portal.test.ts).
import type { OrderStatus } from "@/lib/store/types";
import { previewPublished } from "@/lib/delivery";
import { allFinalsAccessed } from "./final-downloads";

// Fichiers définitifs disponibles pendant 6 mois après la clôture du projet
export const FILES_RETENTION_MONTHS = 6;

export type StepState = "fait" | "en_cours" | "a_venir";
export type Step = { id: "brief" | "acompte" | "creation" | "validation" | "solde" | "livraison"; label: string; state: StepState; detail?: string };

type PortalOrder = {
  status: OrderStatus;
  totalPrice: number;
  amountPaid: number;
  paymentType?: "total" | "acompte";
  depositPercent?: number;
  briefCompleted?: boolean;
  brief?: Record<string, string>;
  briefReceivedAt?: string;
  completedAt?: string;
};

const rank: Record<OrderStatus, number> = { payee: 0, brief_attente: 0, brief_recu: 1, en_cours: 2, livree: 3, solde_paye: 4, terminee: 5 };

export function filesExpireAt(order: Pick<PortalOrder, "completedAt">) {
  if (!order.completedAt) return null;
  const at = new Date(order.completedAt);
  const day = at.getUTCDate();
  at.setUTCDate(1);
  at.setUTCMonth(at.getUTCMonth() + FILES_RETENTION_MONTHS);
  const lastDay = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 0)).getUTCDate();
  at.setUTCDate(Math.min(day, lastDay));
  return at;
}

export function filesExpired(order: Pick<PortalOrder, "completedAt">, now = new Date()) {
  const at = filesExpireAt(order);
  return at !== null && now >= at;
}

// Le solde fait partie du suivi uniquement pour les commandes avec acompte.
export function orderSteps(order: PortalOrder, items: { publishedAt?: string; approvedAt?: string; plannedKey?: string; storagePath?: string; url?: string; finalAssets?: { path?: string; url?: string; label: string }[]; accessedFinalAssets?: string[] }[], locale: "fr" | "en" = "fr"): Step[] {
  const en = locale === "en";
  const r = rank[order.status];
  const briefDone = order.briefCompleted ?? (order.status !== "brief_attente" && (Boolean(order.brief || order.briefReceivedAt) || r >= 1));
  const delivered = items.some(previewPublished);
  const validated = items.length > 0 && items.every((d) => d.approvedAt);
  const paid = order.totalPrice - order.amountPaid <= 0;
  const finalsReady = items.every((item) => !item.plannedKey || item.storagePath || item.url || item.finalAssets?.length);
  const finished = validated && paid && finalsReady && items.every(allFinalsAccessed);

  const steps: Step[] = [
    { id: "brief", label: briefDone ? (en ? "Brief received" : "Brief reçu") : (en ? "Complete your brief" : "Brief à compléter"), state: briefDone ? "fait" : "en_cours" },
    { id: "creation", label: en ? "Creation" : "Création", state: r >= 3 ? "fait" : r >= 2 ? "en_cours" : "a_venir" },
    { id: "validation", label: en ? "Approval" : "Validation", state: validated ? "fait" : delivered ? "en_cours" : "a_venir" },
    { id: "solde", label: en ? "Balance" : "Solde", state: paid ? "fait" : validated ? "en_cours" : "a_venir" },
    { id: "livraison", label: en ? "Delivery" : "Livraison", state: finished ? "fait" : validated && paid ? "en_cours" : "a_venir" },
  ];
  if (order.paymentType === "acompte" && (order.depositPercent ?? 0) > 0) {
    const depositPaid = order.amountPaid >= Math.round(order.totalPrice * order.depositPercent! / 100);
    steps.unshift({ id: "acompte", label: en ? "Deposit" : "Acompte", state: depositPaid ? "fait" : "en_cours" });
    if (!depositPaid && !briefDone) steps.find((step) => step.id === "brief")!.state = "a_venir";
    if (!depositPaid) {
      const creation = steps.find((step) => step.id === "creation");
      if (creation) creation.state = "a_venir";
    }
  }
  return order.paymentType === "total" ? steps.filter((step) => step.id !== "solde") : steps;
}

// Phrase de statut affichée en haut de l'espace commande
export function statusMessage(steps: Step[], locale: "fr" | "en" = "fr", closed = false) {
  const current = steps.find((s) => s.state === "en_cours");
  if (!current && steps.find((s) => s.id === "brief")?.state === "fait" && steps.find((s) => s.id === "creation")?.state === "a_venir") {
    return locale === "en" ? "Brief received: your project is waiting for creation to start." : "Brief bien reçu : ton projet est en attente du début de la création.";
  }
  if (locale === "en") {
    switch (current?.id) {
      case "acompte":
        return "Your brief is complete. Pay the initial deposit to start creation. The balance is due before final delivery.";
      case "brief":
        return "Order confirmed! Next step: your brief, so I can get started.";
      case "creation":
        return "Brief received: I'm working on your creation. Previews will appear here.";
      case "validation":
        return "Your previews are ready: approve each item or request a change.";
      case "solde":
        return "Everything is approved, thank you! The balance remains to be paid to unlock your files.";
      case "livraison":
        return "Your final files are available.";
      default:
        return steps.every((s) => s.state === "fait") ? (closed ? "Project complete: your final files are available." : "Delivery approved: your final files are available.") : "";
    }
  }
  switch (current?.id) {
    case "acompte":
      return "Ton brief est reçu. Règle l’acompte initial pour démarrer la création. Le solde sera à régler avant la livraison définitive.";
    case "brief":
      return "Commande confirmée ! Prochaine étape : ton brief, pour que je puisse commencer.";
    case "creation":
      return "Brief bien reçu : je travaille sur ta création. Les aperçus apparaîtront ici.";
    case "validation":
      return "Tes aperçus sont prêts : valide chaque élément ou demande une modification.";
    case "solde":
      return "Tout est validé, merci ! Il reste le solde à régler pour débloquer tes fichiers.";
    case "livraison":
      return "Tes fichiers définitifs sont disponibles.";
    default:
      return steps.every((s) => s.state === "fait") ? (closed ? "Projet terminé : tes fichiers définitifs sont disponibles." : "Livraison validée : tes fichiers définitifs sont disponibles.") : "";
  }
}

// La première date de clôture est conservée définitivement.
export function completionPatch(current: { status: OrderStatus; completedAt?: string }, next: OrderStatus): { completedAt?: string | null } {
  if (next === "terminee") return current.completedAt ? {} : { completedAt: new Date().toISOString() };
  return {};
}
