import { OptionRows } from "@/components/admin/OptionRows";
import { MarketingPanel } from "@/components/admin/MarketingPanel";
import { AffiliatePanel } from "@/components/admin/AffiliatePanel";
import { TranslationTabs, TranslationInput } from "@/components/admin/TranslationTabs";
import { translationValues } from "@/lib/admin-translations";
import { homeDefaultsEn, offersPageFields, resolveHome } from "@/lib/home-content";
import { saveOffersPageAction } from "../../portfolio-actions";
import type { Metadata } from "next";
import Link from "next/link";
import { NetTable, priceCases } from "@/components/admin/NetTable";
import { chargesRate, formatRate, netBreakdown, type FinanceSettings } from "@/lib/finance";
import { formatPrice, type Pack, type PricingSettings } from "@/lib/pricing";
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

// La page est découpée en onglets : on n'affiche qu'une partie à la fois.
const tabs = [
  { id: "offres", label: "Offres" },
  { id: "options", label: "Options à la carte" },
  { id: "promotions", label: "Promotions et fidélité" },
  { id: "affiliation", label: "Affiliation" },
  { id: "reglages", label: "Réglages" },
  { id: "cotisations", label: "Frais et cotisations" },
  { id: "simulateur", label: "Simulateur de revenus" },
] as const;
type Tab = (typeof tabs)[number]["id"];

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

