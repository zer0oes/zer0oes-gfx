import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLabDocument, listLabDocuments, listLabSources } from "@/lib/custom-lab/store";
import { CustomLabEditor } from "@/components/admin/CustomLabEditor";
import { CustomLabOverlayEditor } from "@/components/admin/CustomLabOverlayEditor";
import { listLabProjects } from "@/lib/custom-lab/projects";
import { resolveLabTexts } from "@/lib/custom-lab/lab-texts";
import { getStore } from "@/lib/store";

export const metadata = { title: "Laboratoire — éditeur" };

export default async function LabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const document = await getLabDocument(id);
  if (!document) notFound();
  const [registered, creations] = await Promise.all([listLabProjects().catch(() => []), listLabDocuments()]);
  const archived = new Set(registered.filter((p) => p.archived).map((p) => p.name));
  const projects = [...new Set(["Bibliothèque", document.project, ...registered.filter((p) => !p.archived).map((p) => p.name), ...creations.map((creation) => creation.project).filter((name) => !archived.has(name))])].sort((a, b) => a.localeCompare(b, "fr"));
  if (document.kind === "overlay") {
    // Widgets et packs d'alertes de la bibliothèque, à placer dans les calques de l'overlay
    const sources = (await listLabSources()).map((d) => ({ id: d.id, name: d.name, project: d.project, content: { name: d.name, project: d.project, kind: d.kind, variants: d.variants, ...(d.size ? { size: d.size } : {}) } }));
    return <CustomLabOverlayEditor initial={document} sources={sources} projects={projects} />;
  }
  const labTexts = resolveLabTexts(await getStore().getHomeContent().catch(() => null));
  return <CustomLabEditor initial={document} projects={projects} labTexts={labTexts} />;
}
