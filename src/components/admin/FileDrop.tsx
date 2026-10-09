"use client";

import { useId, useState } from "react";
import { formatBytes } from "@/lib/delivery";

// Zone de dépôt : glisser un fichier dessus, ou cliquer pour le choisir.
export function FileDrop({ file, onFile, accept, label, hint, disabled = false, compact = false }: {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  label: string;
  hint?: string;
  disabled?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const [over, setOver] = useState(false);
  const accepts = (f: File) => {
    if (!accept) return true;
    return accept.split(",").some((rule) => {
      const r = rule.trim().toLowerCase();
      if (r.startsWith(".")) return f.name.toLowerCase().endsWith(r);
      if (r.endsWith("/*")) return f.type.startsWith(r.slice(0, -1));
      return f.type === r;
    });
  };
  return (
    <label
      htmlFor={id}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (!disabled && dropped && accepts(dropped)) onFile(dropped);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition ${compact ? "px-3 py-4" : "px-4 py-6"} ${
        over ? "border-accent bg-accent/10" : file ? "border-accent/50 bg-accent/5" : "border-border hover:border-accent/60"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-6 text-accent" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
      {file ? (
        <span className="text-sm font-medium">
          {file.name} <span className="font-normal text-muted">· {formatBytes(file.size)}</span>
        </span>
      ) : (
        <span className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="block text-xs text-muted">Glisse-le ici ou clique pour le choisir{hint ? ` · ${hint}` : ""}</span>
        </span>
      )}
      <input id={id} type="file" accept={accept} disabled={disabled} className="sr-only" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  );
}
