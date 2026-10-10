import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader } from "@/components/ui";
import { asLocale } from "@/lib/i18n";
import { activePacks, getPack, optionChoices } from "@/lib/pricing";
import { languageAlternates } from "@/lib/seo";
import { getPublicCatalog } from "@/lib/public-catalog";
import { trDeep } from "@/lib/translations-en";
import { site } from "@/data/site";
import { INSTALL_OPTION_ID } from "@/lib/brief-delivery";

const contactTexts = {
  fr: {
      path: "/contact",
      metaTitle: "Contact",
      description: "Un projet sur mesure, une question ou une collaboration ? Contacte-moi, je te réponds sous 48 h ouvrées.",
      eyebrow: "Contact",
      title: "Parlons de tes idées",
      intro: "Un projet sur mesure, une question sur mes offres ou une idée de collaboration ? Choisis le sujet et écris-moi quelques mots. Je te réponds sous 48 h ouvrées.",
    },
  en: {
      path: "/contact",
      metaTitle: "Contact",
      description: "A custom project, a question or a collaboration? Get in touch and I'll reply within 2 business days.",
      eyebrow: "Contact",
      title: "Let's talk about your ideas",
      intro: "A custom project, a question about my packages or a collaboration idea? Choose a subject and tell me a little about it. I'll reply within 2 business days.",
    },
} as const;

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const tab = contactTexts[lang];
  return { title: tab.metaTitle, description: tab.description, alternates: languageAlternates(lang, tab.path) };
}

const asideTexts = {
  fr: {
    create: "Ce que je peux créer",
    items: ["Overlays de jeu et écrans de scène", "Alertes animées et sonores", "Widgets (objectifs, chat, événements)", "Emotes, badges, bannières", "Transitions et stingers"],
    email: "Par e-mail",
  },
  en: {
    create: "What I can create",
    items: ["Game overlays and scene screens", "Animated alerts with sound", "Widgets (goals, chat, events)", "Emotes, badges, banners", "Transitions and stingers"],
    email: "By email",
  },
};

export default async function ContactPage({ params, searchParams }: PageProps<"/[lang]/contact">) {
  const lang = asLocale((await params).lang);
  const { offre, sujet, option } = await searchParams;
  const current = contactTexts[lang];
  const originalCatalog = await getPublicCatalog();
  const catalog = trDeep(lang, originalCatalog);
  const selectedPack = getPack(catalog.packs, typeof offre === "string" ? offre : undefined);
  const quote = selectedPack?.checkout === false;
  const selectedOption = originalCatalog.options.find((o) => o.id === option);
  const aside = asideTexts[lang];

  return (
    <>
      <PageHeader eyebrow={current.eyebrow} title={current.title}>
        {current.intro}
      </PageHeader>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_2fr]">
        <aside className="space-y-6 text-sm text-muted">
          <div>
            <h2 className="font-semibold text-foreground">{aside.create}</h2>
            <ul className="mt-2 space-y-1">
              {aside.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">{aside.email}</h2>
            <a href={`mailto:${site.email}`} className="mt-2 block text-accent hover:underline">
              {site.email}
            </a>
          </div>
        </aside>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <ContactForm selectedOptionId={selectedOption?.id} selectedOffer={selectedPack?.name ?? selectedOption?.name} defaultType={selectedOption ? "Demande de devis" : sujet === "offre" ? "Question sur une offre" : quote ? "Devis Univers complet" : undefined} offerChoices={activePacks(catalog.packs).map((pack) => pack.name)} optionChoices={optionChoices(originalCatalog.options.filter((o) => o.id !== INSTALL_OPTION_ID), lang)} />
        </div>
      </div>
    </>
  );
}
