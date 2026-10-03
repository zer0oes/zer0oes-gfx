import type { Metadata } from "next";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Overlays, alertes et widgets réalisés pour des streameurs et créateurs de contenu.",
};

export default function PortfolioPage() {
  return (
    <>
      <PageHeader eyebrow="Portfolio" title="Réalisations">
        Overlays, widgets, alertes et emotes, rangés par streameur.
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <PortfolioGallery />
      </div>
    </>
  );
}
