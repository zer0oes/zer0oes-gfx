import { requireAdmin } from "@/lib/auth";
import { listLabDocuments } from "@/lib/custom-lab/store";
import { deleteLabProjectAction, importLabAction, saveLabProjectAction } from "@/app/admin/custom-lab-actions";
import { listLabProjects, type LabProject } from "@/lib/custom-lab/projects";
import { LabStorageError } from "@/lib/custom-lab/errors";
import { ClickableRow } from "@/components/admin/ClickableRow";
import { LabNewMenu } from "@/components/admin/LabNewMenu";
import { ConfirmDelete, Drawer, DrawerButton } from "@/components/admin/Drawer";

export const metadata = { title: "Laboratoire" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const kinds = { widget: { label: "Widget", tone: "border-violet-400/40 bg-violet-400/10 text-violet-300" }, alertbox: { label: "Pack d’alertes", tone: "border-pink-400/40 bg-pink-400/10 text-pink-300" }, overlay: { label: "Overlay", tone: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" } } as const;
const errorMessages: Record<string, string> = {
  setup: "Le Laboratoire n’est pas encore initialisé dans la base : sa migration doit être appliquée.",
  create: "Création impossible pour le moment. Réessaie dans un instant.",
  storage: "Le stockage est indisponible. Réessaie dans un instant.",
  import: "Import impossible : utilise un fichier projet du Laboratoire valide de moins de 2 Mo.",
  projet: "Enregistrement du projet impossible : vérifie que son nom n’est pas déjà utilisé.",
};
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const save = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110";

// Panneau d'un projet (création si project est absent)
function ProjectDrawer({ project, drawer }: { project?: LabProject; drawer: string }) {
  const form = `${drawer}-form`;
  return (
    <Drawer
      id={drawer}
      kicker="Projet"
      title={project ? project.name : "Nouveau projet"}
      footer={
        <>
          {project ? <ConfirmDelete action={deleteLabProjectAction} id={project.id} label="Supprimer le projet" question={`Supprimer le projet « ${project.name} » ? Ses créations rejoindront « Bibliothèque ».`} /> : <span />}
          <button type="submit" form={form} className={save}>{project ? "Enregistrer" : "Créer le projet"}</button>
        </>
      }
    >
      <form id={form} action={saveLabProjectAction} className="space-y-4">
        {project && <input type="hidden" name="id" value={project.id} />}
        <label className="block text-sm font-medium">Nom<input name="name" defaultValue={project?.name} required maxLength={120} className={`${input} mt-1 font-normal`} placeholder="Ex. TomaVega" /></label>
        <label className="block text-sm font-medium">Description<textarea name="description" defaultValue={project?.description} maxLength={500} rows={3} className={`${input} mt-1 font-normal`} /></label>
        {project && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="archived" defaultChecked={project.archived} className="accent-[var(--accent)]" /> Archivé (affiché en fin de liste)</label>}
        {project && <p className="text-xs text-muted">Renommer le projet met à jour toutes ses créations.</p>}
      </form>
    </Drawer>
  );
}

// Bibliothèque du Laboratoire : même présentation que les autres listes de l'admin (clic sur la ligne pour ouvrir)
export default async function LaboratoirePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const { documents, projects, message } = await Promise.all([listLabDocuments(), listLabProjects().catch(() => [] as LabProject[])])
    .then(([documents, projects]) => ({ documents, projects, message: "" }))
    .catch((error: unknown) => ({ documents: [], projects: [] as LabProject[], message: error instanceof LabStorageError ? error.message : "La bibliothèque est indisponible. Réessaie dans un instant." }));
  // Groupes : projets enregistrés (archivés en dernier), puis noms de projet utilisés par des créations mais non enregistrés
  const known = new Set(projects.map((p) => p.name));
  const loose = [...new Set(documents.map((d) => d.project).filter((name) => !known.has(name)))].sort((a, b) => a.localeCompare(b, "fr"));
  const groups = [
    ...[...projects].sort((a, b) => Number(a.archived) - Number(b.archived)).map((p) => ({ name: p.name, project: p })),
    ...loose.map((name) => ({ name, project: undefined as LabProject | undefined })),
  ];
  const small = "rounded-full border border-accent/50 px-4 py-1.5 text-sm text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Laboratoire</h1>
          <p className="mt-2 text-sm text-muted">Compose tes overlays, crée et teste tes widgets et packs d’alertes pour StreamElements et Streamlabs.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LabNewMenu disabled={Boolean(message)} className={small} projectDrawer="laboratoire-projet-nouveau" />
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
              <th scope="col" className="px-4 py-3 font-medium">Type</th>
              <th scope="col" className="px-4 py-3 font-medium">Modifiée le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map(({ name, project }) => {
              const docs = documents.filter((d) => d.project === name);
              return [
                <tr key={`g-${name}`} className="bg-surface-2/60">
                  <td colSpan={3} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display font-bold">{name}</span>
                      <span className="text-xs text-muted">{docs.length} création{docs.length > 1 ? "s" : ""}</span>
                      {project?.archived && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">Archivé</span>}
                      {project?.description && <span className="hidden truncate text-xs text-muted sm:inline">· {project.description}</span>}
                      {project ? (
                        <DrawerButton drawer={`laboratoire-projet-${project.id}`} className="ml-auto text-xs text-accent hover:underline">Modifier le projet</DrawerButton>
                      ) : (
                        <form action={saveLabProjectAction} className="ml-auto"><input type="hidden" name="name" value={name} /><button className="text-xs text-accent hover:underline">Enregistrer comme projet</button></form>
                      )}
                    </div>
                  </td>
                </tr>,
                ...docs.map((doc) => (
              <ClickableRow key={doc.id} href={`/admin/laboratoire/${doc.id}`}>
                <td className="px-4 py-3 pl-8 font-medium">{doc.name}</td>
                <td className="px-4 py-3"><span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${kinds[doc.kind].tone}`}>{kinds[doc.kind].label}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">{dateFmt.format(new Date(doc.updatedAt))}</td>
              </ClickableRow>
                )),
                ...(docs.length ? [] : [<tr key={`e-${name}`}><td colSpan={3} className="px-4 py-3 pl-8 text-xs text-muted">Aucune création dans ce projet.</td></tr>]),
              ];
            })}
            {!groups.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted">Aucune création pour l’instant : commence par un nouveau widget ou importe un projet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ProjectDrawer drawer="laboratoire-projet-nouveau" />
      {projects.map((p) => <ProjectDrawer key={p.id} project={p} drawer={`laboratoire-projet-${p.id}`} />)}
      <Drawer id="laboratoire-import" kicker="Laboratoire" title="Importer une création" footer={<><span /><button type="submit" form="laboratoire-import-form" disabled={Boolean(message)} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50">Importer</button></>}>
        <form id="laboratoire-import-form" action={importLabAction} className="space-y-3">
          <p className="text-sm text-muted">Fichier projet JSON exporté depuis le Laboratoire, ou préparé depuis ton Streamer Lab local (2 Mo maximum).</p>
          <input aria-label="Fichier projet du Laboratoire" name="file" type="file" accept=".json,application/json" required className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:text-foreground" />
        </form>
      </Drawer>
    </>
  );
}
