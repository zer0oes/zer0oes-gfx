import type { Deliverable } from "./store/types";

export function previewHistory(item: Pick<Deliverable, "previewVersions" | "clientNotes">) {
  const versions = item.previewVersions ?? [];
  const notes = item.clientNotes ?? [];
  return versions.map((version, index) => ({
    ...version,
    notes: notes.filter((note) => {
      const at = Date.parse(note.at);
      const start = index === 0 ? -Infinity : Date.parse(version.publishedAt);
      const end = versions[index + 1] ? Date.parse(versions[index + 1].publishedAt) : Infinity;
      return at >= start && at < end;
    }),
  }));
}
