"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeliveryNotice({ message }: { message: string }) {
  const [hidden, setHidden] = useState(false);
  const router = useRouter();
  if (hidden) return null;
  return <div role="status" className="mt-3 flex items-start justify-between gap-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
    <span>{message}</span>
    <button type="button" aria-label="Fermer la confirmation" title="Fermer la confirmation" className="shrink-0 rounded px-1 hover:text-foreground" onClick={() => { setHidden(true); const url = new URL(window.location.href); url.searchParams.delete("enregistre"); router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false }); }}>✕</button>
  </div>;
}
