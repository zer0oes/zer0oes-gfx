"use client";
import { useState } from "react";
import { DatePicker } from "@/components/DatePicker";

// Jour local (AAAA-MM-JJ) d'une date ISO, et retour : début du jour pour « Début », fin du jour pour « Fin »
const dayOf = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toIso = (day: string, end: boolean) => (day ? new Date(`${day}T${end ? "23:59:59.999" : "00:00:00"}`).toISOString() : "");

export function MarketingDates({ startsAt = "", endsAt = "" }: { startsAt?: string; endsAt?: string }) {
  const [start, setStart] = useState(startsAt);
  const [end, setEnd] = useState(endsAt);
  return <div className="grid gap-4 sm:grid-cols-2">
    <div><input type="hidden" name="startsAt" value={start} /><DatePicker name="startsAtDay" label="Début (facultatif)" locale="fr" defaultValue={dayOf(startsAt)} onChange={(day) => setStart(toIso(day, false))} /><span className="mt-1 block text-xs text-muted">Dès le début de ce jour.</span></div>
    <div><input type="hidden" name="endsAt" value={end} /><DatePicker name="endsAtDay" label="Fin (facultative)" locale="fr" defaultValue={dayOf(endsAt)} onChange={(day) => setEnd(toIso(day, true))} /><span className="mt-1 block text-xs text-muted">Jusqu’à la fin de ce jour.</span></div>
  </div>;
}
