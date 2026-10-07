"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { inputClass } from "./ui";

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export function DatePicker({ name, label, locale }: { name: string; label: string; locale: Locale }) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState("");
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
    root.current?.querySelector<HTMLButtonElement>('[data-day][aria-pressed="true"], [data-today="true"], [data-day]')?.focus();
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const offset = month ? (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7 : 0;
  const days = month ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() : 0;
  const selected = value ? new Date(`${value}T12:00:00`) : null;
  const today = dateKey(new Date());
  const changeMonth = (delta: number) => setMonth((current) => current && new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <div ref={root} className="relative min-w-0" onKeyDown={(event) => { if (event.key === "Escape" && open) { event.preventDefault(); close(); } }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <span id={`${id}-label`} className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={value} />
      <button ref={trigger} type="button" aria-labelledby={`${id}-label ${id}-value`} aria-expanded={open} aria-controls={`${id}-calendar`} aria-haspopup="dialog" onClick={() => {
        if (!open) setMonth(selected ?? new Date());
        setOpen(!open);
      }} className={`${inputClass} flex items-center justify-between gap-3 text-left`}>
        <span id={`${id}-value`} className={value ? "" : "text-muted"}>{selected ? new Intl.DateTimeFormat(language, { day: "numeric", month: "long", year: "numeric" }).format(selected) : en ? "Choose a date" : "Choisir une date"}</span>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-accent"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
      </button>
      {open && month && <div id={`${id}-calendar`} role="dialog" aria-labelledby={`${id}-label`} className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-surface p-4 shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
        <div className="mb-4 flex items-center justify-between gap-2">
          <button type="button" aria-label={en ? "Previous month" : "Mois précédent"} onClick={() => changeMonth(-1)} className="size-8 rounded-full border border-border text-accent hover:bg-accent/10">‹</button>
          <p aria-live="polite" className="text-sm font-semibold capitalize">{new Intl.DateTimeFormat(language, { month: "long", year: "numeric" }).format(month)}</p>
          <button type="button" aria-label={en ? "Next month" : "Mois suivant"} onClick={() => changeMonth(1)} className="size-8 rounded-full border border-border text-accent hover:bg-accent/10">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {(en ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] : ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"]).map((day) => <span key={day} className="pb-2 text-[11px] font-medium text-muted">{day}</span>)}
          {Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
            const key = dateKey(date);
            return <button key={key} type="button" data-day={i + 1} data-today={key === today} aria-pressed={value === key} aria-current={key === today ? "date" : undefined} aria-label={new Intl.DateTimeFormat(language, { dateStyle: "full" }).format(date)} onClick={() => { setValue(key); close(); }} onKeyDown={(event) => {
              const delta = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
              if (delta) {
                event.preventDefault();
                const nextDay = i + 1 + delta;
                const next = new Date(month.getFullYear(), month.getMonth(), nextDay);
                if (nextDay < 1 || nextDay > days) {
                  setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
                  requestAnimationFrame(() => root.current?.querySelector<HTMLButtonElement>(`[data-day="${next.getDate()}"]`)?.focus());
                } else root.current?.querySelector<HTMLButtonElement>(`[data-day="${nextDay}"]`)?.focus();
              }
            }} className={`aspect-square rounded-lg text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${value === key ? "bg-accent text-background" : key === today ? "border border-accent/50 text-accent hover:bg-accent/10" : "hover:bg-accent/10 hover:text-accent"}`}>{i + 1}</button>;
          })}
        </div>
        <div className="mt-4 flex justify-between border-t border-border pt-3 text-xs">
          <button type="button" onClick={() => { setValue(""); close(); }} className="text-muted hover:text-foreground">{en ? "Clear" : "Effacer"}</button>
          <button type="button" onClick={() => { setValue(today); close(); }} className="font-medium text-accent hover:brightness-110">{en ? "Today" : "Aujourd’hui"}</button>
        </div>
      </div>}
    </div>
  );
}
