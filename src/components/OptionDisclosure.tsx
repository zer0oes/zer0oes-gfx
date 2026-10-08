"use client";

import { useId, useState, type ReactNode } from "react";

export function OptionDisclosure({ label, price, children }: { label: ReactNode; price: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="py-3">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        <span>{label}</span>
        {!open && price}
        <span aria-hidden className={`${open ? "ml-auto " : ""}shrink-0 text-accent`}>{open ? "−" : "+"}</span>
      </button>
      <div id={id} aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
