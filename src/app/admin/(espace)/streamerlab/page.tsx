import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listLabDocuments } from "@/lib/custom-lab/store";
import { createLabAction, importLabAction } from "@/app/admin/custom-lab-actions";
import { LabStorageError } from "@/lib/custom-lab/errors";

export const metadata = { title: "Laboratoire" };

export default async function StreamerLabPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const { documents, message } = await listLabDocuments().then((documents) => ({ documents, message: "" })).catch((error: unknown) => ({ documents: [], message: error instanceof LabStorageError ? error.message : "La bibliothèque est indisponible. Réessaie dans un instant." }));
  const errorMessages: Record<string, string> = {
    setup: "Le Laboratoire n’est pas encore initialisé dans la base : sa migration doit être appliquée.",
    create: "Création impossible pour le moment. Réessaie dans un instant.",
    storage: "Le stockage est indisponible. Réessaie dans un instant.",
    import: "Import impossible : utilise un fichier projet du Laboratoire valide de moins de 2 Mo.",
  };
  return <div className="space-y-6">
    <header><p className="text-sm text-accent">Atelier de création</p><h1 className="mt-1 font-display text-3xl font-bold">Laboratoire</h1><p className="mt-3 max-w-2xl text-muted">Crée et teste tes widgets et packs d’alertes pour StreamElements et Streamlabs.</p></header>
    {message && <p role="alert" className="rounded-xl border border-amber-500/40 p-4">{message}</p>}
    {!message && params.error && errorMessages[params.error] && <p role="alert" className="text-amber-300">{errorMessages[params.error]}</p>}
    <div className="flex flex-wrap gap-3">{([['widget', 'Nouveau widget'], ['alertbox', 'Nouveau pack d’alertes']] as const).map(([kind, label]) => <form key={kind} action={createLabAction}><input type="hidden" name="kind" value={kind} /><button disabled={Boolean(message)} className="rounded-full bg-accent px-5 py-3 font-semibold text-background disabled:cursor-not-allowed disabled:opacity-50">{label}</button></form>)}</div>
    <section className="rounded-2xl border border-border bg-surface p-5"><h2 className="font-semibold">Bibliothèque</h2>{!documents.length ? <p className="mt-3 text-muted">Commence par une nouvelle création ou importe un projet.</p> : <ul className="mt-4 divide-y divide-border">{documents.map((doc) => <li key={doc.id}><Link href={`/admin/streamerlab/${doc.id}`} className="flex items-center justify-between gap-4 py-4 hover:text-accent"><div><p className="font-semibold">{doc.name}</p><p className="mt-1 text-sm text-muted">{doc.project} · {doc.kind === "widget" ? "Widget" : "Pack d’alertes"}</p></div><span className="text-sm">Ouvrir →</span></Link></li>)}</ul>}</section>
    <form action={importLabAction} className="space-y-3 rounded-2xl border border-border p-5"><h2 className="font-semibold">Importer une création</h2><p className="text-sm text-muted">Fichier projet JSON exporté depuis cet atelier ou préparé depuis le laboratoire local.</p><input aria-label="Fichier projet du Laboratoire" name="file" type="file" accept=".json,application/json" required className="block max-w-full text-sm" /><button disabled={Boolean(message)} className="rounded-full border border-border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50">Importer</button></form>
  </div>;
}
