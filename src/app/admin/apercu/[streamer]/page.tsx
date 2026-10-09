import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PagePreview } from "@/components/admin/PagePreview";
import { ProtectionProvider } from "@/components/protection";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";

export const metadata: Metadata = { title: "Aperçu" };

// Aperçu en direct de l'éditeur de mise en page (affiché dans un cadre) : la page reçoit
// la mise en page en cours par message, sans rien enregistrer.
export default async function PreviewPage({ params }: PageProps<"/admin/apercu/[streamer]">) {
  await requireAdmin();
  const { streamer: id } = await params;
  const store = getStore();
  const [{ streamers, works }, protection] = await Promise.all([store.getPortfolio(), store.getProtection()]);
  const streamer = streamers.find((s) => s.id === decodeURIComponent(id));
  if (!streamer) notFound();
  return (
    <ProtectionProvider value={protection}>
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-2 sm:px-6">
        <PagePreview works={works.filter((w) => w.streamer === streamer.id)} streamerName={streamer.name} />
      </main>
    </ProtectionProvider>
  );
}