function Intro({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 max-w-2xl text-sm text-muted">{children}</p>;
}

function PackControls({ pack, first, last }: { pack: Pack; first: boolean; last: boolean }) {
  const small = "rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-30";
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs">
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
    <form action={savePackAction} className="space-y-4">
      <input type="hidden" name="id" value={pack.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom">
          <TranslationInput translationKey={`translation:pack:${pack.id}:name`} name="name" defaultValue={pack.name} required className={input} />
        </Field>
        <Field label="Prix affiché (€ HT)" hint="Prix de la formule de base, ou prix « à partir de ».">
          <input name="price" defaultValue={euros(pack.price)} inputMode="decimal" required className={input} />
        </Field>
      </div>
      <Field label="Accroche">
        <TranslationInput translationKey={`translation:pack:${pack.id}:tagline`} name="tagline" defaultValue={pack.tagline} className={input} />
      </Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Check name="checkout" label="Commandable en ligne (sinon : sur devis)" defaultChecked={pack.checkout} />
        <Check name="priceFrom" label="Prix « à partir de »" defaultChecked={pack.priceFrom} />
        <Check name="highlight" label="Mise en avant" defaultChecked={pack.highlight} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Livrables" hint="Un par ligne.">
          <TranslationInput multiline translationKey={`translation:pack:${pack.id}:deliverables`} name="deliverables" rows={5} defaultValue={pack.deliverables.join("\n")} className={input} />
        </Field>
        <Field label="Options de l'offre" hint="Une par ligne, affichées sous les livrables. Offre sur devis : exemples de créations (« Par exemple »).">
          <TranslationInput multiline translationKey={`translation:pack:${pack.id}:extras`} name="extras" rows={5} defaultValue={(pack.extras ?? []).join("\n")} className={input} />
        </Field>
      </div>
      <Field label="Note">
        <TranslationInput multiline translationKey={`translation:pack:${pack.id}:note`} name="note" rows={2} defaultValue={pack.note ?? ""} className={input} />
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
              <TranslationInput translationKey={`translation:pack:${pack.id}:formula:${f?.id ?? `new-${i}`}:label`} name={`formula_label_${i}`} defaultValue={f?.label} placeholder="Libellé" aria-label="Libellé de la formule" className={input} />
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

// Résumé d'une offre fermée : « Actif • 4 formules • acompte activé »
function packSummary(p: Pack, s: PricingSettings) {
  const n = p.formulas?.length ?? 0;
  return [
    p.archived ? "Archivée" : "Active",
    p.checkout ? `${n} formule${n > 1 ? "s" : ""}` : "Sur devis",
    p.checkout && s.depositPercent > 0 ? `acompte ${s.depositPercent} %` : null,
    p.highlight ? "mise en avant" : null,
  ].filter(Boolean);
}

// Ventes simulées : prix de base, payé en une fois
function simulate(packs: Pack[], qty: (id: string) => number, finance: FinanceSettings) {
  let gross = 0;
  let net = 0;
  let sales = 0;
  for (const p of packs) {
    const n = qty(p.id);
    if (!n) continue;
    const r = netBreakdown([p.formulas?.[0]?.price ?? p.price], finance);
    gross += r.gross * n;
    net += r.net * n;
    sales += n;
  }
  return { gross, net, charges: gross - net, sales };
}

export default async function AdminOffersPage({ searchParams }: PageProps<"/admin/offres">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const { enregistre, erreur } = sp;
  const openPack = one(sp.offre);
  const tab: Tab = tabs.some((t) => t.id === one(sp.onglet)) ? (one(sp.onglet) as Tab) : "offres";

  const store = getStore();
  const [{ settings, packs, options }, finance, protection] = await Promise.all([
    store.getCatalog(),
    store.getFinance(),
    store.getProtection(),
  ]);
  const euro = (cents: number) => formatPrice(cents);

  const active = packs.filter((p) => !p.archived);

  // Simulateur : ventes par mois saisies (paramètres v_<offre>)
  const qty = (id: string) => Math.min(99, Math.max(0, Math.floor(Number(one(sp[`v_${id}`]) ?? 0) || 0)));
  const sim = simulate(active, qty, finance);

  const translationContent = await getStore().getHomeContent();

  return (
    <TranslationTabs stored={translationValues(translationContent)}>
      <h1 className="font-display text-3xl font-bold">Offres et réglages</h1>
      <p className="mt-2 text-sm text-muted">Les modifications sont visibles sur le site dès l&apos;enregistrement.</p>

      <nav aria-label="Parties de la page" className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={t.id === "offres" ? "/admin/offres" : `/admin/offres?onglet=${t.id}`}
            aria-current={tab === t.id ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition ${
              tab === t.id ? "border-accent bg-accent font-semibold text-background" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

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

      {tab === "promotions" && <MarketingPanel />}
      {tab === "affiliation" && <AffiliatePanel />}
      {tab === "offres" && (
        <section className="mt-6">
          <details className={`${card} mb-6`}>
          <summary className="cursor-pointer font-semibold">Textes de la page Offres</summary>
          <form action={saveOffersPageAction} className="mt-4 space-y-4">
            <h2 className="font-semibold">Textes de la page Offres</h2>
            <p className="text-xs text-muted">En-tête et explication sous les cartes Packs. Un texte vidé reprend la version d’origine.</p>
            {offersPageFields.map((field) => (
              <Field key={field.key} label={field.label}>
                <TranslationInput multiline={field.kind === "long"} translationKey={`en:${field.key}`} englishDefault={homeDefaultsEn[field.key]} name={`h:${field.key}`} defaultValue={resolveHome(translationContent).text(field.key)} rows={3} maxLength={field.max ?? 1200} className={input} />
              </Field>
            ))}
            <button type="submit" className={save}>Enregistrer les textes</button>
          </form>
          </details>
          <Intro>Clique sur une offre pour la modifier. L&apos;ordre ici est celui du site.</Intro>
          <div className="mb-6 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wider text-muted"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Offre</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Ordre</th></tr></thead>
              <tbody className="divide-y divide-border">
                {packs.map((p, i) => (
                  <tr key={p.id} className={`${openPack === p.id ? "bg-accent/10" : "hover:bg-surface/50"} ${p.archived ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3 text-muted">{i + 1}</td>
                    <td className="px-4 py-3"><Link href={`/admin/offres?offre=${encodeURIComponent(p.id)}#offre-${p.id}`} className="font-semibold hover:text-accent">{p.name}</Link><p className="mt-1 text-xs text-muted">{p.tagline}</p></td>
                    <td className="whitespace-nowrap px-4 py-3">{p.priceFrom ? "À partir de " : ""}{euro(p.price)}</td>
                    <td className="px-4 py-3 text-muted">{p.archived ? "Archivée" : p.checkout ? "En ligne" : "Sur devis"}</td>
                    <td className="px-4 py-3"><div className="flex gap-2">{(["up", "down"] as const).map((direction) => <form key={direction} action={movePackAction}><input type="hidden" name="id" value={p.id} /><button name="dir" value={direction} disabled={direction === "up" ? i === 0 : i === packs.length - 1} aria-label={`${direction === "up" ? "Monter" : "Descendre"} ${p.name}`} className="rounded border border-border px-2 py-1 text-accent disabled:opacity-30">{direction === "up" ? "↑" : "↓"}</button></form>)}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            {packs.map((p, i) => (
              <details key={p.id} id={`offre-${p.id}`} hidden={openPack !== p.id} open={openPack === p.id} className={`group ${card} p-0 sm:p-0 ${p.archived ? "opacity-70" : ""}`}>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span>
                    <span className="font-display text-lg font-bold">
                      {p.name} — {p.priceFrom ? "à partir de " : ""}
                      {euro(p.price)}
                    </span>
                    <span className="mt-1 block text-xs text-muted">{packSummary(p, settings).join(" • ")}</span>
                  </span>
                  <span className="text-sm text-accent">
                    <span className="group-open:hidden">Modifier ↓</span>
                    <span className="hidden group-open:inline">Fermer ↑</span>
                  </span>
                </summary>
                <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
                  <PackForm pack={p} />
                  <PackControls pack={p} first={i === 0} last={i === packs.length - 1} />
                </div>
              </details>
            ))}
            <details className={`${card} p-0 sm:p-0`}>
              <summary className="cursor-pointer list-none p-5 font-semibold text-accent sm:px-6 [&::-webkit-details-marker]:hidden">+ Nouvelle offre</summary>
              <form action={createPackAction} className="grid gap-3 px-5 pb-5 sm:grid-cols-[2fr_1fr_auto_auto] sm:items-end sm:px-6 sm:pb-6">
                <Field label="Nom">
                  <TranslationInput translationKey="translation:pack:new:name" name="name" required className={input} />
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
            </details>
          </div>
        </section>
      )}

      {tab === "options" && (
        <section className="mt-6">
          <Intro>Options proposées en plus des offres (page Offres et commande).</Intro>
          <form action={saveOptionsAction} className="space-y-4">
            <p className="text-xs text-muted">Clique sur une option pour la modifier, ou sélectionne plusieurs options pour les supprimer.</p>
            <OptionRows options={options} />
            <button type="submit" className={save}>
              Enregistrer les options
            </button>
          </form>
        </section>
      )}

      {tab === "reglages" && (
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="mb-4 font-display text-xl font-bold">Commande</h2>
            <form action={saveSettingsAction} className={`${card} grid gap-4 sm:grid-cols-3`}>
              <Field label="Acompte (%)" hint="Proposé à la commande en ligne.">
                <input name="depositPercent" type="number" min={0} max={100} defaultValue={settings.depositPercent} required className={input} />
              </Field>
              <Field label="Remise « logo existant » (€ HT)">
                <input name="logoDiscount" defaultValue={euros(settings.logoDiscount)} inputMode="decimal" required className={input} />
              </Field>
              <Field label="Délai de livraison (jours ouvrés)" hint="Ex. « 7 à 14 ».">
                <TranslationInput translationKey="translation:settings:deliveryDays" englishDefault={settings.deliveryDays.replace(" à ", " to ")} name="deliveryDays" defaultValue={settings.deliveryDays} required className={input} />
              </Field>
              <div className="sm:col-span-3">
                <button type="submit" className={save}>
                  Enregistrer les réglages
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="mb-2 font-display text-xl font-bold">Protection du portfolio</h2>
            <Intro>
              Mesures dissuasives : aucun site ne peut empêcher totalement une capture d&apos;écran, mais elles compliquent la
              récupération des fichiers et signent chaque visuel.
            </Intro>
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
        </div>
      )}

      {tab === "cotisations" && (
        <section className="mt-6">
          <Intro>Taux utilisés pour le tableau de bord, la déclaration URSSAF et le simulateur de revenus.</Intro>
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
              <Check name="abbySendInvoice" label="Factures Abby : envoyer aussi le PDF de la facture au client par e-mail" defaultChecked={finance.abbySendInvoice} />
            </div>
            <div className="flex items-end">
              <button type="submit" className={save}>
                Enregistrer les taux
              </button>
            </div>
          </form>
        </section>
      )}

      {tab === "simulateur" && (
        <section className="mt-6 space-y-6">
          <Intro>
            Ce qu&apos;il te reste réellement après frais de paiement et cotisations (taux de l&apos;onglet{" "}
            <Link href="/admin/offres?onglet=cotisations" className="text-accent hover:underline">
              Frais et cotisations
            </Link>
            ).
          </Intro>

          {/* Projection : ventes par mois → net mensuel et annuel */}
          <form method="get" action="/admin/offres" className={card}>
            <input type="hidden" name="onglet" value="simulateur" />
            <h2 className="font-semibold">Combien je gagne si je vends…</h2>
            <p className="mt-1 text-xs text-muted">Ventes par mois, au prix de base payé en une fois.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {active.map((p) => (
                <Field key={p.id} label={`${p.name} (${euro(p.formulas?.[0]?.price ?? p.price)})`}>
                  <input name={`v_${p.id}`} type="number" min={0} max={99} defaultValue={qty(p.id) || ""} placeholder="0" className={input} />
                </Field>
              ))}
            </div>
            <button type="submit" className={`${save} mt-4`}>
              Calculer
            </button>
            {sim.sales > 0 && (
              <dl className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-4">
                {[
                  ["Encaissé / mois", euro(sim.gross)],
                  ["Frais et cotisations", `−${euro(sim.charges)}`],
                  ["Net / mois", euro(sim.net)],
                  ["Net / an", euro(sim.net * 12)],
                ].map(([k, v], i) => (
                  <div key={k} className="rounded-xl bg-background p-3">
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className={`mt-1 font-display text-xl font-bold ${i === 2 ? "text-gradient" : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </form>

          <details className={`${card} text-sm`}>
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

          <div>
            <h2 className="mb-3 font-semibold">Détail par offre</h2>
            <div className="space-y-3">
              {active.map((p) => {
                const formulas = p.formulas?.length ? p.formulas : [{ id: "base", label: p.name, price: p.price }];
                const base = netBreakdown([formulas[0].price], finance);
                return (
                  <details key={p.id} className={`${card} p-0 sm:p-0`}>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 sm:px-6 [&::-webkit-details-marker]:hidden">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-sm text-muted">
                        {euro(base.gross)} → <strong className="text-foreground">{euro(base.net)} net</strong> en une fois · détail ↓
                      </span>
                    </summary>
                    <div className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
                      {formulas.map((f) => (
                        <NetTable
                          key={f.id}
                          title={`${f.id === formulas[0].id ? p.name : `${p.name} — ${f.label}`} · ${p.priceFrom ? "à partir de " : ""}${euro(f.price)} HT`}
                          cases={priceCases(f.price, settings, p.checkout)}
                          finance={finance}
                        />
                      ))}
                    </div>
                  </details>
                );
              })}
              {options.length > 0 && (
                <details className={`${card} p-0 sm:p-0`}>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-5 sm:px-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-semibold">Options à la carte</span>
                    <span className="text-sm text-muted">payées en une fois · détail ↓</span>
                  </summary>
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <NetTable
                      title="Options à la carte (payées en une fois)"
                      cases={options.map((o) => ({ label: `${o.name}${o.priceFrom ? " (à partir de)" : ""}`, payments: [o.price] }))}
                      finance={finance}
                    />
                  </div>
                </details>
              )}
            </div>
          </div>
        </section>
      )}
    </TranslationTabs>
  );
}
