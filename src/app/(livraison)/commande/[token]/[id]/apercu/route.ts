import sharp from "sharp";
import { isDeliveryToken, mediaKind, previewPublished } from "@/lib/delivery";
import { requireAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { filesExpired } from "@/lib/portal";
import { applyWatermark } from "@/lib/watermark-core";

// Aperçu protégé d'un élément livré, visible avant validation :
// - image : redimensionnée (1280 px max) et filigranée en mosaïque légère, générée à chaque demande ;
//   à défaut d'aperçu dédié, elle est tirée du visuel final (jamais servi tel quel) ;
// - vidéo : l'aperçu basse résolution envoyé par Aurore (lien temporaire de 10 minutes).
export async function GET(request: Request, { params }: RouteContext<"/commande/[token]/[id]/apercu">) {
  const { token, id } = await params;
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "private, no-store" };
  const notFound = () => new Response("Aperçu introuvable", { status: 404, headers });
  if (!isDeliveryToken(token)) return notFound();
  const store = getStore();
  const order = await store.getOrderByDeliveryToken(token);
  if (!order) return notFound();
  if (filesExpired(order)) {
    try { await requireAdmin(); } catch { return new Response("Accès expiré.", { status: 410, headers }); }
  }
  const item = (await store.listDeliverables(order.id)).find((d) => d.id === id);
  if (!item || !store.readDeliverableFile) return notFound();
  const version = new URL(request.url).searchParams.get("version");
  const archived = version !== null && /^\d+$/.test(version) ? item.previewVersions?.[Number(version)] : undefined;
  if (version !== null && !archived) return notFound();
  const lastPublished = item.previewVersions?.at(-1);
  let admin = false;
  if (!previewPublished(item) && !archived) {
    if (lastPublished) {
      // Une nouvelle version en préparation ne remplace pas l'aperçu publié.
    } else {
    try { await requireAdmin(); } catch { return notFound(); }
    admin = true;
    }
  }

  const source = archived?.path ?? (!previewPublished(item) && !admin ? lastPublished?.path : undefined) ?? item.previewPath ?? (mediaKind(item.storagePath) === "image" ? item.storagePath : undefined);
  if (!source) return notFound();

  if ((item.previewType ?? mediaKind(source)) === "video") {
    // Aucune vidéo originale n’est exposée comme aperçu sans transcodage garanti.
    return notFound();
  }

  const resized = await sharp(await store.readDeliverableFile(source), { animated: false })
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const marked = await applyWatermark(new Uint8Array(resized), "mosaique");
  return new Response(Buffer.from(marked!.data), { headers: { ...headers, "Content-Type": marked!.type } });
}
