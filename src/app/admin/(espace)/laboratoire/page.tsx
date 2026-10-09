import { requireAdmin } from "@/lib/auth";
import { listLabDocuments } from "@/lib/custom-lab/store";
import { createLabAction, importLabAction } from "@/app/admin/custom-lab-actions";
import { LabStorageError } from "@/lib/custom-lab/errors";
import { ClickableRow } from "@/components/admin/ClickableRow";
import { Drawer, DrawerButton } from "@/components/admin/Drawer";

export const metadata = { title: "Laboratoire" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const kinds = { widget: { label: "Widget", tone: "border-violet-400/40 bg-violet-400/10 text-violet-300" }, alertbox: { label: "Pack d’alertes", tone: "border-pink-400/40 bg-pink-400/10 text-pink-300" } } as const;
const errorMessages: Record<string, string> = {
  setup: "Le Laboratoire n’est pas encore initialisé dans la base : sa migration doit être appliquée.",
  create: "Création impossible pour le moment. Réessaie dans un instant.",
  storage: "Le stockage est indisponible. Réessaie dans un instant.",
  import: "Import impossible : utilise un fichier projet du Laboratoire valide de moins de 2 Mo.",
};

// Bibliothèque du Laboratoire : même présentation que les autres listes de l'admin (clic sur la ligne pour ouvrir)
export default async function LaboratoirePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const { documents, message } = await listLabDocuments()
    .then((documents) => ({ documents, message: "" }))
    .catch((error: unknown) => ({ documents: [], message: error instanceof LabStorageError ? error.message : "La bibliothèque est indisponible. Réessaie dans un instant." }));
  const small = "rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Laboratoire</h1>
          <p className="mt-2 text-sm text-muted">Crée et teste tes widgets et packs d’alertes pour StreamElements et Streamlabs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["widget", "alertbox"] as const).map((kind) => (
            <form key={kind} action={createLabAction}>
              <input type="hidden" name="kind" value={kind} />
              <button disabled={Boolean(message)} className={small}>+ {kind === "widget" ? "Nouveau widget" : "Nouveau pack d’alertes"}</button>
            </form>
          ))}
          <DrawerButton drawer="laboratoire-import" className={small}>Importer</DrawerButton>
        </div>
      </div>

      {message && <p role="alert" className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">{message}</p>}
      {!message && params.error && errorMessages[params.error] && <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{errorMessages[params.error]}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Création</th>
              <th scope="col" className="px-4 py-3 font-medium">Projet</th>
              <th scope="col" className="px-4 py-3 font-medium">Type</th>
              <th scope="col" className="px-4 py-3 font-medium">Modifiée le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.map((doc) => (
              <ClickableRow key={doc.id} href={`/admin/laboratoire/${doc.id}`}>
                <td className="px-4 py-3 font-medium">{doc.name}</td>
                <td className="px-4 py-3 text-muted">{doc.project || "—"}</td>
                <td className="px-4 py-3"><span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${kinds[doc.kind].tone}`}>{kinds[doc.kind].label}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{dateFmt.format(new Date(doc.updatedAt))}</td>
              </ClickableRow>
            ))}
            {!documents.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">Aucune création pour l’instant : commence par un nouveau widget ou importe un projet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer id="laboratoire-import" kicker="Laboratoire" title="Importer une création" footer={<><span /><button type="submit" form="laboratoire-import-form" disabled={Boolean(message)} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50">Importer</button></>}>
        <form id="laboratoire-import-form" action={importLabAction} className="space-y-3">
          <p className="text-sm text-muted">Fichier projet JSON exporté depuis le Laboratoire, ou préparé depuis ton Streamer Lab local (2 Mo maximum).</p>
          <input aria-label="Fichier projet du Laboratoire" name="file" type="file" accept=".json,application/json" required className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:text-foreground" />
        </form>
      </Drawer>
    </>
  );
}
