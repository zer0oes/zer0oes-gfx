import "server-only";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { assertNotProduction, localStoreAllowed, supabaseConfigured, supabaseSecretKey, supabaseUrl } from "@/lib/env";
import { parseLabContent, validLabId } from "./model";
import type { LabContent, LabDocument, LabSummary } from "./types";
import { LabStorageError } from "./errors";

// DAL privée : les pages et actions doivent vérifier requireAdmin avant tout accès.
const directory = path.join(process.cwd(), ".data", "custom-lab");
const file = path.join(directory, "library.json");
let queue: Promise<unknown> = Promise.resolve();
const database = () => createClient(supabaseUrl()!, supabaseSecretKey()!, { auth: { persistSession: false, autoRefreshToken: false } });
const summary = ({ id, name, project, kind, revision, updatedAt }: LabDocument): LabSummary => ({ id, name, project, kind, revision, updatedAt });
const fromRow = (row: Record<string, unknown>): LabDocument => ({ ...parseLabContent(row.content), id: row.id as string, revision: row.revision as number, createdAt: row.created_at as string, updatedAt: row.updated_at as string });

async function localRead(): Promise<LabDocument[]> {
  assertNotProduction("La bibliothèque locale du Laboratoire");
  try { return JSON.parse(await fs.readFile(file, "utf8")) as LabDocument[]; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return []; throw error; }
}

export async function listLabDocuments(): Promise<LabSummary[]> {
  if (supabaseConfigured()) {
    const { data, error } = await database().from("custom_lab_documents").select("*").order("updated_at", { ascending: false });
    if (error) throw new LabStorageError(error.code);
    return data.map(fromRow).map(summary);
  }
  if (!localStoreAllowed()) return [];
  return (await localRead()).map(summary).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getLabDocument(id: string): Promise<LabDocument | null> {
  if (!validLabId(id)) return null;
  if (supabaseConfigured()) {
    const { data, error } = await database().from("custom_lab_documents").select("*").eq("id", id).maybeSingle();
    if (error) throw new LabStorageError(error.code);
    return data ? fromRow(data) : null;
  }
  return localStoreAllowed() ? (await localRead()).find((doc) => doc.id === id) ?? null : null;
}

export class LabConflictError extends Error {
  constructor() { super("Cette création a été modifiée ailleurs. Recharge la page avant de réessayer."); }
}

export async function saveLabDocument(raw: LabContent, existing?: { id: string; revision: number }): Promise<LabDocument> {
  const content = parseLabContent(raw);
  if (existing && (!validLabId(existing.id) || !Number.isSafeInteger(existing.revision) || existing.revision < 1)) throw new Error("Version invalide.");
  const now = new Date().toISOString();
  if (supabaseConfigured()) {
    const db = database();
    const query = existing
      ? db.from("custom_lab_documents").update({ content, revision: existing.revision + 1, updated_at: now }).eq("id", existing.id).eq("revision", existing.revision)
      : db.from("custom_lab_documents").insert({ content });
    const { data, error } = await query.select().maybeSingle();
    if (error) throw new LabStorageError(error.code);
    if (!data) throw new LabConflictError();
    return fromRow(data);
  }
  if (!localStoreAllowed()) throw new Error("Configure Supabase pour enregistrer les créations.");
  const run = queue.then(async () => {
    const docs = await localRead();
    const current = existing ? docs.find((doc) => doc.id === existing.id) : undefined;
    if (existing && (!current || current.revision !== existing.revision)) throw new LabConflictError();
    const doc: LabDocument = { ...content, id: current?.id ?? randomUUID(), revision: (current?.revision ?? 0) + 1, createdAt: current?.createdAt ?? now, updatedAt: now };
    const next = [...docs.filter((entry) => entry.id !== doc.id), doc];
    await fs.mkdir(directory, { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(next));
    await fs.rename(temporary, file);
    return doc;
  });
  queue = run.catch(() => {});
  return run;
}

// Créations complètes utilisables dans un overlay (widgets et packs d'alertes)
export async function listLabSources(): Promise<LabDocument[]> {
  if (supabaseConfigured()) {
    const { data, error } = await database().from("custom_lab_documents").select("*").neq("content->>kind", "overlay").order("updated_at", { ascending: false });
    if (error) throw new LabStorageError(error.code);
    return data.map(fromRow);
  }
  if (!localStoreAllowed()) return [];
  return (await localRead()).filter((doc) => doc.kind !== "overlay");
}
