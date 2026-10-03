import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Solde réglé", robots: { index: false } };

export default async function BalanceThanksPage({ searchParams }: PageProps<"/merci/solde">) {
  const { demo } = await searchParams;
  return (
    <PageHeader eyebrow="Paiement reçu" title="Merci !">
      Le solde de ta commande est réglé. Je t&apos;envoie tes fichiers définitifs très vite.
      {demo === "1" && <span className="mt-4 block text-sm text-amber-200">Mode démo : aucun paiement réel.</span>}
    </PageHeader>
  );
}
