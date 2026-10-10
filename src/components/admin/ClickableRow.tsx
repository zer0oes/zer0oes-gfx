"use client";
import { useRouter } from "next/navigation";
import type { HTMLAttributes, ReactNode } from "react";

// rest : attributs supplémentaires de la ligne (ex. data-* pour le glisser-déposer)
export function ClickableRow({ href, children, ...rest }: { href: string; children: ReactNode } & HTMLAttributes<HTMLTableRowElement> & Record<`data-${string}`, unknown>) {
  const router = useRouter();
  return <tr {...rest} className="relative cursor-pointer hover:bg-surface/60" onClick={(event) => {
    const target = event.target;
    if (!(target instanceof Element) || target.closest("a, button, input, select, textarea, label, dialog") || window.getSelection()?.toString()) return;
    if (event.ctrlKey || event.metaKey) window.open(href, "_blank", "noopener,noreferrer");
    else router.push(href);
  }}>{children}</tr>;
}
