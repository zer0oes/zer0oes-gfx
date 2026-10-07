"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStatus } from "@/app/admin/actions";
import { isOrderStatus, orderStatuses, type OrderStatus } from "@/lib/store/types";

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const id = useId();
  const router = useRouter();
  const [selected, setSelected] = useState(status);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <div className="flex flex-col items-end gap-2">
    <div className="flex flex-wrap items-center justify-end gap-3">
      <label htmlFor={id} className="sr-only">Modifier le statut</label>
      <select id={id} value={selected} disabled={pending} onChange={(event) => {
        const next = event.target.value;
        if (!isOrderStatus(next)) return;
        const previous = selected;
        setSelected(next);
        setMessage("");
        startTransition(async () => {
          const data = new FormData();
          data.set("id", orderId);
          data.set("status", next);
          try {
            await updateStatus(data);
            setMessage("Statut enregistré.");
            router.refresh();
          } catch {
            setSelected(previous);
            setMessage("Le statut n’a pas pu être enregistré. Réessaie.");
          }
        });
      }} className="rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60">
        {orderStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
    </div>
    <p role="status" className="text-xs text-muted">{pending ? "Enregistrement…" : message}</p>
  </div>;
}
