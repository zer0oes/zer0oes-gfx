// Espace commande du client (/commande/<jeton>) : étapes du projet, paiement et durée de
// conservation des fichiers. Logique pure, testée (portal.test.ts).
import type { OrderStatus } from "@/lib/store/types";

// Fichiers définitifs disponibles pendant 6 mois après la clôture du projet
export const FILES_RETENTION_MONTHS = 6;

export type StepState = "fait" | "en_cours" | "a_venir";
export type Step = { id: "brief" | "creation" | "validation" | "solde" | "livraison"; label: string; state: StepState; detail?: string };

type PortalOrder = {
  status: OrderStatus;
  totalPrice: number;
  amountPaid: number;
  brief?: Record<string, string>;
  briefReceivedAt?: string;
  completedAt?: string;
};

const rank: Record<OrderStatus, number> = { payee: 0, brief_recu: 1, en_cours: 2, livree: 3, solde_paye: 4, terminee: 5 };

export function filesExpireAt(order: Pick<PortalOrder, "completedAt">) {
  if (!order.completedAt) return null;
  const at = new Date(order.completedAt);
  at.setUTCMonth(at.getUTCMonth() + FILES_RETENTION_MONTHS);
  return at;
}

export function filesExpired(order: Pick<PortalOrder, "completedAt">, now = new Date()) {
  const at = filesExpireAt(order);
  return at !== null && now > at;
}

// Les 5 étapes montrées au client : brief reçu, création, validation, solde, livraison
export function orderSteps(order: PortalOrder, items: { approvedAt?: string }[], locale: "fr" | "en" = "fr"): Step[] {
  const en = locale === "en";
  const r = rank[order.status];
  const briefDone = Boolean(order.brief || order.briefReceivedAt) || r >= 1;
  const delivered = r >= 3 || items.length > 0;
  const validated = items.length > 0 && items.every((d) => d.approvedAt);
  const paid = order.totalPrice - order.amountPaid <= 0;
  const finished = r >= 5 || (validated && paid);

  const steps: Step[] = [
    { id: "brief", label: en ? "Brief received" : "Brief reçu", state: briefDone ? "fait" : "en_cours" },
    { id: "creation", label: en ? "Creation" : "Création", state: delivered ? "fait" : briefDone ? "en_cours" : "a_venir" },
    { id: "validation", label: en ? "Approval" : "Validation", state: validated ? "fait" : delivered ? "en_cours" : "a_venir" },
    { id: "solde", label: en ? "Balance" : "Solde", state: paid ? "fait" : validated ? "en_cours" : "a_venir" },
    { id: "livraison", label: en ? "Delivery" : "Livraison", state: finished ? "fait" : validated && paid ? "en_cours" : "a_venir" },
  ];
  return steps;
}

// Phrase de statut affichée en haut de l'espace commande
export function statusMessage(steps: Step[], locale: "fr" | "en" = "fr") {
  const current = steps.find((s) => s.state === "en_cours");
  if (locale === "en") {
    switch (current?.id) {
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
        return steps.every((s) => s.state === "fait") ? "Project complete: your final files are available." : "";
    }
  }
  switch (current?.id) {
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
      return steps.every((s) => s.state === "fait") ? "Projet terminé : tes fichiers définitifs sont disponibles." : "";
  }
}

// Date de clôture : posée quand la commande passe « Terminée », retirée si elle en sort
export function completionPatch(current: { status: OrderStatus; completedAt?: string }, next: OrderStatus): { completedAt?: string | null } {
  if (next === "terminee") return current.completedAt ? {} : { completedAt: new Date().toISOString() };
  return current.completedAt ? { completedAt: null } : {};
}
