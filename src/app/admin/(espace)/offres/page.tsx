import type { Metadata } from "next";
import type { Pack } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { saveOptionsAction, savePackAction, saveSettingsAction } from "../../offres-actions";

export const metadata: Metadata = { title: "Offres et réglages" };

const euros = (cents: number) => (cents / 100).toString().replace(".", ",");
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-[var(--accent)]" />
      {label}
    </label>
  );
}

function PackForm({ pack }: { pack: Pack }) {
  // Formules existantes + 2 lignes vides pour en ajouter
  const rows = [...(pack.formulas ?? []), undefined, undefined];
  return (
    <form action={savePackAction} className={`${card} space-y-4`}>
      <input type="hidden" name="id" value={pack.id} />
      <h3 className="font-display text-xl font-bold">{pack.name}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <input name="name" defaultValue={pack.name} required className={input} />
        </Field>
        <Field label="Prix affiché (€ HT)" hint="Prix de la formule de base, ou prix « à partir de ».">
          <input name="price" defaultValue={euros(pack.price)} inputMode="decimal" required className={input} />
        </Field>
      </div>
      <Field label="Accroche">
        <input name="tagline" defaultValue={pack.tagline} className={input} />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Check name="checkout" label="Commandable en ligne (sinon : sur devis)" defaultChecked={pack.checkout} />
        <Check name="priceFrom" label="Prix « à partir de »" defaultChecked={pack.priceFrom} />
        <Check name="highlight" label="Mise en avant" defaultChecked={pack.highlight} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Livrables" hint="Un par ligne.">
          <textarea name="deliverables" rows={5} defaultValue={pack.deliverables.join("\n")} className={input} />
        </Field>
        <Field label="Options de l'offre" hint="Une par ligne (affichées sous les livrables).">
          <textarea name="extras" rows={5} defaultValue={(pack.extras ?? []).join("\n")} className={input} />
        </Field>
      </div>
      <Field label="Note">
        <textarea name="note" rows={2} defaultValue={pack.note ?? ""} className={input} />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Formules commandables</legend>
        <p className="mb-3 text-xs text-muted">
          La première est la formule de base. Vider le libellé pour supprimer une formule. Le prix encaissé est toujours
          relu ici côté serveur.
        </p>
        <div className="space-y-2">
          {rows.map((f, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_8rem_9rem_1fr]">
              <input name={`formula_label_${i}`} defaultValue={f?.label} placeholder="Libellé" aria-label="Libellé de la formule" className={input} />
              <input name={`formula_price_${i}`} defaultValue={f ? euros(f.price) : ""} placeholder="Prix € HT" inputMode="decimal" aria-label="Prix de la formule" className={input} />
              <input name={`formula_id_${i}`} defaultValue={f?.id} placeholder="identifiant" aria-label="Identifiant de la formule" className={input} />
              <input name={`formula_stripe_${i}`} defaultValue={f?.stripePriceId} placeholder="price_… (optionnel)" aria-label="Prix Stripe" className={input} />
            </div>
          ))}
        </div>
      </fieldset>
      <button type="submit" className={save}>
        Enregistrer « {pack.name} »
      </button>
    </form>
  );
}

export default async function AdminOffersPage({ searchParams }: PageProps<"/admin/offres">) {
  const { enregistre, erreur } = await searchParams;
  const { settings, packs, options } = await getStore().getCatalog();
  const optionRows = [...options, undefined, undefined, undefined];

  return (
    <>
      <h1 className="font-display text-3xl font-bold">Offres et réglages</h1>
      <p className="mt-2 text-sm text-muted">Les modifications sont visibles sur le site dès l&apos;enregistrement.</p>
      {enregistre && (
        <p role="status" className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Enregistré.
        </p>
      )}
      {typeof erreur === "string" && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {erreur}
        </p>
      )}

      <section className="mt-8">
        <h2 className="mb-4 font-display text-xl font-bold">Réglages</h2>
        <form action={saveSettingsAction} className={`${card} grid gap-4 sm:grid-cols-3`}>
          <Field label="Acompte (%)" hint="Proposé à la commande en ligne.">
            <input name="depositPercent" type="number" min={0} max={100} defaultValue={settings.depositPercent} required className={input} />
          </Field>
          <Field label="Remise « logo existant » (€ HT)">
            <input name="logoDiscount" defaultValue={euros(settings.logoDiscount)} inputMode="decimal" required className={input} />
          </Field>
          <Field label="Délai de livraison (jours ouvrés)" hint="Ex. « 7 à 14 ».">
            <input name="deliveryDays" defaultValue={settings.deliveryDays} required className={input} />
          </Field>
          <div className="sm:col-span-3">
            <button type="submit" className={save}>
              Enregistrer les réglages
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Offres</h2>
        <div className="space-y-6">
          {packs.map((p) => (
            <PackForm key={p.id} pack={p} />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Options à la carte</h2>
        <form action={saveOptionsAction} className={`${card} space-y-3`}>
          <p className="text-xs text-muted">Lignes vides ignorées. Cocher « Supprimer » pour retirer une option.</p>
          {optionRows.map((o, i) => (
            <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_7rem_7rem_auto_auto]">
              <input type="hidden" name={`id_${i}`} defaultValue={o?.id} />
              <input name={`name_${i}`} defaultValue={o?.name} placeholder="Nouvelle option" aria-label="Nom de l'option" className={input} />
              <input name={`price_${i}`} defaultValue={o ? euros(o.price) : ""} placeholder="€ HT" inputMode="decimal" aria-label="Prix" className={input} />
              <input name={`unit_${i}`} defaultValue={o?.unit} placeholder="unité (opt.)" aria-label="Unité" className={input} />
              <Check name={`from_${i}`} label="À partir de" defaultChecked={o?.priceFrom} />
              {o ? <Check name={`delete_${i}`} label="Supprimer" /> : <span />}
            </div>
          ))}
          <button type="submit" className={save}>
            Enregistrer les options
          </button>
        </form>
      </section>
    </>
  );
}
