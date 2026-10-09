"use client";
import { useEffect, useId, useRef, useState } from "react";
import { MaterialIcon } from "./MaterialIcon";
import { createLabProjectInlineAction } from "@/app/admin/custom-lab-actions";

export function CustomLabProjectField({ value, projects, onChange }: { value: string; projects: string[]; onChange: (name: string) => void }) {
  const [added, setAdded] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const fieldId = useId();
  const options = [...new Set([value, ...projects, ...added])].sort((a, b) => a.localeCompare(b, "fr"));
  useEffect(() => {
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  async function create() {
    setBusy(true); setError("");
    try {
      const result = await createLabProjectInlineAction(name, description);
      if (!result.ok) { setError(result.message); return; }
      setAdded((current) => [...current, result.name]);
      onChange(result.name);
      setCreating(false); setName(""); setDescription("");
    } catch { setError("Connexion interrompue. Réessaie dans un instant."); }
    finally { setBusy(false); }
  }
  return <div className="cl-project-field" ref={container}>
    <label htmlFor={fieldId} className="mb-2">Projet</label>
    <div className="relative" onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
      if (event.key === "Tab") setOpen(false);
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) setOpen(true);
        requestAnimationFrame(() => {
          const items = Array.from(container.current?.querySelectorAll<HTMLButtonElement>('[role="menu"] button') ?? []);
          const current = items.indexOf(document.activeElement as HTMLButtonElement);
          const next = current < 0 ? event.key === "ArrowDown" ? 0 : items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
          items[next]?.focus();
        });
      }
    }}>
      <button id={fieldId} ref={trigger} type="button" aria-label={`Projet : ${value}`} aria-haspopup="menu" aria-expanded={open} aria-controls={`${fieldId}-menu`} onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-normal text-foreground hover:border-accent/50">
        <span className="truncate">{value}</span><MaterialIcon name="expand_more" className={`size-4 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={`${fieldId}-menu`} role="menu" aria-label="Choisir un projet" className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl">
        <div className="max-h-56 overflow-y-auto">{options.map((project) => <button key={project} type="button" role="menuitemradio" aria-checked={value === project} onClick={() => { onChange(project); setOpen(false); trigger.current?.focus(); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-normal hover:bg-surface-2 ${value === project ? "bg-accent/15 text-accent" : "text-foreground"}`}>
          <MaterialIcon name="folder" className="size-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{project}</span>{value === project && <svg aria-hidden="true" className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4L19 6" /></svg>}
        </button>)}</div>
        <div className="mt-1 border-t border-border pt-1"><button type="button" role="menuitem" onClick={() => { setOpen(false); setCreating(true); setError(""); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-accent hover:bg-accent/10"><MaterialIcon name="add" className="size-4" />Créer un projet</button></div>
      </div>}
    </div>
    {creating && <div className="mt-3 space-y-3 rounded-lg border border-border bg-background p-3">
      <label>Nom du nouveau projet<input autoFocus value={name} maxLength={120} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (!busy && name.trim()) void create(); } }} /></label>
      <label>Description du projet<textarea rows={2} value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" /></label>
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || !name.trim()} className="cl-primary" onClick={() => void create()}>{busy ? "Création…" : "Créer et sélectionner"}</button><button type="button" disabled={busy} className="cl-secondary" onClick={() => setCreating(false)}>Annuler</button></div>
    </div>}
  </div>;
}
