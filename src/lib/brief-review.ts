import type { Order } from "./store/types";

export function reviewedRevisions(revisions: NonNullable<Order["briefRevisions"]>, at: string, state: "consulted" | "acknowledged", now: string) {
  const target = revisions.find((revision) => revision.at === at);
  if (!target || (state === "acknowledged" && !target.consultedAt)) throw new Error("Consulte la modification avant de la prendre en compte.");
  return revisions.map((revision) => revision.at !== at ? revision : state === "consulted" ? { ...revision, consultedAt: revision.consultedAt ?? now } : { ...revision, acknowledgedAt: revision.acknowledgedAt ?? now });
}
