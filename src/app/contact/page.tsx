import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHeader } from "@/components/ui";
import { getPack } from "@/data/packs";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Sur-mesure & contact",
  description: "Un projet d'overlay, d'alertes ou de widget sur mesure ? Demandez un devis.",
};

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { offre } = await searchParams;
  const quote = getPack(typeof offre === "string" ? offre : undefined)?.checkout === false;

  return (
    <>
      <PageHeader eyebrow="Sur-mesure" title="Parlons de votre projet">
        Refonte complète, widget interactif, identité pour un événement ou simple question : écrivez-moi, je réponds
        sous 48 h ouvrées.
      </PageHeader>
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
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <ContactForm defaultType={quote ? "Devis Univers complet" : undefined} />
        </div>
      </div>
    </>
  );
}
