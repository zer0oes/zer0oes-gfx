import { statusLabel, type OrderStatus } from "@/lib/store/types";

const tone: Record<OrderStatus, string> = {
  payee: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  brief_recu: "border-violet-500/40 bg-violet-500/10 text-violet-200",
  en_cours: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  livree: "border-cyan-500/40 bg-cyan-500/10 text-cyan-200",
  solde_paye: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
  terminee: "border-border bg-surface-2 text-muted",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone[status]}`}>
      {statusLabel(status)}
    </span>
  );
}
