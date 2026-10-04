import type { Metadata } from "next";
import { NetTable, priceCases } from "@/components/admin/NetTable";
import { chargesRate, formatRate } from "@/lib/finance";
import { formatPrice, type Pack } from "@/lib/pricing";
import { watermarkLevels } from "@/lib/protection";
import { getStore } from "@/lib/store";
import {
  archivePackAction,
  createPackAction,
  deletePackAction,
  movePackAction,
  saveFinanceAction,
  saveProtectionAction,
  saveOptionsAction,
  savePackAction,
  saveSettingsAction,
} from "../../offres-actions";

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

function PackControls({ pack, first, last }: { pack: Pack; first: boolean; last: boolean }) {
  const small = "rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-30";
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
      <form action={movePackAction} className="flex gap-1">
        <input type="hidden" name="id" value={pack.id} />
        <button name="dir" value="up" disabled={first} aria-label={`Monter ${pack.name}`} className={small}>
          ↑
        </button>
        <button name="dir" value="down" disabled={last} aria-label={`Descendre ${pack.name}`} className={small}>
          ↓
        </button>
      </form>
      <form action={archivePackAction}>
        <input type="hidden" name="id" value={pack.id} />
        {pack.archived && <input type="hidden" name="restore" value="1" />}
        <button type="submit" className={small}>
          {pack.archived ? "Remettre en ligne" : "Archiver (masquer du site)"}
        </button>
      </form>
      <form action={deletePackAction} className="ml-auto flex items-center gap-2 text-muted">
        <input type="hidden" name="id" value={pack.id} />
        <label className="flex items-center gap-1">
          <input type="checkbox" name="confirm" /> confirmer
        </label>
        <button type="submit" className="rounded-full border border-red-500/40 px-3 py-1 text-red-300 hover:bg-red-500/10">
          Supprimer
        </button>
      </form>
    </div>
  );
}

