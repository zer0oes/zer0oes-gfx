"use client";

import { installChoices, orderStreamToolChoices, streamToolChoices } from "@/lib/brief-delivery";

const texts = {
  fr: {
    streamTool: "Plateforme de tes widgets et alertes",
    streamToolHint: "Le service où tes widgets, alertes et overlays seront installés.",
    both: "Les deux",
    install: "Installation",
    installChoices: [
      ["J’ajoute moi-même le code", "Tu reçois le HTML, le CSS et le JavaScript à coller dans ta plateforme."],
      ["Installation par zer0oes_GFX", "Tu invites le compte zer0oes_GFX comme éditeur de ta plateforme et j’installe tout pour toi."],
    ],
    supplement: "Supplément pour l’installation, chiffré dans ton devis.",
  },
  en: {
    streamTool: "Platform for your widgets and alerts",
    streamToolHint: "The service where your widgets, alerts and overlays will be installed.",
    both: "Both",
    install: "Installation",
    installChoices: [
      ["I’ll add the code myself", "You receive the HTML, CSS and JavaScript to paste into your platform."],
      ["Installation by zer0oes_GFX", "You invite the zer0oes_GFX account as an editor of your platform and I install everything for you."],
    ],
    supplement: "Extra charge for the installation, included in your quote.",
  },
} as const;

// Questions d'installation selon le contenu de la commande.
// mode « brief » : plateforme StreamElements ou Streamlabs, obligatoire, avec une note (intégration incluse, invitation…)
// mode « quote-brief » : brief d'un devis accepté (« Les deux » possible), obligatoire
// mode « quote-request » : demande de devis, facultatif, plateforme + mode d'installation (supplément annoncé)
export function BriefDeliveryQuestions({ needs, en, mode, note, streamTool, onStreamTool }: {
  needs: { platform: boolean; install: boolean };
  en: boolean;
  mode: "brief" | "quote-brief" | "quote-request";
  note?: string;
  streamTool?: string;
  onStreamTool?: (value: string) => void;
}) {
  const tx = texts[en ? "en" : "fr"];
  const required = mode !== "quote-request";
  const choices = mode === "brief" ? orderStreamToolChoices : streamToolChoices;
  const checked = (value: string) => (onStreamTool ? { checked: streamTool === value, onChange: () => onStreamTool(value) } : { defaultChecked: streamTool === value });
  return (
    <>
      {needs.platform && <fieldset>
        <legend className="text-sm font-medium">{tx.streamTool}{required ? " *" : ""}</legend>
        <p className="mt-1 text-sm text-foreground/75">{tx.streamToolHint}</p>
        <div className="mt-2 inline-grid auto-cols-fr grid-flow-col gap-1 rounded-full border border-border bg-background p-1">
          {choices.map((choice) => (
            <label key={choice} className="cursor-pointer rounded-full px-4 py-1.5 text-center text-sm font-medium text-muted transition-colors hover:text-foreground has-[:checked]:bg-accent has-[:checked]:text-background has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
              <input type="radio" name="streamTool" value={choice} required={required} className="sr-only" {...checked(choice)} />
              {choice === "Les deux" ? tx.both : choice}
            </label>
          ))}
        </div>
        {note && <p className="mt-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-foreground/85">{note}</p>}
      </fieldset>}
      {mode === "quote-request" && needs.install && <fieldset>
        <legend className="text-sm font-medium">{tx.install}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {installChoices.map((choice, index) => (
            <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 text-sm transition-colors hover:border-accent/60 has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
              <input type="radio" name="install" value={choice} className="mt-0.5 accent-[var(--accent)]" />
              <span>
                <span className="block font-semibold">{tx.installChoices[index][0]}</span>
                <span className="mt-1 block text-foreground/75">{tx.installChoices[index][1]}</span>
                {index === 1 && <span className="mt-2 block text-xs font-semibold text-accent">{tx.supplement}</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>}
    </>
  );
}
