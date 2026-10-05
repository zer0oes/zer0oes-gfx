import { recordBrowserEvent } from "@/lib/stats-server";

// Statistiques de visite : pages vues et clics envoyés par le site (composant Analytics).
// Répond toujours 204 : le visiteur n'a rien à attendre de cette route.
export async function POST(request: Request) {
  await recordBrowserEvent(request);
  return new Response(null, { status: 204 });
}
