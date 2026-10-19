import type { CSSProperties } from "react";
import { createCategoryAction, deleteCategoryAction, duplicateCategoryAction, reorderCategoriesAction, saveCategoryAction } from "@/app/admin/offres-actions";
import { MaterialIcon } from "./MaterialIcon";
import { RowActionsMenu } from "./RowActionsMenu";
import { SortHandle, SortableRows } from "./SortableRows";
import { TranslationInput, TranslationTabs } from "./TranslationTabs";
import { ConfirmDelete, Drawer, DrawerButton, DrawerRow } from "./Drawer";
import { translationValues } from "@/lib/admin-translations";
import type { Option } from "@/lib/pricing";
import { categoryUsage, type ProductCategory } from "@/lib/product-categories";

const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// Pastille du filtre, comme sur la page Offres
function Pill({ category }: { category: ProductCategory }) {
  return <span style={{ "--filter-color": category.color } as CSSProperties} className="inline-block whitespace-nowrap rounded-full border border-[color-mix(in_srgb,var(--filter-color)_40%,var(--border))] bg-surface px-3 py-1 text-xs font-medium text-[var(--filter-color)]">{category.name}</span>;
}

// Onglet « Catégories » : filtres de la page Offres et couleur des cartes à la carte.
// Un clic sur une ligne ouvre la catégorie ; chaque produit choisit la sienne dans sa fiche (onglet Options à la carte).
export function CategoriesPanel({ content, categories, options, open, feedback }: { content: unknown; categories: ProductCategory[]; options: Option[]; open?: string; feedback: { saved: boolean; error?: string } }) {
  const usage = categoryUsage(options, categories);
  const stored = translationValues(content);
  const status = (id: string) => open === id && (
    <>
      {feedback.saved && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Enregistré.</p>}
      {feedback.error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{feedback.error}</p>}
    </>
  );
  const deleteNote = (id: string) => (usage[id]?.length ? "Ses produits reprendront la catégorie devinée d’après leur nom." : undefined);
  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-5xl text-sm text-muted">Filtres des créations à la carte sur la page Offres et couleur de leurs cartes. Clique sur une ligne pour modifier une catégorie, tire-la par sa poignée pour changer l&apos;ordre des filtres. Chaque produit choisit sa catégorie dans sa fiche (onglet Options à la carte). Une catégorie sans produit n&apos;apparaît pas sur le site.</p>
        <DrawerButton drawer="categorie-nouvelle" className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">+ Nouvelle catégorie</DrawerButton>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-border/50"><th className="w-12 px-2 py-3"><span className="sr-only">Ordre</span></th><th className="w-56 px-4 py-3">Catégorie</th><th className="px-4 py-3">Produits</th><th className="w-12"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <SortableRows onReorder={reorderCategoriesAction}>
            {categories.map((c) => (
              <DrawerRow key={c.id} sortId={c.id} drawer={`categorie-${c.id}`} label={`Modifier ${c.name}`} className={open === c.id ? "bg-accent/10" : ""}>
                <td className="px-2 py-3"><SortHandle id={c.id} label={c.name} /></td>
                <td className="px-4 py-3"><Pill category={c} /></td>
                <td className="max-w-md truncate px-4 py-3 text-muted" title={usage[c.id]?.map((o) => o.name).join(", ")} data-tip-if-truncated>{usage[c.id]?.map((o) => o.name).join(", ") || "—"}</td>
                <td className="pr-2 text-right"><RowActionsMenu id={c.id} name={c.name} duplicateAction={duplicateCategoryAction} deleteAction={deleteCategoryAction} deleteNote={deleteNote(c.id) ?? "La suppression est définitive."} /></td>
              </DrawerRow>
            ))}
          </SortableRows>
          {!categories.length && <tbody><tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Aucune catégorie : la page Offres n&apos;affiche que le filtre « Tout ».</td></tr></tbody>}
        </table>
      </div>
      {categories.map((c) => (
        <Drawer key={c.id} id={`categorie-${c.id}`} kicker="Catégorie" title={c.name} openOnLoad={open === c.id}
          footer={<><span className="flex items-center gap-1"><form action={duplicateCategoryAction}><input type="hidden" name="id" value={c.id} /><button title="Dupliquer la catégorie" className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent"><MaterialIcon name="content_copy" className="size-4" /><span className="sr-only">Dupliquer la catégorie</span></button></form><ConfirmDelete icon action={deleteCategoryAction} id={c.id} label="Supprimer la catégorie" question={deleteNote(c.id) && `Es-tu sûre de vouloir supprimer ? ${deleteNote(c.id)}`} /></span><button type="submit" form={`categorie-form-${c.id}`} className={save}>Enregistrer la catégorie</button></>}>
          {status(c.id)}
          <TranslationTabs compact stored={stored}>
            <form id={`categorie-form-${c.id}`} action={saveCategoryAction} className="space-y-5">
              <input type="hidden" name="id" value={c.id} />
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Nom</span>
                <TranslationInput translationKey={`translation:categorie:${c.id}:name`} name="name" defaultValue={c.name} required maxLength={60} className={input} />
                <span className="mt-1 block text-xs text-muted">Texte du filtre sur la page Offres.</span>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Couleur</span>
                <input type="color" name="color" defaultValue={c.color} className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background p-1" />
                <span className="mt-1 block text-xs text-muted">Couleur du filtre, du cadre et du dessin des cartes de cette catégorie.</span>
              </label>
              <div>
                <span className="mb-2 block text-sm font-medium">Produits</span>
                <p className="text-sm text-muted">{usage[c.id]?.map((o) => o.name).join(", ") || "Aucun produit pour l’instant."}</p>
              </div>
            </form>
          </TranslationTabs>
        </Drawer>
      ))}
      <Drawer id="categorie-nouvelle" kicker="Catégorie" title="Nouvelle catégorie" openOnLoad={open === "nouvelle"} footer={<><span /><button type="submit" form="categorie-creer" className={save}>Créer la catégorie</button></>}>
        {status("nouvelle")}
        <form id="categorie-creer" action={createCategoryAction} className="space-y-5">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Nom</span>
            <input name="name" required maxLength={60} autoComplete="off" className={input} />
          </label>
          <p className="text-xs text-muted">Tu choisiras ensuite sa couleur, son nom anglais et ses produits.</p>
        </form>
      </Drawer>
    </section>
  );
}
