import type { Metadata } from "next";
import { ContactForm, MessageForm } from "@/components/ContactForm";
import { ContactTabs, TabSlide } from "@/components/ContactTabs";
import { PageHeader } from "@/components/ui";
import { asLocale, href, type Locale } from "@/lib/i18n";
import { getPack, optionChoices } from "@/lib/pricing";
import { languageAlternates } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { tr } from "@/lib/translations-en";
import { site } from "@/data/site";

// Deux onglets : /contact (projet sur-mesure, par défaut) et /contact?onglet=message,
// chacun avec son titre de page
const tabsByLocale = {
  fr: [
    {
      id: "projet",
      label: "Projet sur-mesure",
      path: "/contact",
      metaTitle: "Projet sur-mesure",
      description: "Un projet d'overlay, d'alertes ou de widget sur mesure ? Demande un devis.",
      eyebrow: "Sur-mesure",
      title: "Parlons de ton projet",
      intro: "Refonte complète, widget interactif, identité pour un événement : décris-moi ton projet, je te réponds sous 48 h ouvrées avec une première estimation.",
    },
    {
      id: "message",
      label: "Message simple",
      path: "/contact?onglet=message",
      metaTitle: "Contact",
      description: "Une question sur une offre ou une idée de collaboration ? Écris-moi.",
      eyebrow: "Contact",
      title: "Une question ?",
      intro: "Une offre à préciser, une idée de collaboration ou autre chose : écris-moi, je réponds sous 48 h ouvrées.",
    },
  ],
  en: [
    {
      id: "projet",
      label: "Custom project",
      path: "/contact",
      metaTitle: "Custom project",
      description: "A custom overlay, alerts or widget project? Request a quote.",
      eyebrow: "Custom",
      title: "Let's talk about your project",
      intro: "Full redesign, interactive widget, identity for an event: tell me about your project and I'll reply within 2 business days with a first estimate.",
    },
    {
      id: "message",
      label: "Simple message",
      path: "/contact?onglet=message",
      metaTitle: "Contact",
      description: "A question about a package or an idea for a collaboration? Write to me.",
      eyebrow: "Contact",
      title: "A question?",
      intro: "A package to clarify, a collaboration idea or something else: write to me, I reply within 2 business days.",
    },
  ],
} as const;

const currentTab = (locale: Locale, onglet: string | string[] | undefined) => tabsByLocale[locale][onglet === "message" ? 1 : 0];

export async function generateMetadata({ params, searchParams }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = asLocale((await params).lang);
  const tab = currentTab(lang, (await searchParams).onglet);
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
  const { offre, onglet } = await searchParams;
  const current = currentTab(lang, onglet);
  const tab = current.id;
  const catalog = await getStore().getCatalog();
  const selectedPack = getPack(catalog.packs, typeof offre === "string" ? offre : undefined);
  const quote = selectedPack?.checkout === false;
  const aside = asideTexts[lang];

  return (
    <>
      {/* Le titre change avec l'onglet : même glissement que le formulaire */}
      <TabSlide tab={tab}>
        <PageHeader eyebrow={current.eyebrow} title={current.title}>
          {current.intro}
        </PageHeader>
      </TabSlide>
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
        <div>
          {/* Onglets alignés sur le bord gauche du formulaire */}
          <ContactTabs tabs={tabsByLocale[lang].map(({ id, label, path }) => ({ id, label, href: href(lang, selectedPack ? `${path}${path.includes("?") ? "&" : "?"}offre=${encodeURIComponent(selectedPack.id)}` : path) }))} active={tab} />
          <TabSlide tab={tab}>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {tab === "message" ? (
                <MessageForm />
              ) : (
                <ContactForm selectedOffer={selectedPack ? tr(lang, selectedPack.name) : undefined} defaultType={quote ? "Devis Univers complet" : undefined} optionChoices={optionChoices(catalog.options, lang)} />
              )}
            </div>
          </TabSlide>
        </div>
      </div>
    </>
  );
}
