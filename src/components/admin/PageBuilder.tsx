"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resetProjectPageAction, saveProjectPageAction } from "@/app/admin/portfolio-actions";
import { layoutIds, layouts, type Block, type BuilderPage, type L, type LayoutId, type Slot } from "@/lib/page-builder";
import { PREVIEW_MESSAGE } from "./PagePreview";
import { moveItem, usePointerSort } from "./usePointerSort";

export type PickerWork = { id: string; title: string; image?: string; category: string; emotes: boolean };

type Lang = "fr" | "en";
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
const iconButton = "inline-flex size-8 items-center justify-center rounded-lg border border-border text-sm text-muted transition hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted";

// --- Miniatures des dispositions ----------------------------------------------------------

const box = (x: number, y: number, w: number, h: number, k = 0, fill = "currentColor", rx = 1.5) => <rect key={k} x={x} y={y} width={w} height={h} rx={rx} fill={fill} />;
const text = (x: number, y: number, w: number, n = 3) =>
  Array.from({ length: n }, (_, i) => box(x, y + i * 4, i === 0 ? w : w * (i === n - 1 ? 0.6 : 0.85), 2, 100 + i, "currentColor", 1));
const visual = "var(--accent)";

const thumbs: Record<LayoutId, React.ReactNode[]> = {
  full: [...text(4, 4, 24, 2), box(4, 14, 52, 22, 1, visual)],
  "media-text": [box(4, 6, 30, 28, 1, visual), ...text(38, 10, 18, 4)],
  "text-media": [...text(4, 10, 18, 4), box(26, 6, 30, 28, 1, visual)],
  signature: [...text(4, 4, 22, 2), box(4, 14, 34, 22, 1, visual), <circle key={2} cx={48} cy={25} r={8} fill={visual} />],
  duo: [...text(4, 4, 22, 2), box(4, 14, 25, 20, 1, visual), box(31, 14, 25, 20, 2, visual)],
  gallery: [...text(4, 4, 22, 2), box(4, 14, 16, 10, 1, visual), box(22, 14, 16, 10, 2, visual), box(40, 14, 16, 10, 3, visual), box(4, 26, 16, 10, 4, visual), box(22, 26, 16, 10, 5, visual)],
  scenes: [...text(4, 14, 16, 4), box(24, 6, 32, 22, 1, visual), box(24, 31, 7, 3, 2), box(33, 31, 7, 3, 3), box(42, 31, 7, 3, 4)],
  detail: [...text(4, 4, 22, 2), box(4, 14, 30, 22, 1, visual), box(37, 14, 19, 2, 2), box(37, 19, 19, 9, 3, visual), box(37, 30, 9, 6, 4, visual), box(48, 30, 8, 6, 5, visual)],
  emotes: [...text(4, 12, 16, 4), ...Array.from({ length: 8 }, (_, i) => <circle key={10 + i} cx={28 + (i % 4) * 8} cy={14 + Math.floor(i / 4) * 10} r={3} fill={visual} />)],
  wide: [...text(4, 14, 12, 4), box(19, 10, 37, 18, 1, visual)],
};

function LayoutThumb({ id, className = "" }: { id: LayoutId; className?: string }) {
  return (
    <svg viewBox="0 0 60 40" aria-hidden className={`text-muted/50 ${className}`}>
      <rect x="0.5" y="0.5" width="59" height="39" rx="4" fill="none" stroke="currentColor" strokeOpacity="0.5" />
      {thumbs[id]}
    </svg>
  );
}

function LayoutPicker({ value, onPick }: { value?: LayoutId; onPick: (id: LayoutId) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {layoutIds.map((id) => (
        <li key={id}>
          <button
            type="button"
            onClick={() => onPick(id)}
            aria-pressed={value === id}
            className={`flex h-full w-full flex-col items-center gap-1.5 rounded-xl border p-2 text-center text-xs transition ${value === id ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted hover:border-accent/60 hover:text-foreground"}`}
            title={layouts[id].description}
          >
            <LayoutThumb id={id} className="w-full max-w-24" />
            {layouts[id].label}
          </button>
        </li>
      ))}
    </ul>
  );
}

// --- Champs ----------------------------------------------------------------------------

