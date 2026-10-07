"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { bannerMatches, type Banner } from "@/lib/promotions";
import { href, splitLocale, type Locale } from "@/lib/i18n";

export function AnnouncementBanners({ banners, locale }: { banners: Banner[]; locale: Locale }) {
  const pathname = usePathname();
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState("");
  useEffect(() => {
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
  if (!now) return null;
  const path = splitLocale(pathname).path;
  const tones = { violet: "from-accent/25 via-accent/10 to-accent-2/20", pink: "from-accent-3/25 via-accent/10 to-accent-3/15", teal: "from-accent-2/25 via-accent/10 to-accent-2/15" };
  return <div>{banners.filter((b) => bannerMatches(b, path, now)).map((b) => <aside key={b.id} aria-label={locale === "fr" ? "Annonce" : "Announcement"} className={`border-b border-border bg-gradient-to-r ${tones[b.tone]}`}>
    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 text-center text-sm">
      <p className="font-medium">{locale === "en" ? b.textEn || b.text : b.text}</p>
      {b.code && <button type="button" className="rounded-md border border-accent/50 bg-background/40 px-3 py-1 font-semibold" aria-label={`${locale === "fr" ? "Copier le code" : "Copy code"} ${b.code}`} onClick={async () => {
        try { await navigator.clipboard.writeText(b.code); setCopied(b.id); } catch { setCopied(""); }
      }}>{b.code}{copied === b.id ? " ✓" : ""}</button>}
      {b.link && <Link href={b.link.startsWith("/") ? href(locale, b.link) : b.link} className="font-semibold underline underline-offset-4">{locale === "en" ? b.linkLabelEn || b.linkLabel || "Learn more →" : b.linkLabel || "En profiter →"}</Link>}
    </div>
  </aside>)}</div>;
}
