import { TranslationInput } from "@/components/admin/TranslationTabs";
import type { CompositionOption } from "@/components/admin/PackCompositionField";
import { PackFormulasField } from "@/components/admin/PackFormulasField";
import { compositionPriceLabel, MAX_CORRECTIONS, readComposition, readCorrections } from "@/lib/pack-composition";
import type { ProductCategory } from "@/lib/product-categories";
import type { Option, Pack } from "@/lib/pricing";
import { savePackAction } from "@/app/admin/offres-actions";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const card = "rounded-2xl border border-border bg-surface p-5 sm:p-6";
const euros = (cents: number) => (cents / 100).toString().replace(".", ",");

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

// Produits à la carte proposés dans la composition des offres
export function compositionOptions(options: Option[], categories: ProductCategory[]): CompositionOption[] {
  return options.map((o) => ({
    ...o,
    priceLabel: compositionPriceLabel(o),
    categoryName: categories.find((c) => c.id === o.category)?.name ?? "Autres",
  }));
}

// Fiche d'une offre (page Offres > une offre) : textes du site à gauche, formules et composition à droite
export function PackForm({ pack, formId, options, content }: { pack: Pack; formId: string; options: CompositionOption[]; content: unknown }) {
  return (
    <form id={formId} action={savePackAction} className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <input type="hidden" name="id" value={pack.id} />
      <div className={`${card} space-y-4`}>
        <h2 className="font-display text-lg font-bold">Textes du site</h2>
        <Field label="Nom">
          <TranslationInput translationKey={`translation:pack:${pack.id}:name`} name="name" defaultValue={pack.name} required className={input} />
        </Field>
        <Field label="Prix affiché (€)" hint="Prix de la formule de base, ou prix « à partir de ».">
          <input name="price" defaultValue={euros(pack.price)} inputMode="decimal" required className={input} />
        </Field>
        <Field label="Accroche">
          <TranslationInput multiline rows={2} translationKey={`translation:pack:${pack.id}:tagline`} name="tagline" defaultValue={pack.tagline} className={input} />
        </Field>
        <div className="flex flex-col gap-2">
          <Check name="checkout" label="Commandable en ligne (sinon : sur devis)" defaultChecked={pack.checkout} />
          <Check name="priceFrom" label="Prix « à partir de »" defaultChecked={pack.priceFrom} />
          <Check name="highlight" label="Mise en avant" defaultChecked={pack.highlight} />
        </div>
        <Field label="Corrections incluses par élément" hint="Affiché dans les livrables du site (texte modifiable dans les textes de la page Offres) et limite les demandes de modification du client pour chaque élément de ses commandes de ce pack.">
          <input type="number" name="corrections" min={0} max={MAX_CORRECTIONS} step={1} required defaultValue={readCorrections(content, pack.id)} className={`${input} max-w-[7rem]`} />
        </Field>
        <Field label="Livrables en plus" hint="Un par ligne. Les produits du pack de base (composition) et la ligne des corrections s'affichent automatiquement en tête des livrables ; ajoute ici le reste (intégration…).">
          <TranslationInput multiline translationKey={`translation:pack:${pack.id}:deliverables`} name="deliverables" rows={4} defaultValue={(pack.ownDeliverables ?? pack.deliverables).join("\n")} className={input} />
        </Field>
        {/* Offre commandable : les options du site viennent des formules et de leur composition */}
        {!pack.checkout && (
          <Field label="Exemples d'ajouts sur devis" hint="Un par ligne, affichés sous les livrables.">
            <TranslationInput multiline translationKey={`translation:pack:${pack.id}:extras`} name="extras" rows={5} defaultValue={(pack.extras ?? []).join("\n")} className={input} />
          </Field>
        )}
      </div>
      <div className={`${card} space-y-6`}>
        <PackFormulasField formId={formId} packId={pack.id} packPrice={pack.price} formulas={pack.formulas ?? []} options={options} initial={readComposition(content, pack.id)} />
      </div>
    </form>
  );
}
