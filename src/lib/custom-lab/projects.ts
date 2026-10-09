import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfigured, supabaseSecretKey, supabaseUrl } from "@/lib/env";
import { LabStorageError } from "./errors";

// Projets du Laboratoire (table privée custom_lab_projects). Les créations désignent leur projet par son nom :
// renommer un projet met à jour les créations concernées. Les pages et actions vérifient requireAdmin.

export type LabProject = { id: string; name: string; description: string; sortOrder: number; archived: boolean };

const database = () => createClient(supabaseUrl()!, supabaseSecretKey()!, { auth: { persistSession: false, autoRefreshToken: false } });
const fromRow = (r: Record<string, unknown>): LabProject => ({
  id: r.id as string,
  name: r.name as string,
  description: (r.description as string) ?? "",
  sortOrder: (r.sort_order as number) ?? 0,
  archived: Boolean(r.archived),
});

export async function listLabProjects(): Promise<LabProject[]> {
  if (!supabaseConfigured()) return [];
  const { data, error } = await database().from("custom_lab_projects").select("*").order("sort_order").order("name");
  if (error) throw new LabStorageError(error.code);
  return data.map(fromRow);
}

const clean = (name: string) => name.replace(/\s+/g, " ").trim().slice(0, 120);

export async function createLabProject(name: string, description: string) {
  const db = database();
  const { data: last } = await db.from("custom_lab_projects").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from("custom_lab_projects")
    .insert({ name: clean(name), description: description.trim().slice(0, 500), sort_order: ((last?.sort_order as number | undefined) ?? 0) + 10 })
    .select()
    .single();
  if (error) throw new LabStorageError(error.code);
  return fromRow(data);
}

// Modifie un projet ; un nouveau nom est reporté sur toutes les créations du projet
export async function updateLabProject(id: string, patch: { name: string; description: string; archived: boolean }) {
  const db = database();
  const { data: current, error: readError } = await db.from("custom_lab_projects").select("*").eq("id", id).maybeSingle();
  if (readError) throw new LabStorageError(readError.code);
  if (!current) throw new Error("Projet introuvable.");
  const name = clean(patch.name);
  const { error } = await db
    .from("custom_lab_projects")
    .update({ name, description: patch.description.trim().slice(0, 500), archived: patch.archived, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new LabStorageError(error.code);
  if (name !== current.name) await renameInDocuments(current.name as string, name);
}

// Supprime un projet ; ses créations rejoignent le projet « Bibliothèque »
export async function deleteLabProject(id: string) {
  const db = database();
  const { data: current } = await db.from("custom_lab_projects").select("name").eq("id", id).maybeSingle();
  if (!current) return;
  await renameInDocuments(current.name as string, "Bibliothèque");
  const { error } = await db.from("custom_lab_projects").delete().eq("id", id);
  if (error) throw new LabStorageError(error.code);
}

async function renameInDocuments(from: string, to: string) {
  const db = database();
  const { data, error } = await db.from("custom_lab_documents").select("id, content, revision").eq("content->>project", from);
  if (error) throw new LabStorageError(error.code);
  for (const doc of data) {
    const { error: e } = await db
      .from("custom_lab_documents")
      .update({ content: { ...(doc.content as Record<string, unknown>), project: to }, revision: (doc.revision as number) + 1, updated_at: new Date().toISOString() })
      .eq("id", doc.id)
      .eq("revision", doc.revision);
    if (e) throw new LabStorageError(e.code);
  }
}
