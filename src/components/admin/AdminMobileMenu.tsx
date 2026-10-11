"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/admin/actions";
import { AdminNavigation } from "./AdminNavigation";
import { MaterialIcon } from "./MaterialIcon";

export function AdminMobileMenu({ email, pendingOrders, pendingQuotes }: { email: string; pendingOrders: number; pendingQuotes: number }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktop.matches) dialog.close(); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [open]);

  return <>
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
      <Link href="/admin" aria-label="Tableau de bord — zer0oes gfx" className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-accent">
        <Image src="/favicon.ico" alt="" width={32} height={32} unoptimized className="size-8 object-contain" />
        <span className="font-display text-sm font-semibold">Administration</span>
      </Link>
      <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-controls="admin-mobile-menu" className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-accent">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        Menu
        {pendingOrders + pendingQuotes > 0 && <span className="size-2 rounded-full bg-accent" aria-label="Demandes en attente" />}
      </button>
    </header>
    <dialog ref={dialogRef} id="admin-mobile-menu" aria-labelledby="admin-mobile-title" onClose={() => setOpen(false)} onClick={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) event.currentTarget.close();
    }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground backdrop:bg-surface">
      <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="shrink-0 border-b border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="admin-mobile-title" className="font-display text-lg font-semibold">Administration</h2>
            <button type="button" autoFocus onClick={() => dialogRef.current?.close()} aria-label="Fermer le menu" className="flex size-11 items-center justify-center rounded-xl bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"><MaterialIcon name="close" /></button>
          </div>
          <p className="mt-2 truncate text-xs text-muted">{email}</p>
        </div>
        {open && <AdminNavigation id="admin-mobile-navigation" initialPendingOrders={pendingOrders} initialPendingQuotes={pendingQuotes} onNavigate={() => dialogRef.current?.close()} />}
        <form action={logoutAction} className="shrink-0 border-t border-border p-3">
          <button type="submit" className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent"><MaterialIcon name="logout" />Déconnexion</button>
        </form>
      </div>
    </dialog>
  </>;
}
