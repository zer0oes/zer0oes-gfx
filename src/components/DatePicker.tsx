"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { inputClass } from "./ui";

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

// onChange : date choisie (AAAA-MM-JJ, vide si effacée), pour un formulaire qui enregistre autre chose que la date seule
export function DatePicker({ name, label, locale, defaultValue = "", min, max, required = false, compact = false, onChange }: { name: string; label: string; locale: Locale; defaultValue?: string; min?: string; max?: string; required?: boolean; compact?: boolean; onChange?: (value: string) => void }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [value, setRawValue] = useState(/^\d{4}-\d{2}-\d{2}$/.test(defaultValue) ? defaultValue : "");
  const setValue = (next: string) => { setRawValue(next); onChange?.(next); };
  const [month, setMonth] = useState<Date | null>(null);
  const [open, setOpen] = useState(false);
  const en = locale === "en";
  const language = en ? "en-GB" : "fr-FR";
  const close = () => { setOpen(false); trigger.current?.focus(); };

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    const selectedDay = root.current?.querySelector<HTMLButtonElement>('[data-day][aria-pressed="true"]:not(:disabled)');
    const currentDay = root.current?.querySelector<HTMLButtonElement>('[data-today="true"]:not(:disabled)');
    (selectedDay ?? currentDay ?? root.current?.querySelector<HTMLButtonElement>('[data-day]:not(:disabled)'))?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const offset = month ? (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 : 0;
  const days = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() : 0;
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const today = dateKey(new Date());
  const allowed = (key: string) => (!min || key >= min) && (!max || key <= max);
  const changeMonth = (delta: number) => setMonth((current) => current && new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div ref={root} className="relative min-w-0" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium">{label}</span>
      <input className="sr-only" tabIndex={-1} aria-label={label} name={name} value={value} required={required} onChange={(event) => setValue(event.target.value)} onInvalid={() => trigger.current?.focus()} />
      <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-calendar`} aria-haspopup="dialog" onClick={() => {
        if (!open) setMonth(selected ?? new Date());
        setOpen(!open);
      }} className={`${compact ? "min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm" : inputClass} flex items-center justify-between gap-3 text-left`}>
        <span id={`${id}-value`} className={value ? "" : "text-muted"}>{selected ? new Intl.DateTimeFormat(language, compact ? { day: "2-digit", month: "2-digit", year: "numeric" } : { day: "numeric", month: "long", year: "numeric" }).format(selected) : en ? "Choose a date" : "Choisir une date"}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-accent"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
      </button>
      {open && month && <div id={`${id}-calendar`} role="dialog" aria-labelledby={`${id}-label`} className="fixed inset-x-4 bottom-4 z-40 max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-border bg-surface p-4 shadow-[0_16px_48px_rgba(0,0,0,0.5)] sm:absolute sm:inset-x-auto sm:left-0 sm:bottom-auto sm:top-full sm:mt-2 sm:w-72">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" disabled={!!min && dateKey(new Date(month.getFullYear(), month.getMonth(), 0)) < min} aria-label={en ? "Previous month" : "Mois précédent"} onClick={() => changeMonth(-1)} className="size-8 rounded-full border border-border text-accent hover:bg-accent/10 disabled:opacity-30">‹</button>
          <p aria-live="polite" className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(month)}</p>
          <button type="button" disabled={!!max && dateKey(new Date(month.getFullYear(), month.getMonth() + 1, 1)) > max} aria-label={en ? "Next month" : "Mois suivant"} onClick={() => changeMonth(1)} className="size-8 rounded-full border border-border text-accent hover:bg-accent/10 disabled:opacity-30">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {(en ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]).map((day) => <span key={day} className="pb-2 text-[11px] font-medium text-muted">{day}</span>)}
          {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
            const key = dateKey(date);
            return <button key={key} type="button" disabled={!allowed(key)} data-day={i + 1} data-today={key === today} aria-pressed={value === key} aria-current={key === today ? "date" : undefined} aria-label={new Intl.DateTimeFormat(language, { dateStyle: "full" }).format(date)} onClick={() => { setValue(key); close(); }} onKeyDown={(event) => {
              const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
              if (delta) {
                event.preventDefault();
                const nextDay = i + 1 + delta;
                const next = new Date(month.getFullYear(), month.getMonth(), nextDay);
                if (!allowed(dateKey(next))) return;
                if (nextDay < 1 || nextDay > days) {
                  setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
                  requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-day="${next.getDate()}"]`)?.focus());
                } else root.current?.querySelector<HTMLButtonElement>(`[data-day="${nextDay}"]`)?.focus();
              }
            }} className={`aspect-square rounded-lg text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-30 ${value === key ? "bg-accent text-background" : key === today ? "border border-accent/50 text-accent hover:bg-accent/10" : "hover:bg-accent/10 hover:text-accent"}`}>{i + 1}</button>;
          })}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-3 text-xs">
          {!required && <button type="button" onClick={() => { setValue(""); close(); }} className="min-h-11 text-muted hover:text-foreground">{en ? "Clear" : "Effacer"}</button>}
          <button type="button" disabled={!allowed(today)} onClick={() => { setValue(today); close(); }} className="ml-auto min-h-11 font-medium text-accent hover:brightness-110 disabled:opacity-30">{en ? "Today" : "Aujourd’hui"}</button>
        </div>
      </div>}
    </div>
  );
}
