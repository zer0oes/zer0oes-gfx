"use client";

import { useActionState, useRef, useState } from "react";
import { saveCarouselAction } from "@/app/admin/promotions-actions";
import type { AnnouncementSlide, SlideCopy } from "@/lib/announcement-carousel";
import type { Locale } from "@/lib/i18n";

const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
export function CarouselEditor({ initialSlides }: { initialSlides: AnnouncementSlide[] }) {
  const [slides, setSlides] = useState(initialSlides);
  const [locale, setLocale] = useState<Locale>("fr");
  const [state, action, pending] = useActionState(saveCarouselAction, null);
  const dragging = useRef<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  function move(id: string, target: string) {
    if (id === target) return;
    setSlides((current) => {
      const from = current.findIndex((s) => s.id === id), to = current.findIndex((s) => s.id === target);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      next.splice(to, 0, ...next.splice(from, 1));
      return next;
    });
    setOrderMessage("Ordre modifié. Enregistre pour le publier.");
  }
  function update(id: string, field: keyof SlideCopy, value: string) {
    setSlides((current) => current.map((slide) => slide.id === id ? { ...slide, content: { ...slide.content, [locale]: { ...slide.content[locale], [field]: value } } } : slide));
  }
  return <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
    <h2 className="text-xl font-semibold">Carrousel sous le menu</h2>
    <p className="mt-2 text-sm text-muted">Défilement toutes les 7 secondes. Les deux langues, les activations et l’ordre sont enregistrés ensemble.</p>
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="slides" value={JSON.stringify(slides)} />
      <div role="tablist" aria-label="Langue du carrousel" className="-mx-5 flex gap-6 border-b border-border px-5 sm:-mx-6 sm:px-6">
        {(["fr", "en"] as const).map((lang) => <button key={lang} type="button" role="tab" aria-selected={locale === lang} aria-controls="carousel-copy-panel" tabIndex={locale === lang ? 0 : -1}
          onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); setLocale(lang === "fr" ? "en" : "fr"); event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-language="${lang === "fr" ? "en" : "fr"}"]`)?.focus(); } }}
          data-language={lang} onClick={() => setLocale(lang)} className={`-mb-px border-b-2 pb-3 text-sm focus-visible:outline-2 focus-visible:outline-accent ${locale === lang ? "border-accent font-semibold text-accent" : "border-transparent text-muted"}`}>{lang === "fr" ? "Français" : "English"}</button>)}
      </div>
      <p id="carousel-drag-help" className="text-xs text-muted">Glisse la poignée pour déplacer une diapo, ou utilise les boutons Monter / Descendre. Les pourcentages du titre apparaissent en gras et en dégradé. Pour l’offre de lancement, le texte avant le premier deux-points devient la pastille ; la phrase qui suit s’affiche à côté. Ces textes décrivent l’offre ; les tarifs restent gérés par la promotion.</p>
      <div id="carousel-copy-panel" role="tabpanel" aria-label={locale === "fr" ? "Textes français" : "English copy"} className="space-y-4">
        {slides.map((slide, index) => <article key={slide.id} data-carousel-slide={slide.id} className={`rounded-xl border p-4 ${dragId === slide.id ? "border-accent bg-accent/5" : "border-border bg-background/30"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" aria-label={`Déplacer la diapo ${index + 1}`} aria-describedby="carousel-drag-help" className="touch-none cursor-grab rounded-lg border border-border p-2 text-muted active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-accent"
              onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); dragging.current = slide.id; setDragId(slide.id); }}
              onPointerMove={(event) => {
                if (!dragging.current) return;
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-carousel-slide]")?.dataset.carouselSlide;
                if (target) move(dragging.current, target);
              }}
              onPointerUp={() => { dragging.current = null; setDragId(null); }} onPointerCancel={() => { dragging.current = null; setDragId(null); }}
              onKeyDown={(event) => { if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const target = slides[index + (event.key === "ArrowUp" ? -1 : 1)]; if (target) move(slide.id, target.id); } }}>
              <svg aria-hidden width="16" height="20" viewBox="0 0 16 20" fill="currentColor"><circle cx="5" cy="5" r="1.5" /><circle cx="11" cy="5" r="1.5" /><circle cx="5" cy="10" r="1.5" /><circle cx="11" cy="10" r="1.5" /><circle cx="5" cy="15" r="1.5" /><circle cx="11" cy="15" r="1.5" /></svg>
            </button>
            <h3 className="font-semibold">Diapo {index + 1} · {slide.id === "launch" ? "Offre de lancement" : "Audit gratuit"}</h3>
            <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" role="switch" aria-label={`Activer la diapo ${slide.id === "launch" ? "Offre de lancement" : "Audit gratuit"}`} checked={slide.enabled} onChange={(event) => setSlides((current) => current.map((s) => s.id === slide.id ? { ...s, enabled: event.target.checked } : s))} className="accent-[var(--accent)]" />{slide.enabled ? "Activée" : "Désactivée"}</label>
            <div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => move(slide.id, slides[index - 1].id)} aria-label={`Monter la diapo ${index + 1}`} className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-30">Monter</button><button type="button" disabled={index === slides.length - 1} onClick={() => move(slide.id, slides[index + 1].id)} aria-label={`Descendre la diapo ${index + 1}`} className="rounded-lg border border-border px-2 py-1 text-xs disabled:opacity-30">Descendre</button></div>
          </div>
          <p className="mt-3 truncate text-sm text-muted">{slide.content[locale].title}</p>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-accent">Modifier les textes ({locale.toUpperCase()})</summary>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium">Pastille ({locale.toUpperCase()})<input value={slide.content[locale].badge ?? (slide.id === "launch" && slide.content[locale].title.includes(":") ? slide.content[locale].title.split(":")[0].trim() : "")} onChange={(event) => update(slide.id, "badge", event.target.value)} maxLength={80} className={input} /></label>
            <label className="block text-sm font-medium">Titre et chiffres ({locale.toUpperCase()})<textarea value={slide.content[locale].title} onChange={(event) => update(slide.id, "title", event.target.value)} required maxLength={600} rows={2} className={input} /></label>
            <label className="block text-sm font-medium">Ligne secondaire, facultative ({locale.toUpperCase()})<input value={slide.content[locale].conditions} onChange={(event) => update(slide.id, "conditions", event.target.value)} maxLength={400} className={input} /></label>
            {slide.id === "launch" && <label className="block text-sm font-medium">Texte du compteur ({locale.toUpperCase()})<input value={slide.content[locale].remainingText} onChange={(event) => update(slide.id, "remainingText", event.target.value)} maxLength={150} className={input} /><span className="mt-1 block text-xs font-normal text-muted">Utilise {"{count}"} : remplacé par les places restantes d’après les commandes réelles. Laisse vide pour masquer le compteur.</span></label>}
            <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium">Libellé du bouton ({locale.toUpperCase()})<input value={slide.content[locale].buttonLabel} onChange={(event) => update(slide.id, "buttonLabel", event.target.value)} required maxLength={80} className={input} /></label><label className="block text-sm font-medium">Lien du bouton ({locale.toUpperCase()})<input value={slide.content[locale].buttonHref} onChange={(event) => update(slide.id, "buttonHref", event.target.value)} required maxLength={500} className={input} /></label></div>
          </div>
          </details>
        </article>)}
      </div>
      <p role="status" className="text-sm text-muted">{orderMessage}</p>
      {state && <p role={state.ok ? "status" : "alert"} className={state.ok ? "text-sm text-accent-2" : "text-sm text-accent-3"}>{state.message}</p>}
      <button disabled={pending || slides.length !== 2} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer le carrousel"}</button>
    </form>
  </section>;
}
