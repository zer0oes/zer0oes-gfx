"use client";

import { overlayDeliveryChoices, streamToolChoices } from "@/lib/brief-delivery";

const texts = {
  fr: {
    streamTool: "Plateforme de tes widgets et alertes",
    streamToolHint: "Le service où tes widgets et alertes seront installés.",
    both: "Les deux",
    overlayDelivery: "Comment veux-tu recevoir tes overlays ?",
    supplement: "Supplément pour le développement StreamElements, chiffré dans ton devis.",
    choices: [
      ["Widget StreamElements prêt à intégrer", "Je prépare tes overlays sur StreamElements : tu ajoutes simplement le lien dans OBS (source navigateur), sans rien configurer."],
      ["Fichiers à configurer toi-même", "Tu reçois les fichiers (images, vidéos, page HTML) et tu les mets en place toi-même dans OBS ou ton logiciel de live."],
    ],
  },
  en: {
    streamTool: "Platform for your widgets and alerts",
    streamToolHint: "The service where your widgets and alerts will be installed.",
    both: "Both",
    overlayDelivery: "How would you like to receive your overlays?",
    supplement: "Extra charge for the StreamElements development, included in your quote.",
    choices: [
      ["StreamElements widget, ready to add", "I set up your overlays on StreamElements: you simply add the link in OBS (browser source), no configuration needed."],
      ["Files to set up yourself", "You receive the files (images, videos, HTML page) and set them up yourself in OBS or your streaming software."],
    ],
  },
} as const;

// Questions du brief selon le contenu de la commande : plateforme des widgets / alertes et livraison des overlays.
// Contrôlées (value + onChange) ou libres (valeurs initiales seulement).
// quote : demande de devis (questions facultatives, supplément StreamElements annoncé)
export function BriefDeliveryQuestions({ needs, en, quote = false, streamTool, overlayDelivery, onStreamTool, onOverlayDelivery }: {
  needs: { platform: boolean; overlays: boolean };
  en: boolean;
  quote?: boolean;
  streamTool?: string;
  overlayDelivery?: string;
  onStreamTool?: (value: string) => void;
  onOverlayDelivery?: (value: string) => void;
}) {
  const tx = texts[en ? "en" : "fr"];
  const mark = quote ? "" : " *";
  const checked = (current: string | undefined, value: string, onChange?: (value: string) => void) =>
    onChange ? { checked: current === value, onChange: () => onChange(value) } : { defaultChecked: current === value };
  return (
    <>
      {needs.platform && <fieldset>
        <legend className="text-sm font-medium">{tx.streamTool}{mark}</legend>
        <p className="mt-1 text-sm text-foreground/75">{tx.streamToolHint}</p>
        <div className="mt-2 inline-grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-border bg-background p-1">
          {streamToolChoices.map((choice) => (
            <label key={choice} className="cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-accent has-[:checked]:text-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
              <input type="radio" name="streamTool" value={choice} required={!quote} className="sr-only" {...checked(streamTool, choice, onStreamTool)} />
              {choice === "Les deux" ? tx.both : choice}
            </label>
          ))}
        </div>
      </fieldset>}
      {needs.overlays && <fieldset>
        <legend className="text-sm font-medium">{tx.overlayDelivery}{mark}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {overlayDeliveryChoices.map((choice, index) => (
            <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm transition-colors hover:border-accent/60 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <input type="radio" name="overlayDelivery" value={choice} required={!quote} className="mt-0.5 accent-[var(--accent)]" {...checked(overlayDelivery, choice, onOverlayDelivery)} />
              <span>
                <span className="block font-semibold">{tx.choices[index][0]}</span>
                <span className="mt-1 block text-foreground/75">{tx.choices[index][1]}</span>
                {quote && index === 0 && <span className="mt-2 block text-xs font-semibold text-accent">{tx.supplement}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>}
    </>
  );
}
