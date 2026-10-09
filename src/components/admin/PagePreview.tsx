"use client";

import { useEffect, useState } from "react";
import type { Work } from "@/data/portfolio";
import type { Locale } from "@/lib/i18n";
import type { BuilderPage } from "@/lib/page-builder";
import { BuilderView } from "../BuilderView";
import { I18nProvider } from "../I18nProvider";

export const PREVIEW_MESSAGE = "zgfx-page-preview";

// Rendu de la page projet en cours d'édition : l'éditeur (fenêtre parente, même origine) envoie la page
// à chaque modification ; le bloc sélectionné est amené à l'écran.
export function PagePreview({ works, streamerName }: { works: Work[]; streamerName: string }) {
  const [state, setState] = useState<{ page: BuilderPage; locale: Locale; focus?: string } | null>(null);

  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return;
      setState({ page: e.data.page, locale: e.data.locale === "en" ? "en" : "fr", focus: e.data.focus });
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    if (!state?.focus) return;
    document.querySelector(`[data-block="${CSS.escape(state.focus)}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [state?.focus]);

  if (!state) return <p className="py-24 text-center text-sm text-muted">Chargement de l&apos;aperçu…</p>;
  return (
    <I18nProvider locale={state.locale}>
      <BuilderView page={state.page} works={works} streamerName={streamerName} />
    </I18nProvider>
  );
}
