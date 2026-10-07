"use client";

import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";

// Actualisation du rendu serveur sans perdre les champs en cours de saisie.
export function OrderLiveRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible" && !pending) {
        startTransition(() => router.refresh());
      }
    };
    const timer = window.setInterval(refresh, 3_000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router, pending]);

  return null;
}
