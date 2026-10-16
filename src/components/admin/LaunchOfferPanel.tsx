import { DatePicker } from "@/components/DatePicker";
import { saveLaunchOfferAction } from "@/app/admin/promotions-actions";
import { INSTALL_OPTION_ID } from "@/lib/brief-delivery";
import { launchActive, launchProductRates, launchQuota, launchRates, type LaunchState } from "@/lib/launch-offer";
import type { Catalog } from "@/lib/pricing";
import { promotionProducts } from "@/lib/promotions";
import { RateFields } from "./RateFields";
import { parisScheduleParts } from "@/lib/launch-schedule";
import { Switch } from "./Switch";

export function launchStatus(state: LaunchState) {
  return !state.enabled ? "Désactivée" : state.remaining === 0 ? "Quota atteint" : launchActive(state) ? "Active" : "Programmée";
}
// Programmation de l'offre de lancement (dans le panneau de droite de « Remises et codes »)
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
export function LaunchOfferForm({ state, catalog, formId }: { state: LaunchState; catalog: Catalog; formId: string }) {
  const parts = parisScheduleParts(state.startsAt);
  const quota = launchQuota(state), rates = launchRates(state);
  const products = promotionProducts(catalog).filter((p) => p.key !== `option:${INSTALL_OPTION_ID}`);
  return <>
    <p className="text-sm text-muted">Un quota commun de commandes, sans cumul de promotions.</p>
    <p className="text-sm font-medium">{state.remaining} place{state.remaining > 1 ? "s" : ""} disponible{state.remaining > 1 ? "s" : ""} sur {quota}</p>
    <p className="text-xs text-muted">Une place est réservée jusqu’à confirmation du paiement ou de son expiration par Stripe (session de 30 minutes). Un devis accepté compte comme une commande. Modifier la date ne remet pas le compteur à zéro.</p>
    <form id={formId} action={saveLaunchOfferAction} className="space-y-4">
      <Switch name="enabled" label="Activer l’offre à la date prévue" defaultChecked={state.enabled} />
      <div className="grid gap-4 sm:grid-cols-2"><DatePicker key={state.startsAt || "empty"} name="launchDay" label="Date de début" locale="fr" defaultValue={parts.day} />
        <label className="grid content-start gap-1.5 text-sm font-medium">Heure de début (Paris)<input name="launchTime" type="time" defaultValue={parts.time} required className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm" /></label>
      </div>
      <label className="grid max-w-56 gap-1.5 text-sm font-medium">Nombre de places<input name="quota" type="number" min="1" max="1000" step="1" required defaultValue={quota} className={input} /></label>
      <fieldset className="space-y-2"><legend className="text-sm font-medium">Remise par produit</legend>
        <RateFields products={products} rates={launchProductRates(catalog, state)} />
      </fieldset>
      <fieldset><legend className="mb-2 text-sm font-medium">Remise sur les devis acceptés pendant l’offre</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm">Devis d’un pack (%)<input name="quotePacks" type="number" min="1" max="80" step="1" required defaultValue={rates.packs} className={input} /></label>
          <label className="grid gap-1.5 text-sm">Devis à la carte ou sur mesure (%)<input name="quoteOptions" type="number" min="1" max="80" step="1" required defaultValue={rates.options} className={input} /></label>
        </div>
        <p className="mt-2 text-xs text-muted">Le pourcentage est fixé à la demande de devis ; les devis déjà reçus gardent le leur.</p>
      </fieldset>
      <p className="text-xs text-muted">Les prix remisés et les bandeaux liés à l’offre apparaîtront automatiquement à cette date, en heure de Paris.</p>
    </form>
  </>;
}
