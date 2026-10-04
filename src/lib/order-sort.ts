// Tri de la liste des commandes de l'admin (colonnes cliquables).
import { balanceDue, orderStatuses, type Order } from "@/lib/store/types";

export const sortKeys = ["date", "client", "offre", "montant", "solde", "statut"] as const;
export type SortKey = (typeof sortKeys)[number];
export type SortDir = "asc" | "desc";

export function parseSort(tri: unknown, ordre: unknown): { key: SortKey; dir: SortDir } {
  const key = sortKeys.includes(tri as SortKey) ? (tri as SortKey) : "date";
  const dir: SortDir = ordre === "asc" || ordre === "desc" ? ordre : key === "date" ? "desc" : "asc";
  return { key, dir };
}

const statusRank = (o: Order) => orderStatuses.findIndex((s) => s.id === o.status);
const text = (s: string) => s.toLocaleLowerCase("fr");

// Statut : ordre du cycle de vie (Payée → … → Terminée). Égalité : la plus récente d'abord.
export function sortOrders(orders: Order[], key: SortKey, dir: SortDir): Order[] {
  const sign = dir === "asc" ? 1 : -1;
  const byDateDesc = (a: Order, b: Order) => b.createdAt.localeCompare(a.createdAt);
  const compare: Record<SortKey, (a: Order, b: Order) => number> = {
    date: (a, b) => a.createdAt.localeCompare(b.createdAt),
    // Commandes sans e-mail (démo) après les autres
    client: (a, b) =>
      !a.customerEmail || !b.customerEmail
        ? Number(!a.customerEmail) - Number(!b.customerEmail)
        : text(a.customerEmail).localeCompare(text(b.customerEmail), "fr"),
    offre: (a, b) => text(a.offerName).localeCompare(text(b.offerName), "fr"),
    montant: (a, b) => a.totalPrice - b.totalPrice,
    solde: (a, b) => balanceDue(a) - balanceDue(b),
    statut: (a, b) => statusRank(a) - statusRank(b),
  };
  return [...orders].sort((a, b) => sign * compare[key](a, b) || byDateDesc(a, b));
}
