import { DatePicker } from "@/components/DatePicker";
import { saveLaunchOfferAction } from "@/app/admin/promotions-actions";
import { getStore } from "@/lib/store";
import { launchActive } from "@/lib/launch-offer";
import { parisScheduleParts } from "@/lib/launch-schedule";

export async function LaunchOfferPanel() {
  const state = await getStore().getLaunchState();
  const parts = parisScheduleParts(state.startsAt);
  const status = !state.enabled ? "Désactivée" : state.remaining === 0 ? "Quota atteint" : launchActive(state) ? "Active" : "Programmée";
  return <section className="rounded-2xl border border-accent/40 bg-surface p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Offre de lancement LinkedIn</h2><span className="rounded-full border border-border px-3 py-1 text-xs">{status}</span></div>
    <p className="mt-3 text-sm text-muted">−50 % sur les packs et −25 % sur les créations à la carte. Un quota commun de 10 commandes, sans cumul de promotions. L’audit gratuit reste accessible à tous.</p>
    <p className="mt-3 text-sm font-medium">{state.remaining} place{state.remaining > 1 ? "s" : ""} disponible{state.remaining > 1 ? "s" : ""} sur 10</p>
    <p className="mt-1 text-xs text-muted">Une place est réservée jusqu’à confirmation du paiement ou de son expiration par Stripe (session de 30 minutes). Un devis accepté compte comme une commande. Modifier la date ne remet pas le compteur à zéro.</p>
    <form action={saveLaunchOfferAction} className="mt-5 space-y-4">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={state.enabled} />Activer l’offre à la date prévue</label>
      <div className="grid gap-4 sm:grid-cols-2"><DatePicker key={state.startsAt || "empty"} name="launchDay" label="Date de début" locale="fr" defaultValue={parts.day} />
        <label className="grid content-start gap-1.5 text-sm font-medium">Heure de début (Paris)<input name="launchTime" type="time" defaultValue={parts.time} required className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm" /></label>
      </div>
      <p className="text-xs text-muted">Le bandeau et les prix remisés apparaîtront automatiquement à cette date, en heure de Paris.</p>
      <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-background">Enregistrer la programmation</button>
    </form>
  </section>;
}