function TextField({ label, value, lang, multiline, rows = 2, onChange, hint }: { label: string; value?: L; lang: Lang; multiline?: boolean; rows?: number; onChange: (v: L) => void; hint?: string }) {
  const current = (lang === "en" ? value?.en : value?.fr) ?? "";
  const set = (v: string) => onChange(lang === "en" ? { fr: value?.fr ?? "", en: v } : { ...value, fr: v });
  const props = { value: current, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.value), lang, placeholder: lang === "en" ? value?.fr : undefined, className: input };
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted">
        {label}
        {lang === "en" && <span className="ml-1 text-accent">EN</span>}
        {hint && <span className="ml-1 text-muted/70">· {hint}</span>}
      </span>
      {multiline ? <textarea rows={rows} {...props} /> : <input {...props} />}
    </label>
  );
}

function WorkPicker({ works, value, onChange, label, emotesOnly }: { works: PickerWork[]; value?: string; onChange: (id: string) => void; label: string; emotesOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const current = works.find((w) => w.id === value);
  const list = emotesOnly ? [...works].sort((a, b) => Number(b.emotes) - Number(a.emotes)) : works;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 rounded-lg border border-border bg-background p-1.5 pr-3 text-left text-sm hover:border-accent">
        {current?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.image} alt="" className="h-10 w-16 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="h-10 w-16 shrink-0 rounded-md bg-surface-2" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-muted">{label}</span>
          <span className="block truncate">{current?.title ?? "Choisir un visuel…"}</span>
        </span>
        <span aria-hidden className="text-muted">▾</span>
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface p-2 shadow-2xl">
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {list.map((w) => (
              <li key={w.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(w.id);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg border p-1 text-left text-xs transition ${w.id === value ? "border-accent bg-accent/10" : "border-transparent hover:border-border"}`}
                >
                  {w.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.image} alt="" className="aspect-video w-full rounded-md object-cover" />
                  ) : (
                    <span className="block aspect-video w-full rounded-md bg-surface-2" />
                  )}
                  <span className="mt-1 block truncate">{w.title}</span>
                  {emotesOnly && w.emotes && <span className="block text-[10px] text-accent">planche d&apos;emotes</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- Bloc ------------------------------------------------------------------------------

function BlockEditor({
  block,
  index,
  works,
  lang,
  open,
  onToggle,
  onChange,
  onDuplicate,
  onRemove,
  sortClass,
  handle,
}: {
  block: Block;
  index: number;
  works: PickerWork[];
  lang: Lang;
  open: boolean;
  onToggle: () => void;
  onChange: (b: Block) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  sortClass: string;
  handle: ReturnType<ReturnType<typeof usePointerSort>["handle"]>;
}) {
  const def = layouts[block.layout];
  const [picking, setPicking] = useState(false);
  const setSlot = (i: number, patch: Partial<Slot>) => onChange({ ...block, slots: block.slots.map((s, k) => (k === i ? { ...s, ...patch } : s)) });
  const slotLabel = (i: number) => def.slotLabels?.[i] ?? (def.extraLabel && i >= (def.slotLabels?.length ?? 0) ? def.extraLabel : `Visuel ${i + 1}`);
  const title = (lang === "en" ? block.title?.en : undefined) || block.title?.fr || block.kicker?.fr || def.label;

  return (
    <li className={`rounded-2xl border border-border bg-surface transition ${sortClass}`}>
      <div className="flex items-center gap-3 p-3">
        {/* Poignée : tirer pour déplacer le bloc (ou flèches haut et bas au clavier) */}
        <span {...handle} role="button" tabIndex={0} aria-label="Déplacer le bloc (flèches haut et bas)" title="Glisser pour déplacer" className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded text-muted hover:bg-accent/10 hover:text-accent active:cursor-grabbing">
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
        </span>
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <LayoutThumb id={block.layout} className="w-14 shrink-0" />
          <span className="min-w-0">
            <span className="block text-xs text-muted">
              Bloc {index + 1} · {def.label}
            </span>
            <span className="block truncate font-semibold">{title.split("\n").join(" ")}</span>
          </span>
        </button>
        <div className="flex shrink-0 gap-1">
          <button type="button" className={iconButton} onClick={onDuplicate} aria-label="Dupliquer le bloc" title="Dupliquer">⧉</button>
          <button type="button" className={`${iconButton} hover:!border-red-400 hover:!text-red-300`} onClick={onRemove} aria-label="Supprimer le bloc" title="Supprimer"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg></button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">{def.description}</p>
              <button type="button" onClick={() => setPicking((p) => !p)} className="shrink-0 text-xs text-accent hover:underline">
                {picking ? "Fermer" : "Changer la disposition"}
              </button>
            </div>
            {picking && (
              <div className="mt-3">
                <LayoutPicker
                  value={block.layout}
                  onPick={(id) => {
                    onChange({ ...block, layout: id, slots: block.slots.slice(0, layouts[id].max) });
                    setPicking(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {def.fields.includes("kicker") && <TextField label="Surtitre" value={block.kicker} lang={lang} onChange={(kicker) => onChange({ ...block, kicker })} />}
            {def.fields.includes("title") && <TextField label="Titre" hint="une ligne par ligne" multiline value={block.title} lang={lang} onChange={(t) => onChange({ ...block, title: t })} />}
          </div>
          {def.fields.includes("text") && <TextField label="Texte" multiline rows={3} value={block.text} lang={lang} onChange={(t) => onChange({ ...block, text: t })} />}
          {def.fields.includes("subtitle") && <TextField label="Titre de la colonne" hint="une ligne par ligne" multiline value={block.subtitle} lang={lang} onChange={(subtitle) => onChange({ ...block, subtitle })} />}

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Visuels <span className="font-normal normal-case tracking-normal text-muted">({def.min === def.max ? def.max : `${def.min} à ${def.max}`})</span>
            </p>
            {block.slots.map((s, i) => (
              <div key={i} className="grid gap-2 rounded-xl border border-border/60 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                <WorkPicker works={works} value={s.work} label={slotLabel(i)} emotesOnly={block.layout === "emotes"} onChange={(work) => setSlot(i, { work, image: undefined, aspect: undefined })} />
                {def.captions ? (
                  <TextField label={block.layout === "scenes" ? "Nom de l'onglet" : "Légende"} value={s.caption} lang={lang} onChange={(caption) => setSlot(i, { caption })} />
                ) : (
                  <span />
                )}
                <div className="flex gap-1 sm:pb-1">
                  <button type="button" className={iconButton} disabled={i === 0} aria-label="Visuel précédent" onClick={() => onChange({ ...block, slots: swap(block.slots, i, i - 1) })}>↑</button>
                  <button type="button" className={iconButton} disabled={i === block.slots.length - 1} aria-label="Visuel suivant" onClick={() => onChange({ ...block, slots: swap(block.slots, i, i + 1) })}>↓</button>
                  <button type="button" className={iconButton} disabled={block.slots.length <= 1} aria-label="Retirer ce visuel" title="Retirer ce visuel" onClick={() => onChange({ ...block, slots: block.slots.filter((_, k) => k !== i) })}><svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg></button>
                </div>
              </div>
            ))}
            {block.slots.length < def.max && (
              <button
                type="button"
                onClick={() => onChange({ ...block, slots: [...block.slots, { work: works.find((w) => !block.slots.some((s) => s.work === w.id))?.id ?? works[0]?.id ?? "" }] })}
                disabled={!works.length}
                className="rounded-full border border-dashed border-border px-4 py-2 text-xs text-muted hover:border-accent hover:text-accent"
              >
                + Ajouter un visuel
              </button>
            )}
            {block.slots.length < def.min && <p className="text-xs text-amber-300">Cette disposition demande au moins {def.min} visuel{def.min > 1 ? "s" : ""}.</p>}
          </div>
        </div>
      )}
    </li>
  );
}

function swap<T>(list: T[], a: number, b: number) {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// --- Éditeur ---------------------------------------------------------------------------

export function PageBuilder({ streamerId, streamerName, initial, custom, works }: { streamerId: string; streamerName: string; initial: BuilderPage; custom: boolean; works: PickerWork[] }) {
  const [page, setPage] = useState(initial);
  const [lang, setLang] = useState<Lang>("fr");
  const [openBlock, setOpenBlock] = useState<string | null>(initial.blocks[0]?.id ?? null);
  const [adding, setAdding] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "idle"; text: string }>({ tone: "idle", text: custom ? "Mise en page personnalisée en ligne." : "Mise en page d'origine en ligne." });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const frameBox = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const update = (next: BuilderPage) => {
    setPage(next);
    setDirty(true);
  };
  const setBlocks = (blocks: Block[]) => update({ ...page, blocks });
  const sort = usePointerSort((from, to) => setBlocks(moveItem(page.blocks, from, to)));
  // Ordre affiché : pendant le geste, le bloc tiré prend déjà sa future place
  const order = sort.drag ? moveItem(page.blocks.map((_, i) => i), sort.drag.from, sort.drag.to) : page.blocks.map((_, i) => i);

  // Aperçu : la page en cours est envoyée au cadre à chaque changement
  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, page, locale: lang, focus: openBlock ?? undefined }, window.location.origin);
  }, [page, lang, openBlock]);
  useEffect(send, [send]);
  useEffect(() => {
    const ready = (e: MessageEvent) => e.origin === window.location.origin && e.data?.type === `${PREVIEW_MESSAGE}:ready` && send();
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [send]);

  // Cadre à la largeur réelle d'un écran (1280 px ou 390 px), réduit pour tenir dans la colonne
  const width = device === "desktop" ? 1280 : 390;
  useEffect(() => {
    const el = frameBox.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / width));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    setSaving(true);
    const res = await saveProjectPageAction(streamerId, page).catch(() => ({ ok: false as const, error: "Enregistrement impossible (connexion ?)." }));
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setStatus({ tone: "ok", text: `Enregistré à ${new Date(res.savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — la page publique est à jour.` });
    } else setStatus({ tone: "error", text: res.error });
  };

  const reset = async () => {
    if (!window.confirm("Revenir à la mise en page d'origine ? Les blocs et textes personnalisés seront perdus.")) return;
    const res = await resetProjectPageAction(streamerId);
    if (res.ok) window.location.reload();
  };

  const h = page.header;
  const setHeader = (patch: Partial<BuilderPage["header"]>) => update({ ...page, header: { ...h, ...patch } });

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="min-w-0 space-y-4">
        <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface/95 p-3 backdrop-blur">
          <div role="group" aria-label="Langue des textes" className="flex rounded-full border border-border p-0.5 text-xs">
            {(["fr", "en"] as const).map((l) => (
              <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`rounded-full px-3 py-1.5 font-semibold ${lang === l ? "bg-accent text-background" : "text-muted hover:text-foreground"}`}>
                {l === "fr" ? "Français" : "English"}
              </button>
            ))}
          </div>
          <p role="status" className={`min-w-0 flex-1 text-xs ${status.tone === "error" ? "text-red-300" : status.tone === "ok" ? "text-emerald-300" : "text-muted"}`}>
            {dirty ? "Modifications non enregistrées." : status.text}
          </p>
          <button type="button" onClick={save} disabled={saving || !dirty} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-background hover:brightness-110 disabled:opacity-50">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
        {lang === "en" && <p className="text-xs text-muted">Version anglaise : un champ vide reprend le texte français (affiché en gris).</p>}

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-semibold">Ouverture</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Surtitre" value={h.eyebrow} lang={lang} onChange={(eyebrow) => setHeader({ eyebrow })} />
            <TextField label="Titre" hint="2 lignes, la 2e en couleur" multiline value={h.headline} lang={lang} onChange={(headline) => setHeader({ headline })} />
          </div>
          <TextField label="Présentation" multiline rows={3} value={h.intro} lang={lang} onChange={(intro) => setHeader({ intro })} />
          <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
            <WorkPicker works={works} value={h.hero} label="Grand visuel d'ouverture" onChange={(hero) => setHeader({ hero })} />
            <TextField label="Légende" value={h.heroCaption} lang={lang} onChange={(heroCaption) => setHeader({ heroCaption })} />
          </div>
        </section>

        <ol data-sort-list className="space-y-3">
          {order.map((i) => {
            const b = page.blocks[i];
            // Pendant le geste : emplacement en pointillé là où le bloc sera déposé
            if (sort.drag?.from === i) return <li key={b.id} aria-hidden className="h-[4.5rem] rounded-2xl border-2 border-dashed border-accent bg-accent/5" />;
            return (
            <BlockEditor
              key={b.id}
              block={b}
              index={i}
              works={works}
              lang={lang}
              open={openBlock === b.id}
              onToggle={() => setOpenBlock((o) => (o === b.id ? null : b.id))}
              onChange={(nb) => setBlocks(page.blocks.map((x) => (x.id === b.id ? nb : x)))}
              onDuplicate={() => {
                const copy = { ...structuredClone(b), id: newId() };
                setBlocks([...page.blocks.slice(0, i + 1), copy, ...page.blocks.slice(i + 1)]);
                setOpenBlock(copy.id);
              }}
              onRemove={() => window.confirm("Supprimer ce bloc ?") && setBlocks(page.blocks.filter((x) => x.id !== b.id))}
              sortClass={sort.rowClass(i)}
              handle={sort.handle(i)}
            />
            );
          })}
        </ol>
        {/* Bloc tiré, qui suit le pointeur */}
        {sort.drag && page.blocks[sort.drag.from] && (
          <div
            aria-hidden
            style={{ top: sort.drag.y - sort.drag.offset, left: sort.drag.left, width: sort.drag.width }}
            className="pointer-events-none fixed z-50 flex items-center gap-3 rounded-2xl border border-accent bg-surface p-3 shadow-2xl"
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center text-accent">
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor"><path d="M9 5h2v2H9V5zm4 0h2v2h-2V5zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zM9 17h2v2H9v-2zm4 0h2v2h-2v-2z" /></svg>
            </span>
            <LayoutThumb id={page.blocks[sort.drag.from].layout} className="w-14 shrink-0" />
            <span className="min-w-0 truncate font-semibold">
              {(page.blocks[sort.drag.from].title?.fr || layouts[page.blocks[sort.drag.from].layout].label).split("\n").join(" ")}
            </span>
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-border p-4">
          {adding ? (
            <>
              <p className="mb-3 text-sm font-semibold">Choisis la disposition du nouveau bloc</p>
              <LayoutPicker
                onPick={(layout) => {
                  const def = layouts[layout];
                  const unused = works.filter((w) => !page.blocks.some((b) => b.slots.some((s) => s.work === w.id)) && w.id !== h.hero);
                  const pool = [...unused, ...works];
                  const block: Block = { id: newId(), layout, kicker: { fr: "" }, title: { fr: "Nouveau bloc" }, slots: pool.slice(0, Math.max(def.min, 1)).map((w) => ({ work: w.id })) };
                  setBlocks([...page.blocks, block]);
                  setOpenBlock(block.id);
                  setAdding(false);
                }}
              />
              <button type="button" onClick={() => setAdding(false)} className="mt-3 text-xs text-muted hover:text-foreground">
                Annuler
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setAdding(true)} className="w-full rounded-full border border-border py-2.5 text-sm font-semibold hover:border-accent hover:text-accent">
              + Ajouter un bloc
            </button>
          )}
        </div>

        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h2 className="font-semibold">Appel au contact (bas de page)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Surtitre" value={page.cta.kicker} lang={lang} onChange={(kicker) => update({ ...page, cta: { ...page.cta, kicker } })} />
            <TextField label="Titre" hint="une ligne par ligne" multiline value={page.cta.title} lang={lang} onChange={(title) => update({ ...page, cta: { ...page.cta, title } })} />
          </div>
        </section>

        <p className="text-xs text-muted">
          Les réalisations du projet qui ne sont placées dans aucun bloc s&apos;affichent en bas de page, dans « Aussi dans ce projet ». L&apos;avis client
          s&apos;affiche juste avant l&apos;appel au contact.{" "}
          <button type="button" onClick={reset} className="text-accent underline-offset-4 hover:underline">
            Revenir à la mise en page d&apos;origine
          </button>
        </p>
      </div>

      <div className="min-w-0">
        <div className="sticky top-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Aperçu — {streamerName}</p>
            <div role="group" aria-label="Format de l'aperçu" className="flex rounded-full border border-border p-0.5 text-xs">
              {(["desktop", "mobile"] as const).map((d) => (
                <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`rounded-full px-3 py-1.5 ${device === d ? "bg-surface-2 font-semibold text-foreground" : "text-muted hover:text-foreground"}`}>
                  {d === "desktop" ? "Ordinateur" : "Mobile"}
                </button>
              ))}
            </div>
          </div>
          <div ref={frameBox} className="h-[calc(100dvh-6rem)] overflow-hidden rounded-2xl border border-border bg-background">
            <div className="mx-auto h-full" style={{ width: width * scale }}>
              <iframe
                ref={frame}
                src={`/admin/apercu/${encodeURIComponent(streamerId)}`}
                title={`Aperçu de la page ${streamerName}`}
                onLoad={send}
                style={{ width, height: `${100 / scale}%`, transform: `scale(${scale})`, transformOrigin: "top left" }}
                className="block border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
