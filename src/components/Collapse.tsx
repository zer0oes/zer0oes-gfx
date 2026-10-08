import type { ReactNode } from "react";

export function Collapse({ open, id, children }: { open: boolean; id?: string; children: ReactNode }) {
  return <div id={id} aria-hidden={!open} inert={!open} className={`grid transition-[grid-template-rows,opacity] duration-[260ms] ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>;
}
