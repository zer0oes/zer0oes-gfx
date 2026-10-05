import type { Metadata } from "next";
import { ContactForm, MessageForm } from "@/components/ContactForm";
import { ContactTabs, TabSlide } from "@/components/ContactTabs";
import { PageHeader } from "@/components/ui";
import { getPack, optionChoices } from "@/lib/pricing";
import { getStore } from "@/lib/store";
import { site } from "@/data/site";

// Deux onglets : /contact (projet sur-mesure, par défaut) et /contact?onglet=message,
// chacun avec son titre de page
const tabs = [
  {
    id: "projet",
    label: "Projet sur-mesure",
    href: "/contact",
    metaTitle: "Projet sur-mesure",
    description: "Un projet d'overlay, d'alertes ou de widget sur mesure ? Demande un devis.",
    eyebrow: "Sur-mesure",
    title: "Parlons de ton projet",
    intro: "Refonte complète, widget interactif, identité pour un événement : décris-moi ton projet, je te réponds sous 48 h ouvrées avec une première estimation.",
  },
  {
    id: "message",
    label: "Message simple",
    href: "/contact?onglet=message",
    metaTitle: "Contact",
    description: "Une question sur une offre ou une idée de collaboration ? Écris-moi.",
    eyebrow: "Contact",
    title: "Une question ?",
    intro: "Une offre à préciser, une idée de collaboration ou autre chose : écris-moi, je réponds sous 48 h ouvrées.",
  },
] as const;

const currentTab = (onglet: string | string[] | undefined) => tabs[onglet === "message" ? 1 : 0];

export async function generateMetadata({ searchParams }: PageProps<"/contact">): Promise<Metadata> {
  const t = currentTab((await searchParams).onglet);
  return { title: t.metaTitle, description: t.description };
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { offre, onglet } = await searchParams;
  const current = currentTab(onglet);
  const tab = current.id;
  const catalog = await getStore().getCatalog();
  const quote = getPack(catalog.packs, typeof offre === "string" ? offre : undefined)?.checkout === false;

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
            <h2 className="font-semibold text-foreground">Ce que je peux créer</h2>
            <ul className="mt-2 space-y-1">
              <li>Overlays de jeu et écrans de scène</li>
              <li>Alertes animées et sonores</li>
              <li>Widgets (objectifs, chat, événements)</li>
              <li>Emotes, badges, bannières</li>
              <li>Transitions et stingers</li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Par e-mail</h2>
            <a href={`mailto:${site.email}`} className="mt-2 block text-accent hover:underline">
              {site.email}
            </a>
          </div>
        </aside>
        <div>
          {/* Onglets alignés sur le bord gauche du formulaire */}
          <ContactTabs tabs={tabs.map(({ id, label, href }) => ({ id, label, href }))} active={tab} />
          <TabSlide tab={tab}>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {tab === "message" ? (
                <MessageForm />
              ) : (
                <ContactForm defaultType={quote ? "Devis Univers complet" : undefined} optionChoices={optionChoices(catalog.options)} />
              )}
            </div>
          </TabSlide>
        </div>
      </div>
    </>
  );
}