function PackForm({ pack }: { pack: Pack }) {
  // Formules existantes + 2 lignes vides pour en ajouter
  const rows = [...(pack.formulas ?? []), undefined, undefined];
  return (
    <form action={savePackAction} className={`${card} space-y-4 ${pack.archived ? "opacity-70" : ""}`}>
      <input type="hidden" name="id" value={pack.id} />
      <h3 className="font-display text-xl font-bold">
        {pack.name}
        {pack.archived && <span className="ml-2 align-middle text-xs font-normal text-amber-300">archivée</span>}
      </h3>
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
  const store = getStore();
  const [{ settings, packs, options }, finance, protection] = await Promise.all([
    store.getCatalog(),
    store.getFinance(),
    store.getProtection(),
  ]);
  const euro = (cents: number) => formatPrice(cents);
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
        <h2 className="mb-2 font-display text-xl font-bold">Protection du portfolio</h2>
        <p className="mb-4 text-sm text-muted">
          Mesures dissuasives : aucun site ne peut empêcher totalement une capture d&apos;écran, mais elles compliquent la
          récupération des fichiers et signent chaque visuel.
        </p>
        <form action={saveProtectionAction} className={`${card} grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end`}>
          <Field label="Filigrane « zer0oes gfx »" hint="Affiché sur les images et vidéos du portfolio (et sur l'accueil).">
            <select name="watermark" defaultValue={protection.watermark} className={input}>
              {watermarkLevels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="pb-2">
            <Check name="blur" label="Flouter les médias quand la fenêtre perd le focus ou qu'une capture est détectée" defaultChecked={protection.blur} />
          </div>
          <button type="submit" className={save}>
            Enregistrer
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Offres</h2>
        <div className="space-y-6">
          {packs.map((p, i) => (
            <div key={p.id}>
              <PackControls pack={p} first={i === 0} last={i === packs.length - 1} />
              <PackForm pack={p} />
            </div>
          ))}
          <form action={createPackAction} className={`${card} grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end`}>
            <h3 className="font-semibold sm:col-span-4">Nouvelle offre</h3>
            <Field label="Nom">
              <input name="name" required className={input} />
            </Field>
            <Field label="Prix (€ HT)">
              <input name="price" required inputMode="decimal" className={input} />
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input type="checkbox" name="checkout" defaultChecked className="accent-[var(--accent)]" /> Commandable en ligne
            </label>
            <button type="submit" className={save}>
              Créer
            </button>
          </form>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-2 font-display text-xl font-bold">Revenu net</h2>
        <p className="mb-4 text-sm text-muted">
          Ce qu&apos;il te reste réellement sur chaque vente, après frais de paiement et cotisations.
        </p>
        <form action={saveFinanceAction} className={`${card} grid gap-4 sm:grid-cols-3`}>
          <Field label="Cotisations URSSAF (%)" hint="Micro-entreprise, activité libérale non réglementée (BNC). Taux 2026, à mettre à jour si l'URSSAF change.">
            <input name="urssafRate" defaultValue={finance.urssafRate} inputMode="decimal" required className={input} />
          </Field>
          <Field label="Formation professionnelle, CFP (%)" hint="Taux 2026.">
            <input name="cfpRate" defaultValue={finance.cfpRate} inputMode="decimal" required className={input} />
          </Field>
          <div className="space-y-2">
            <Field label="Versement libératoire (%)" hint="Impôt sur le revenu prélevé avec les cotisations, si tu as opté pour ce régime.">
              <input name="vlRate" defaultValue={finance.vlRate} inputMode="decimal" required className={input} />
            </Field>
            <Check name="vlEnabled" label="J'ai opté pour le versement libératoire" defaultChecked={finance.vlEnabled} />
          </div>
          <Field label="Frais Stripe (%)" hint="Cartes européennes standard ; vérifie dans ton tableau de bord Stripe.">
            <input name="stripePercent" defaultValue={finance.stripePercent} inputMode="decimal" required className={input} />
          </Field>
          <Field label="Frais Stripe fixes par paiement (€)">
            <input name="stripeFixed" defaultValue={euros(finance.stripeFixed)} inputMode="decimal" required className={input} />
          </Field>
          <Field label="Déclaration URSSAF" hint="Rythme choisi à la création de ta micro-entreprise (visible dans ton espace autoentrepreneur.urssaf.fr).">
            <select name="urssafPeriodicity" defaultValue={finance.urssafPeriodicity} className={input}>
              <option value="mensuelle">Mensuelle</option>
              <option value="trimestrielle">Trimestrielle</option>
            </select>
          </Field>
          <div className="sm:col-span-3">
            <Check
              name="abbySendInvoice"
              label="Factures Abby : envoyer aussi le PDF de la facture au client par e-mail"
              defaultChecked={finance.abbySendInvoice}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" className={save}>
              Enregistrer les taux
            </button>
          </div>
        </form>

        <details className={`${card} mt-4 text-sm`} open>
          <summary className="cursor-pointer font-semibold">Comment lire les tableaux</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted">
            <li><strong className="text-foreground">Encaissé HT</strong> : ce que paie le client (pas de TVA en franchise en base).</li>
            <li>
              <strong className="text-foreground">Frais Stripe</strong> : {formatRate(finance.stripePercent)} + {euro(finance.stripeFixed)} par paiement. Un
              acompte puis un solde font deux paiements, donc deux frais fixes. Sur une commande réelle, les frais réels
              Stripe remplacent cette estimation quand ils sont connus.
            </li>
            <li>
              <strong className="text-foreground">URSSAF</strong> : {formatRate(finance.urssafRate)} du montant encaissé. Les frais Stripe ne
              sont pas déductibles en micro-entreprise.
            </li>
            <li><strong className="text-foreground">CFP</strong> : {formatRate(finance.cfpRate)} du montant encaissé.</li>
            {finance.vlEnabled && (
              <li><strong className="text-foreground">Versement libératoire</strong> : {formatRate(finance.vlRate)} du montant encaissé.</li>
            )}
            <li>
              <strong className="text-foreground">Net pour toi</strong> : ce qui reste, soit environ {formatRate(Math.round((100 - chargesRate(finance)) * 10) / 10)}
              du prix moins les frais Stripe{finance.vlEnabled ? "" : ", avant impôt sur le revenu"}.
            </li>
          </ul>
        </details>

        <div className="mt-6 space-y-4">
          {packs
            .filter((p) => !p.archived)
            .flatMap((p) =>
              (p.formulas?.length ? p.formulas : [{ id: "base", label: p.name, price: p.price }]).map((f) => (
                <NetTable
                  key={`${p.id}-${f.id}`}
                  title={`${f.id === p.formulas?.[0]?.id || !p.formulas ? p.name : `${p.name} — ${f.label}`} · ${p.priceFrom ? "à partir de " : ""}${euro(f.price)} HT`}
                  cases={priceCases(f.price, settings, p.checkout)}
                  finance={finance}
                />
              )),
            )}
          <NetTable
            title="Options à la carte (payées en une fois)"
            cases={options.map((o) => ({ label: `${o.name}${o.priceFrom ? " (à partir de)" : ""}`, payments: [o.price] }))}
            finance={finance}
          />
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
