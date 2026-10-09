import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLabDocument, listLabSources } from "@/lib/custom-lab/store";
import { CustomLabEditor } from "@/components/admin/CustomLabEditor";
import { CustomLabOverlayEditor } from "@/components/admin/CustomLabOverlayEditor";
import { listLabProjects } from "@/lib/custom-lab/projects";

export const metadata = { title: "Laboratoire — éditeur" };

export default async function LabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const document = await getLabDocument(id);
  if (!document) notFound();
  const projects = (await listLabProjects().catch(() => [])).filter((p) => !p.archived).map((p) => p.name);
  if (document.kind === "overlay") {
    // Widgets et packs d'alertes de la bibliothèque, à placer dans les calques de l'overlay
    const sources = (await listLabSources()).map((d) => ({ id: d.id, name: d.name, project: d.project, content: { name: d.name, project: d.project, kind: d.kind, variants: d.variants } }));
    return <CustomLabOverlayEditor initial={document} sources={sources} projects={projects} />;
  }
  return <CustomLabEditor initial={document} projects={projects} />;
}
