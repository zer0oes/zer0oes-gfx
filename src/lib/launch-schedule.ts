// La programmation reste en heure de Paris, quelle que soit la zone du serveur.
export function parisScheduleParts(iso?: string) {
  if (!iso) return { day: "", time: "09:00" };
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (key: string) => parts.find((p) => p.type === key)!.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}
export function parseParisSchedule(day: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("Choisis une date et une heure de début valides.");
  const utc = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(utc)) throw new Error("Date de début invalide.");
  const matches = [1, 2].map((offset) => new Date(utc - offset * 3600000).toISOString()).filter((iso) => {
    const parts = parisScheduleParts(iso);
    return parts.day === day && parts.time === time;
  });
  if (matches.length !== 1) throw new Error("Cette heure est inexistante ou ambiguë au changement d’heure. Choisis une autre heure.");
  return matches[0];
}
