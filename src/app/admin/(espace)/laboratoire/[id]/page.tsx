import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getLabDocument } from "@/lib/custom-lab/store";
import { CustomLabEditor } from "@/components/admin/CustomLabEditor";
import { listLabProjects } from "@/lib/custom-lab/projects";

export const metadata = { title: "Laboratoire — éditeur" };

export default async function LabEditorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const document = await getLabDocument(id);
  if (!document) notFound();
  const projects = await listLabProjects().catch(() => []);
  return <CustomLabEditor initial={document} projects={projects.filter((p) => !p.archived).map((p) => p.name)} />;
}
