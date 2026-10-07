"use client";
import { useState } from "react";
function localDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
export function MarketingDates({ startsAt = "", endsAt = "" }: { startsAt?: string; endsAt?: string }) {
  const [start, setStart] = useState(startsAt);
  const [end, setEnd] = useState(endsAt);
  return <div className="grid gap-4 sm:grid-cols-2">{[{ name: "startsAt", label: "Début (facultatif)", value: start, set: setStart }, { name: "endsAt", label: "Fin (facultative)", value: end, set: setEnd }].map((f) => <label key={f.name} className="grid gap-2 text-sm">{f.label}<input type="hidden" name={f.name} value={f.value} /><input type="datetime-local" defaultValue={localDate(f.value)} onChange={(e) => f.set(e.target.value ? new Date(e.target.value).toISOString() : "")} className="rounded-lg border border-border bg-background px-3 py-2" /><span className="text-xs text-muted">Heure locale de ton navigateur</span></label>)}</div>;
}
