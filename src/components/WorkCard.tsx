import Image from "next/image";
import Link from "next/link";
import { categories, type Work } from "@/data/portfolio";
import { t } from "@/lib/i18n";
import { tr } from "@/lib/translations-en";
import { useLocale } from "./I18nProvider";
import { HoverVideo } from "./HoverVideo";
import { ProtectedMedia } from "./protection";

export function WorkCard({
  work,
  onOpen,
  href,
  showStreamer = true,
  streamerName,
}: {
  work: Work;
  streamerName?: string;
  onOpen?: () => void;
  // Lien vers une page (alternative à onOpen)
  href?: string;
  showStreamer?: boolean;
}) {
  const locale = useLocale();
  const category = tr(locale, categories.find((c) => c.id === work.category)?.label);
  return (
    <article data-hover-root className="group relative overflow-hidden rounded-2xl border border-border bg-surface transition focus-within:border-accent hover:-translate-y-1 hover:border-accent/60">
      <div className="relative aspect-video overflow-hidden">
        {work.image ? (
          <ProtectedMedia className="absolute inset-0">
            <Image
              src={work.image}
              alt={work.title}
              fill
              draggable={false}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-500 group-hover:scale-105"
            />
            {work.video && <HoverVideo src={work.video} />}
          </ProtectedMedia>
        ) : (
          // Vignette provisoire tant qu'aucun visuel n'est fourni
          <div
            className="flex h-full items-center justify-center transition duration-500 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${work.colors[0]}, ${work.colors[1]})` }}
            aria-hidden
          >
            <span className="font-display text-2xl font-bold text-white/90 drop-shadow">{work.title}</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
          {category}
        </span>
        {work.video && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 px-3 py-1 text-xs font-medium backdrop-blur">
            <span aria-hidden>▶</span> {t(locale, { fr: "Animé", en: "Animated" })}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-semibold">
          {href ? (
            <Link href={href} className="outline-none after:absolute after:inset-0 after:z-[5] after:content-['']">
              {work.title}
            </Link>
          ) : onOpen ? (
            // Le bouton couvre toute la carte (motif « carte cliquable »)
            <button
              type="button"
              onClick={onOpen}
              aria-haspopup="dialog"
              className="text-left outline-none after:absolute after:inset-0 after:z-[5] after:content-['']"
            >
              {work.title}
            </button>
          ) : (
            work.title
          )}
        </h3>
        <p className="mt-1 text-sm text-muted">{work.description}</p>
        {showStreamer && streamerName && <p className="mt-3 text-xs text-muted/70">{t(locale, { fr: "Chaîne :", en: "Channel:" })} {streamerName}</p>}
      </div>
    </article>
  );
}
