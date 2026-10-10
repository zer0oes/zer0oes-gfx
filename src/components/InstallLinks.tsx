"use client";

import { useState } from "react";
import { C4LDAS_INSTALL_URL, INSTALL_LABELS, type InstallPlatform } from "@/lib/install-links";
import type { Locale } from "@/lib/i18n";

export type InstallAsset = { index: number; label: string; install: InstallPlatform; hasUrl: boolean; hasCode: boolean };

const texts = {
  fr: {
    streamlabsSteps: [
      "Connecte-toi à Streamlabs avec ton compte.",
      "Clique sur « Installer sur Streamlabs » : le thème de widgets s’ouvre et s’importe dans ton compte.",
      "Dans Widget Themes, active le thème importé (« Use »), puis ajoute le widget dans OBS ou Streamlabs Desktop.",
    ],
    streamelementsSteps: [
      "Affiche ton code d’installation, puis copie-le.",
      "Ouvre c4ldas SE API et connecte-toi avec ton compte StreamElements.",
      "Colle le code : le widget s’installe directement sur ton compte StreamElements.",
      "Copie l’URL du widget dans StreamElements et ajoute-la dans OBS comme source « Navigateur ».",
    ],
    showCode: "Afficher mon code",
    loading: "Chargement…",
    copy: "Copier",
    copied: "Copié !",
    openC4ldas: "Ouvrir c4ldas SE API ↗",
    openShare: "Ouvrir le lien de partage ↗",
    codeLabel: "Code d’installation",
    error: "Code indisponible pour le moment. Réessaie ou écris-moi.",
    note: "c4ldas SE API est un service tiers gratuit qui installe les overlays et widgets partagés sur ton compte StreamElements.",
  },
  en: {
    streamlabsSteps: [
      "Log in to Streamlabs with your account.",
      "Click “Install on Streamlabs”: the widget theme opens and is imported into your account.",
      "In Widget Themes, activate the imported theme (“Use”), then add the widget in OBS or Streamlabs Desktop.",
    ],
    streamelementsSteps: [
      "Show your install code, then copy it.",
      "Open c4ldas SE API and log in with your StreamElements account.",
      "Paste the code: the widget is installed straight into your StreamElements account.",
      "Copy the widget URL in StreamElements and add it to OBS as a “Browser” source.",
    ],
    showCode: "Show my code",
    loading: "Loading…",
    copy: "Copy",
    copied: "Copied!",
    openC4ldas: "Open c4ldas SE API ↗",
    openShare: "Open the share link ↗",
    codeLabel: "Install code",
    error: "Code unavailable right now. Please try again or contact me.",
    note: "c4ldas SE API is a free third-party service that installs shared overlays and widgets into your StreamElements account.",
  },
} as const;

const icons: Record<InstallPlatform, string> = {
  streamlabs: "/streamerlab/platforms/streamlabs-icon.svg",
  streamelements: "/streamerlab/platforms/streamelements-icon.svg",
};

// Code StreamElements : demandé au serveur seulement au clic (élément débloqué, accès enregistré)
function StreamElementsCode({ href, tx }: { href: string; tx: (typeof texts)[Locale] }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error" | "copied">("idle");
  const reveal = async () => {
    setState("loading");
    try {
      const response = await fetch(`${href}&code=1`, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      setCode(String((await response.json()).code ?? ""));
      setState("idle");
    } catch {
      setState("error");
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setState("copied"); window.setTimeout(() => setState("idle"), 2000); } catch { /* le code reste sélectionnable */ }
  };
  if (!code) return (
    <div className="space-y-2">
      <button type="button" onClick={reveal} disabled={state === "loading"} className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-60">{state === "loading" ? tx.loading : tx.showCode}</button>
      {state === "error" && <p role="alert" className="text-xs text-amber-300">{tx.error}</p>}
    </div>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">{tx.codeLabel}</span>
      <code className="select-all rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm">{code}</code>
      <button type="button" onClick={copy} className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent">{state === "copied" ? tx.copied : tx.copy}</button>
    </div>
  );
}

// Boutons « Installer sur Streamlabs / StreamElements » d'un livrable, avec les instructions adaptées
export function InstallLinks({ token, deliverableId, assets, locale }: { token: string; deliverableId: string; assets: InstallAsset[]; locale: Locale }) {
  const tx = texts[locale];
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2">
      {assets.map((asset) => {
        const href = `/commande/${token}/${deliverableId}?asset=${asset.index}`;
        const title = INSTALL_LABELS[asset.install][locale];
        return (
          <div key={asset.index} className="space-y-3 rounded-xl border border-border bg-background/60 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icons[asset.install]} alt="" width={22} height={22} className="size-[22px] object-contain" />
              {title}
              {asset.label !== INSTALL_LABELS[asset.install].fr && asset.label !== title && <span className="font-normal text-muted">· {asset.label}</span>}
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-muted">
              {(asset.install === "streamlabs" ? tx.streamlabsSteps : tx.streamelementsSteps).map((step) => <li key={step}>{step}</li>)}
            </ol>
            {asset.install === "streamlabs" ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:brightness-110">{title} ↗</a>
            ) : (
              <>
                {asset.hasCode && <StreamElementsCode href={href} tx={tx} />}
                <div className="flex flex-wrap gap-2">
                  <a href={C4LDAS_INSTALL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:border-accent">{tx.openC4ldas}</a>
                  {asset.hasUrl && <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm hover:border-accent">{tx.openShare}</a>}
                </div>
                <p className="text-xs text-muted">{tx.note}</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
