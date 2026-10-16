import { DatePicker } from "@/components/DatePicker";
import { saveLaunchOfferAction } from "@/app/admin/promotions-actions";
import { launchActive, type LaunchState } from "@/lib/launch-offer";
import { parisScheduleParts } from "@/lib/launch-schedule";
import { Switch } from "./Switch";

export function launchStatus(state: LaunchState) {
  return !state.enabled ? "Désactivée" : state.remaining === 0 ? "Quota atteint" : launchActive(state) ? "Active" : "Programmée";
}
// Programmation de l'offre de lancement (dans le panneau de droite de « Remises et codes »)
export function LaunchOfferForm({ state, formId }: { state: LaunchState; formId: string }) {
  const parts = parisScheduleParts(state.startsAt);
  return <>
    <p className="text-sm text-muted">−50 % sur les packs et −25 % sur les créations à la carte. Un quota commun de 10 commandes, sans cumul de promotions.</p>
    <p className="text-sm font-medium">{state.remaining} place{state.remaining > 1 ? "s" : ""} disponible{state.remaining > 1 ? "s" : ""} sur 10</p>
    <p className="text-xs text-muted">Une place est réservée jusqu’à confirmation du paiement ou de son expiration par Stripe (session de 30 minutes). Un devis accepté compte comme une commande. Modifier la date ne remet pas le compteur à zéro.</p>
    <form id={formId} action={saveLaunchOfferAction} className="space-y-4">
      <Switch name="enabled" label="Activer l’offre à la date prévue" defaultChecked={state.enabled} />
      <div className="grid gap-4 sm:grid-cols-2"><DatePicker key={state.startsAt || "empty"} name="launchDay" label="Date de début" locale="fr" defaultValue={parts.day} />
        <label className="grid content-start gap-1.5 text-sm font-medium">Heure de début (Paris)<input name="launchTime" type="time" defaultValue={parts.time} required className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm" /></label>
      </div>
      <p className="text-xs text-muted">Les prix remisés et les bandeaux liés à l’offre apparaîtront automatiquement à cette date, en heure de Paris.</p>
    </form>
  </>;
}
