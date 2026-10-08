"use client";

import { useId, useState, type ReactNode } from "react";
import { Collapse } from "./Collapse";

export function PreviewActions({ approval, correction, label }: { approval?: ReactNode; correction?: ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-3 [&>form]:flex [&>form]:flex-[1_1_13rem]">
        {correction && <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex min-h-12 flex-[1_1_13rem] items-center justify-center rounded-full border border-accent/60 px-5 py-3 text-center text-sm font-semibold leading-5 hover:border-accent hover:bg-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{label}</button>}
        {approval}
      </div>
      {correction && <Collapse open={open} id={id}><div className="mt-3">{correction}</div></Collapse>}
    </div>
  );
}
