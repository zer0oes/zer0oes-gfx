import { trDeep } from "@/lib/translations-en";
import Image from "next/image";
import Link from "next/link";
import type { Work } from "@/data/portfolio";
import type { Locale } from "@/lib/i18n";
import type { Testimonial } from "@/lib/store/types";

// Avis client publié (avec son accord) : à afficher seulement si testimonial.consent
export function publishedQuote(t: Testimonial | undefined, locale: Locale) {
  if (!t?.consent) return null;
  return { ...trDeep(locale, t), text: locale === "en" && t.quoteEn ? t.quoteEn : t.quote };
}

// Image du client à côté de son avis : l'avatar du projet s'il existe, sinon son logo
export function testimonialImage(works: Work[], streamerId: string) {
  const own = works.filter((w) => w.streamer === streamerId && w.image);
  return (own.find((w) => /avatar/i.test(w.id) || /avatar/i.test(w.title)) ?? own.find((w) => w.category === "logo"))?.image;
}

// Guillemet en dégradé (couleur de départ → couleur d'arrivée)
const quoteMark = (from: string, to: string): React.CSSProperties => ({
  backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
});

// Grande citation éditoriale : guillemets dégradés, phrase en grand, puis nom, lien et avatar (ou logo) à droite,
// du client et lien vers le projet.
export function TestimonialQuote({
  testimonial,
  locale,
  href,
  projectName,
  image,
}: {
  testimonial: Testimonial;
  locale: Locale;
  href?: string;
  projectName?: string;
  image?: string;
}) {
  const q = publishedQuote(testimonial, locale);
  if (!q) return null;
  return (
    <figure className="mx-auto w-fit max-w-4xl" lang={locale === "en" && !testimonial.quoteEn ? "fr" : undefined}>
      {/* Guillemets collés au texte : ouvrant en haut à gauche (rose → bleu), fermant en bas à droite (bleu → rose) */}
      <blockquote className="relative block px-9 py-4 text-center font-display text-xl font-bold leading-snug sm:px-12 sm:text-3xl">
        <span aria-hidden className="absolute left-0 top-0 select-none font-display text-4xl leading-none sm:text-6xl" style={quoteMark("var(--accent-3)", "var(--accent-2)")}>
          “
        </span>
        <p className="whitespace-pre-line">{q.text}</p>
        <span aria-hidden className="absolute -bottom-2 right-0 select-none font-display text-4xl leading-none sm:-bottom-4 sm:text-6xl" style={quoteMark("var(--accent-2)", "var(--accent-3)")}>
          ”
        </span>
      </blockquote>
      <figcaption className="mt-6 flex flex-row-reverse items-center justify-start gap-3 pr-9 sm:pr-12">
        {image && (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-background">
            <Image src={image} alt="" fill sizes="48px" className="object-cover" draggable={false} />
          </span>
        )}
        <span className="text-right">
          <span className="block font-semibold">
            {q.author}
            {q.role && <span className="font-normal text-muted"> · {q.role}</span>}
          </span>
          {href && projectName && (
            <Link href={href} className="block text-sm text-accent underline-offset-4 hover:underline">
              {locale === "en" ? `See the ${projectName} project →` : `Voir le projet ${projectName} →`}
            </Link>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
