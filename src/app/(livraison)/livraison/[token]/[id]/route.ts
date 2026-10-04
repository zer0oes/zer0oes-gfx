import { isDeliveryToken } from "@/lib/delivery";

// Ancienne adresse d'un fichier livré : renvoi vers l'espace commande (mêmes contrôles d'accès).
export async function GET(request: Request, { params }: RouteContext<"/livraison/[token]/[id]">) {
  const { token, id } = await params;
  if (!isDeliveryToken(token) || !/^[\w-]{1,60}$/.test(id)) return new Response("Introuvable", { status: 404 });
  return Response.redirect(new URL(`/commande/${token}/${id}`, request.url), 308);
}
