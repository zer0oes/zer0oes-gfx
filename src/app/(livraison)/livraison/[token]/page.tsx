import { notFound, permanentRedirect } from "next/navigation";
import { isDeliveryToken } from "@/lib/delivery";

// Ancienne adresse de la page de livraison : les liens déjà envoyés mènent à l'espace commande.
export default async function OldDeliveryPage({ params }: PageProps<"/livraison/[token]">) {
  const { token } = await params;
  if (!isDeliveryToken(token)) notFound();
  permanentRedirect(`/commande/${token}`);
}
