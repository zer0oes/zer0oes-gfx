"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

export function AdminLiveRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const dirty = useRef(false);
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    dirty.current = false;
    const editing = () => { dirty.current = true; };
    const submitted = () => { dirty.current = false; };
    document.addEventListener("input", editing);
    document.addEventListener("change", editing);
    document.addEventListener("submit", submitted);
    return () => {
      document.removeEventListener("input", editing);
      document.removeEventListener("change", editing);
      document.removeEventListener("submit", submitted);
    };
  }, [pathname]);
  useEffect(() => {
    if (pathname !== "/admin" && !/^\/admin\/(commandes|devis)(\/|$)/.test(pathname)) return;
    const refresh = () => {
      if (document.visibilityState !== "visible" || dirty.current || pending) return;
      startTransition(() => router.refresh());
    };
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [pathname, router, pending]);
  return null;
}
