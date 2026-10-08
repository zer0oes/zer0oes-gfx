"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function ClickableRow({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return <tr className="relative cursor-pointer hover:bg-surface/60" onClick={(event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("a, button, input, select, textarea, label") || window.getSelection()?.toString()) return;
    if (event.ctrlKey || event.metaKey) window.open(href, "_blank", "noopener,noreferrer");
    else router.push(href);
  }}>{children}</tr>;
}
