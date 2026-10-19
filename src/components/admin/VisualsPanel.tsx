import { createVisualAction, deleteVisualAction, duplicateVisualAction } from "@/app/admin/offres-actions";
import { MaterialIcon } from "./MaterialIcon";
import { RowActionsMenu } from "./RowActionsMenu";
import { ProductVisualView } from "@/components/ProductVisualView";
import type { Option } from "@/lib/pricing";
import { readVisuals, visualUsage } from "@/lib/product-visuals";
import { ConfirmDelete, Drawer, DrawerButton, DrawerRow } from "./Drawer";
import { VisualEditor } from "./VisualFields";

const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";

// Onglet « Visuels » : bibliothèque des dessins en code des créations à la carte.
// Un clic sur une ligne ouvre le visuel ; chaque produit choisit le sien dans sa fiche (onglet Options à la carte).
export function VisualsPanel({ content, options, open, feedback }: { content: unknown; options: Option[]; open?: string; feedback: { saved: boolean; error?: string } }) {
  const visuals = readVisuals(content);
  const usage = visualUsage(options, content);
  const status = (id: string) => open === id && (
    <>
      {feedback.saved && <p role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">Enregistré.</p>}
      {feedback.error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{feedback.error}</p>}
    </>
  );
  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">Dessins des cartes « à la carte » de la page Offres, en version statique et animée. Clique sur une ligne pour modifier un visuel, puis associe-le à un produit dans sa fiche (onglet Options à la carte).</p>
        <DrawerButton drawer="visuel-nouveau" className="rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10">+ Nouveau visuel</DrawerButton>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
            <tr className="border-b border-border/50"><th className="w-28 px-4 py-3">Aperçu</th><th className="px-4 py-3">Visuel</th><th className="px-4 py-3">Utilisé par</th><th className="w-12"><span className="sr-only">Actions</span></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visuals.map((v) => (
              <DrawerRow key={v.id} drawer={`visuel-${v.id}`} label={`Modifier ${v.name}`} className={open === v.id ? "bg-accent/10" : ""}>
                <td className="px-4 py-2"><div className="h-12 w-20 text-accent"><ProductVisualView visual={v} animated={false} className="h-full w-full" /></div></td>
                <td className="px-4 py-3 font-semibold">{v.name}</td>
                <td className="px-4 py-3 text-muted">{usage[v.id]?.map((o) => o.name).join(", ") || "—"}</td>
                <td className="pr-2 text-right"><RowActionsMenu id={v.id} name={v.name} duplicateAction={duplicateVisualAction} deleteAction={deleteVisualAction} deleteNote={usage[v.id]?.length ? "Les produits qui l’utilisent reprendront le visuel choisi d’après leur nom." : "La suppression est définitive."} /></td>
              </DrawerRow>
            ))}
            {!visuals.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-muted">Aucun visuel : les cartes utilisent le dessin « scène » d&apos;origine.</td></tr>}
          </tbody>
        </table>
      </div>
      {visuals.map((v) => (
        <Drawer key={v.id} id={`visuel-${v.id}`} kicker="Visuel" title={v.name} openOnLoad={open === v.id}
          footer={<><span className="flex items-center gap-1"><form action={duplicateVisualAction}><input type="hidden" name="id" value={v.id} /><button title="Dupliquer le visuel" className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-accent"><MaterialIcon name="content_copy" className="size-4" /><span className="sr-only">Dupliquer le visuel</span></button></form><ConfirmDelete icon action={deleteVisualAction} id={v.id} label="Supprimer le visuel" question={usage[v.id]?.length ? "Es-tu sûre de vouloir supprimer ? Les produits qui l'utilisent reprendront le visuel choisi d'après leur nom." : undefined} /></span><span /></>}>
          {status(v.id)}
          <VisualEditor visual={v} />
        </Drawer>
      ))}
      <Drawer id="visuel-nouveau" kicker="Visuel" title="Nouveau visuel" openOnLoad={open === "nouveau"} footer={<><span /><button type="submit" form="visuel-creer" className={save}>Créer le visuel</button></>}>
        {status("nouveau")}
        <form id="visuel-creer" action={createVisualAction} className="space-y-5">
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Nom</span>
            <input name="name" required maxLength={80} autoComplete="off" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <p className="text-xs text-muted">Le visuel démarre avec un dessin de base, à modifier ensuite dans l&apos;éditeur de code.</p>
        </form>
      </Drawer>
    </section>
  );
}
