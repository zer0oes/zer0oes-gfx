"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Mesure d'audience maison (Admin > Statistiques) : pages vues et clics, sans cookie.
// Le libellé d'un clic vient de data-track, sinon du texte ou de l'aria-label de l'élément.

function send(data: Record<string, unknown>) {
  const body = JSON.stringify(data);
  try {
    if (navigator.sendBeacon?.("/api/stats", body)) return;
  } catch {
    // envoi classique ci-dessous
  }
  fetch("/api/stats", { method: "POST", body, keepalive: true }).catch(() => {});
}

// Chemin suivi : la page, plus l'onglet du formulaire de contact
function currentPath() {
  const onglet = new URLSearchParams(location.search).get("onglet");
  return location.pathname + (onglet ? `?onglet=${onglet}` : "");
}

function clickLabel(el: HTMLElement) {
  const text =
    el.dataset.track ||
    el.getAttribute("aria-label") ||
    el.textContent?.replace(/\s+/g, " ").trim() ||
    el.querySelector("img")?.getAttribute("alt") ||
    "";
  const label = text.slice(0, 90) || "(sans texte)";
  // Lien vers un autre site : on ajoute sa destination
  if (el instanceof HTMLAnchorElement && el.host && el.host !== location.host && /^https?:$/.test(el.protocol)) {
    return `${label} ↗ ${el.host.replace(/^www\./, "")}`;
  }
  if (el instanceof HTMLAnchorElement && el.protocol === "mailto:") return `${label} (e-mail)`;
  return label;
}

export function Analytics() {
  const pathname = usePathname();
  const landing = useRef(true);

  // Page vue à chaque changement de page (un changement d'onglet du contact est compté comme clic)
  useEffect(() => {
    const first = landing.current;
    landing.current = false;
    send({
      kind: "vue",
      path: currentPath(),
      ...(first ? { landing: true, ref: document.referrer, utm: new URLSearchParams(location.search).get("utm_source") ?? "" } : {}),
    });
  }, [pathname]);

  // Clics sur les liens et boutons
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-track]");
      if (!el || el.closest("[data-no-track]")) return;
      send({ kind: "clic", path: currentPath(), label: clickLabel(el) });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
