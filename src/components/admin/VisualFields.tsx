"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from "react";
import { autosaveVisualAction } from "@/app/admin/offres-actions";
import { notifySiteChanged } from "@/lib/site-refresh";
import { highlightSource } from "@/lib/custom-lab/syntaxHighlight";
import { MaterialIcon } from "./MaterialIcon";
import "./custom-lab.css";
import { MAX_CSS, MAX_MARKUP, type ProductVisual } from "@/lib/product-visuals";
import { ProductVisualView } from "@/components/ProductVisualView";

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// Cadre d'aperçu : mêmes couleurs que la carte du site (couleur de la catégorie)
export function VisualFrame({ children, color = "#A78BFA", label }: { children: React.ReactNode; color?: string; label?: string }) {
  return (
    <figure style={{ "--product-color": color, background: "linear-gradient(135deg, color-mix(in srgb, var(--product-color) 14%, var(--background)), var(--background) 55%, color-mix(in srgb, var(--product-color) 7%, var(--background)))" } as CSSProperties} className="relative m-0 overflow-hidden rounded-xl border border-border">
      <div className="flex h-36 items-center justify-center p-4">{children}</div>
      {label && <figcaption className="absolute left-2 top-2 rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-muted">{label}</figcaption>}
    </figure>
  );
}

// Éditeur d'un visuel, comme celui du Laboratoire : code coloré (dessin / animation), aperçu statique et animé
// mis à jour en direct, enregistrement automatique 1,5 s après la dernière modification (Ctrl + S : tout de suite)
type Tab = "markup" | "css";
const files: Record<Tab, { label: string; file: "html" | "css"; name: string }> = {
  markup: { label: "DESSIN", file: "html", name: "visuel.svg" },
  css: { label: "ANIMATION", file: "css", name: "animation.css" },
};

export function VisualEditor({ visual, nameEn }: { visual: ProductVisual; nameEn: string }) {
  const [draft, setDraft] = useState({ name: visual.name, nameEn, markup: visual.markup, css: visual.css });
  const [saved, setSaved] = useState(JSON.stringify({ name: visual.name, nameEn, markup: visual.markup, css: visual.css }));
  const [tab, setTab] = useState<Tab>("markup");
  const [status, setStatus] = useState("");
  const [pending, startTransition] = useTransition();
  const root = useRef<HTMLDivElement>(null);
  const highlight = useRef<HTMLPreElement>(null);
  const dirty = JSON.stringify(draft) !== saved;
  const value = draft[tab];
  const highlighted = useMemo(() => highlightSource(files[tab].file, value), [tab, value]);
  const preview = { id: `apercu-${visual.id}`, markup: draft.markup, css: draft.css };

  function save() {
    const snapshot = draft;
    if (!snapshot.name.trim()) { setStatus("Le nom du visuel est obligatoire."); return; }
    startTransition(async () => {
      try {
        const result = await autosaveVisualAction(visual.id, snapshot);
        if (!result.ok) { setStatus(result.message); return; }
        setSaved(JSON.stringify(snapshot));
        notifySiteChanged();
        setStatus(`Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`);
      } catch { setStatus("Connexion interrompue. Tes modifications restent dans l’éditeur."); }
    });
  }
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; });
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => saveRef.current(), 1500);
    return () => clearTimeout(timer);
  }, [draft, dirty]);
  // Ctrl + S : seulement dans le panneau ouvert
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && root.current?.closest("dialog")?.open) { event.preventDefault(); saveRef.current(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const edit = (next: string) => setDraft((d) => ({ ...d, [tab]: next }));

  return (
    <div ref={root} data-own-save className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">Nom<input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} required maxLength={80} lang="fr" className={input} /></label>
        <label className="grid gap-1.5 text-sm font-medium">Nom anglais<input value={draft.nameEn} onChange={(e) => setDraft((d) => ({ ...d, nameEn: e.target.value }))} maxLength={80} lang="en" placeholder={draft.name} className={input} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <VisualFrame label="Statique"><ProductVisualView visual={preview} animated={false} className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>
        <VisualFrame label="Animée"><ProductVisualView visual={preview} animated className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>
      </div>
      <section className="cl-code !mt-0" aria-label="Code du visuel">
        <header className="cl-panel-heading">
          <div><span className="cl-eyebrow">CODE DU VISUEL</span><p className="text-sm font-semibold">Édition en temps réel</p></div>
          <span className={`cl-save-state ${dirty || pending ? "is-dirty" : "is-synced"}`}><i />{pending ? "Enregistrement…" : dirty ? "Modifié" : "Enregistré"}</span>
        </header>
        <div className="cl-code-tabs" role="tablist" aria-label="Fichiers du visuel">
          {(Object.keys(files) as Tab[]).map((key) => <button key={key} type="button" role="tab" data-file={files[key].file} aria-selected={tab === key} onClick={() => setTab(key)}>{files[key].label}</button>)}
        </div>
        <div className="cl-code-body" role="tabpanel">
          <pre ref={highlight} aria-hidden="true" className="cl-code-highlight"><code dangerouslySetInnerHTML={{ __html: highlighted + "\n" }} /></pre>
          <textarea aria-label={tab === "markup" ? "Code du dessin (SVG ou HTML)" : "CSS de l’animation"} wrap="off" autoComplete="off" autoCapitalize="off" spellCheck={false} value={value} maxLength={tab === "markup" ? MAX_MARKUP : MAX_CSS}
            onChange={(e) => edit(e.target.value)}
            onScroll={(e) => { if (highlight.current) { highlight.current.scrollTop = e.currentTarget.scrollTop; highlight.current.scrollLeft = e.currentTarget.scrollLeft; } }}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              e.preventDefault();
              const el = e.currentTarget, start = el.selectionStart, end = el.selectionEnd;
              edit(`${value.slice(0, start)}  ${value.slice(end)}`);
              requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 2; });
            }} />
          <button type="button" className="cl-copy" aria-label="Copier le code" title="Copier le code" onClick={async () => { try { await navigator.clipboard.writeText(value); setStatus("Code copié."); } catch { setStatus("Copie impossible."); } }}><MaterialIcon name="content_copy" className="size-4" /></button>
        </div>
        <footer className="cl-code-footer"><code>{files[tab].name}</code><span>Enregistrement automatique · Ctrl + S pour enregistrer tout de suite</span></footer>
      </section>
      {status && <p role="status" className="text-xs text-muted">{status}</p>}
      <p className="text-xs text-muted">{tab === "markup" ? "Dessine en currentColor : la couleur suit la catégorie du produit. Ajoute class=\"piece\" aux éléments à animer." : "Utilisé seulement pour la variante « Animée ». :scope désigne le visuel entier ; donne un nom unique à tes @keyframes."}</p>
    </div>
  );
}

// Choix du visuel dans la fiche d'un produit, avec son aperçu
export function VisualPicker({ visuals, defaultValue, color, animated }: { visuals: ProductVisual[]; defaultValue: string; color: string; animated: boolean }) {
  const [id, setId] = useState(defaultValue);
  const visual = visuals.find((v) => v.id === id);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid content-start gap-1.5 text-sm font-medium">
        Visuel
        <span className="text-xs font-normal text-muted">Dessin de la carte. Les visuels se gèrent dans l&apos;onglet « Visuels ».</span>
        <select name="visual" value={id} onChange={(e) => setId(e.target.value)} className={input}>
          {visuals.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </label>
      {visual && <VisualFrame color={color}><ProductVisualView visual={visual} animated={animated} className="h-full w-full max-w-40 text-[var(--product-color)]" /></VisualFrame>}
    </div>
  );
}
