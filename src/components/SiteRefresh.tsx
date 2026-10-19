"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { onSiteChanged } from "@/lib/site-refresh";

// Onglet du site ouvert pendant que l'admin enregistre : la page se met à jour toute seule (sans recharger)
export function SiteRefresh() {
  const router = useRouter();
  useEffect(() => onSiteChanged(() => router.refresh()), [router]);
  return null;
}
